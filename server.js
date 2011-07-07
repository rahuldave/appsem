/* A NodeJS server that statically serves javascript out, proxies solr requests,
 and handles authentication through the ADS */

var SOLRHOST='labs.adsabs.harvard.edu'
var SOLRURL='/semanticsolr2/solr'
var SOLRHOST='localhost'
var SOLRURL='/solr'
var ADSHOST='adsabs.harvard.edu'
var ADSURL='/cgi-bin/insert_login/credentials/'
var TDIR=__dirname + '/static/ajax-solr/templates/'
//SOLRHOST='localhost'
//SOLRURL='/solr'
var connect=require('connect');
var connectutils=connect.utils;
var http=require('http');
var url=require('url');
var mustache=require('mustache');
var fs=require('fs');
var redis_client = require("redis").createClient();
var RedisStore = require('connect-redis')(connect);
//var uuid = require('node-uuid');



var maint=fs.readFileSync( TDIR+'template.html','utf-8');
var partials={
    pagehead : fs.readFileSync( TDIR+'pagehead.html','utf-8'),
    bodyhead : fs.readFileSync( TDIR+'bodyhead.html','utf-8'),
    bodyright : fs.readFileSync( TDIR+'bodyright.html','utf-8'),  
};
//bodyright : fs.readFileSync( TDIR+'bodyright.html','utf-8'),
//bodyleft : fs.readFileSync( TDIR+'bodyleft_publications.html','utf-8')
var bodybodypub=fs.readFileSync( TDIR+'bodybody_publications.html','utf-8');
var bodybodysearch=fs.readFileSync( TDIR+'bodybody_search.html','utf-8');
var bodybodysaved=fs.readFileSync( TDIR+'bodybody_saved.html','utf-8');
/*solroptions={
    host:SOLRHOST,
    path:SOLRURL
}*/
var globpartialsjson=JSON.stringify(partials);


function doProxy(proxyoptions, req, res){
    console.log("-----------------Request " + req.method + " " + req.url);
    var proxy_request=http.get(proxyoptions, function(proxy_response){
        //proxy_request.addListener('response', function (proxy_response) {
            proxy_response.addListener('data', function(chunk) {
                //console.log("response.write");
                res.write(chunk, 'binary');
            });
            proxy_response.addListener('end', function() {
                //console.log("response.end");
                res.end();
            });
            res.writeHead(proxy_response.statusCode, proxy_response.headers);
        //});
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
    //BELOW is not needed. presumably helps in POST
    req.addListener('data', function(chunk) {
        //console.log("proxyrequest.write");
        proxy_request.write(chunk, 'binary');
    });
    req.addListener('end', function() {
        //console.log("proxyrequest.end");
        proxy_request.end();
    });
    //next();
}

function postHandler(req, res, tcallback){
    if (req.method==='POST'){
        var completebuffer='';
        req.addListener('data', function(chunk) {
            //console.log("proxyrequest.write");
            completebuffer+=chunk;
        });
        req.addListener('end', function() {
            //console.log("proxyrequest.end");
            tcallback(completebuffer, req, res);//this can be sync or async
            //res.writeHead(200, proxy_response.headers);
            
        });
    }
}
function doTransformedProxy(proxyoptions, req, res, transformcallback){
    console.log("TP-----------------Request " + req.method + " " + req.url);
    var completebuffer='';
    var proxy_request=http.get(proxyoptions, function(proxy_response){
        //proxy_request.addListener('response', function (proxy_response) {
            proxy_response.addListener('data', function(chunk) {
                //console.log("response.write");
                completebuffer=completebuffer+chunk;
                //res.write(chunk, 'binary');
            });
            proxy_response.addListener('end', function() {
                console.log("response.end");
                res.end(transformcallback(completebuffer));
            });
            res.writeHead(proxy_response.statusCode, proxy_response.headers);
        //});
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
    //BELOW is not needed. presumably helps in POST
    req.addListener('data', function(chunk) {
        //console.log("proxyrequest.write");
        proxy_request.write(chunk, 'binary');
    });
    req.addListener('end', function() {
        //console.log("proxyrequest.end");
        proxy_request.end();
    });
    //next();
}

var solrrouter=connect(
    connect.router(function(app){
       app.get('/select', function(req, res){
           var solroptions={
                host:SOLRHOST,
                path:SOLRURL+req.url,
                port:3001
            };
           doProxy(solroptions, req, res);
       }); 
    })
);

function makelogincookie(cookiename,  cookievalue, days){
    var secs=days*24*60*60;
    var milisecs=secs*1000;
    var expdate=new Date(Date.now()+milisecs);
    var cookie=connectutils.serializeCookie(cookiename, cookievalue, {'expires':expdate, 'path': '/'});
    return {unique:cookievalue, cookie:cookie, expdateinsecs:secs};
}



function insertUser(jsonpayload, req, res, next){
    var logincookie=makelogincookie('logincookie', connectutils.uid(16), 365);
    var responsedo=function(err, reply){
        res.writeHead(200, "OK", {'Content-Type': 'application/json',
                'Set-Cookie': logincookie['cookie']
        });
        res.end();
    };
    var mystring=jsonpayload;
    console.log('[['+mystring+']]')
    var jsonobj=JSON.parse(mystring);
    var email=jsonobj['email'];
    Object.keys(jsonobj).forEach(function(key){
            redis_client.hset(email, key, jsonobj[key]);
            redis_client.hset(email, 'dajson', jsonpayload);
            redis_client.hset(email, 'cookieval', logincookie['cookie']);
    });
    //Since thenext set will be the last one the others will have completed.Not that it matters as we dont error handle right now.
    //redis_client.setex('auth:'+logincookie['unique'], logincookie['expdateinsecs'], logincookie['cookie']);
    //on the fly we'll have savedsearches:email and savedpubs:email
    redis_client.setex('email:'+logincookie['unique'], logincookie['expdateinsecs'], email, responsedo);

}

function saveSearch(jsonpayload, req, res, next){
    console.log("savedsearchcookies", req.cookies, jsonpayload);
    var logincookie=req.cookies['logincookie'];
    var jsonobj=JSON.parse(jsonpayload);
    var savedsearch=jsonobj['savedsearch'];
    var email;
    var sendback={};
    if (logincookie==undefined){
        res.writeHead(200, "OK", {'Content-Type': 'application/json'});
        sendback['success']='undefined';
        res.end(JSON.stringify(sendback));
        return; 
    }
    redis_client.get('email:'+logincookie,function(err, reply){
        email=reply;
        redis_client.sadd('savedsearch:'+email, savedsearch, function(err, reply){
            res.writeHead(200, "OK", {'Content-Type': 'application/json'});
            sendback['success']='defined';
            res.end(JSON.stringify(sendback));
        });    
    });
    
    
}

function savePub(jsonpayload, req, res, next){
    console.log("savedpubcookies", req.cookies, jsonpayload);
    var logincookie=req.cookies['logincookie'];
    var jsonobj=JSON.parse(jsonpayload);
    var savedpub=jsonobj['savedpub'];
    var email;
    var sendback={};
    if (logincookie==undefined){
        res.writeHead(200, "OK", {'Content-Type': 'application/json'});
        sendback['success']='undefined';
        res.end(JSON.stringify(sendback));
        return; 
    }
    redis_client.get('email:'+logincookie,function(err, reply){
        console.log("REPLY", reply);
        email=reply;
        //the reason this must be done here is that its only in the response to the next call
        //that email is set. Not in the request.
        redis_client.sadd('savedpub:'+email, savedpub, function(err, reply){
            console.log("is email set", email);
            res.writeHead(200, "OK", {'Content-Type': 'application/json'});
            sendback['success']='defined';
            res.end(JSON.stringify(sendback));
        });
    });
    /*redis_client.sadd('savedpub:'+email, savedpub, function(err, reply){
        console.log("is email set", email);
        res.writeHead(200, "OK", {'Content-Type': 'application/json'
        });
        res.end();
    });*/
}

function loginUser(req, res, next){
    var urlparse=url.parse(req.url, true);
    var redirect=urlparse.query.redirect;
    var currenttoken=connectutils.uid(16);
    var adsurl='http://adsabs.harvard.edu/cgi-bin/nph-manage_account?man_cmd=login&man_url='+redirect;
    var startupcookie=makelogincookie('startupcookie',currenttoken, 0.005)
    console.log('REDIRECT',redirect);
    var responsedo=function(err, reply){
        res.writeHead(302, "Redirect", {
            'Set-Cookie': startupcookie['cookie'],
            'Location': redirect
        });
        res.statusCode = 302;
        res.end();
    };
    responsedo();
    //redis_client.set('startup:'+currenttoken, currenttoken, responsedo)
}
function logoutUser(req, res, next){
     console.log("::::::::::logoutCookies", req.cookies);
     var logincookie=req.cookies['logincookie'];
     var newlogincookie=makelogincookie('logincookie', logincookie, -1);
     var redirect=url.parse(req.url, true).query.redirect
     var responsedo=function(err, reply){
        res.writeHead(302, "Redirect", {
                'Set-Cookie': newlogincookie['cookie'],
                'Location': redirect
        });
        res.statusCode = 302;
        res.end();
     };
     //expire it now
     redis_client.expire('email:'+logincookie, 0, responsedo);
}
function getUser(req, res, next){
    var stashmail;
    var logincookie=req.cookies['logincookie'];
    var startupcookie=req.cookies['startupcookie'];
    var sendback={};
    if (startupcookie){
        var newstartupcookie=makelogincookie('startupcookie', startupcookie, -1);
    }
    sendback.startup=startupcookie ? startupcookie : 'undefined';
    if (logincookie===undefined){
        var headerdict={'Content-Type': 'application/json'};
        if (startupcookie){
            headerdict['Set-Cookie']=newstartupcookie['cookie'];
        }
        res.writeHead(200, "OK", headerdict);
        sendback.email='undefined';
        stashmail=JSON.stringify(sendback);
        console.log("REPLY",stashmail);
        res.end(stashmail);
        return;
    }
    res.writeHead(200, "OK", {'Content-Type': 'application/json'});
    console.log('==================',logincookie);    
    redis_client.get('email:'+logincookie, function(err, reply){
        if (err) {
            //not really an error but user aint there
            next(err);
        } else {
            sendback.email=String(reply);
            stashmail=JSON.stringify(sendback);
            console.log("REPLY",stashmail);
            res.end(stashmail);
            
        }        
    });
}

function getSavedSearches(req, res, next){

    var logincookie=req.cookies['logincookie'];
    var email;
    var sendback={};
    //this punts on the issue of having to make this extra call
    if (logincookie==undefined){
        res.writeHead(200, "OK", {'Content-Type': 'application/json'});
        sendback['savedsearches']='undefined';
        res.end(JSON.stringify(sendback));
        return;
    }
    redis_client.get('email:'+logincookie,function(err, reply){
        email=reply;
        redis_client.smembers('savedsearch:'+email,  function(err, reply){
            res.writeHead(200, "OK", {'Content-Type': 'application/json'});
            console.log("GETSAVEDSEARCHESREPLY", reply, err);
            sendback['savedsearches']=reply;
            //sendback[logincookie]=email;
            res.end(JSON.stringify(sendback));
        });
    });

}

function getSavedPubs(req, res, next){
    console.log("::::::::::getSavedPubsCookies", req.cookies);
    var logincookie=req.cookies['logincookie'];
    var email;
    var sendback={};
    //this punts on the issue of having to make this extra call
    if (logincookie==undefined){
        res.writeHead(200, "OK", {'Content-Type': 'application/json'});
        sendback['savedpubs']='undefined';
        res.end(JSON.stringify(sendback));
        return;
    }
    redis_client.get('email:'+logincookie,function(err, reply){
        email=reply;
        redis_client.smembers('savedpub:'+email, function(err, reply){
            res.writeHead(200, "OK", {'Content-Type': 'application/json'});
            console.log("GETSAVEDPUBSREPLY", reply, err);
            sendback['savedpubs']=reply;
            //sendback[logincookie]=email;
            res.end(JSON.stringify(sendback));
        });
    });

}



function makeADSJSONPCall(req, res, next){
    //Add logic if the appropriate cookie is not defined
    var jsonpcback=url.parse(req.url, true).query.callback
    var adsoptions={
        host:ADSHOST,
        path:ADSURL,
        headers:{Cookie: 'NASA_ADS_ID='+req.cookies['nasa_ads_id']}
    };
    //var stuff=undefined;
    var isfunc=function(instring) {
        return jsonpcback+'('+instring+')';
    };
    console.log(jsonpcback);
    doTransformedProxy(adsoptions, req, res, isfunc);
}

function addToRedis(req, res, next){
     console.log("::::::::::addToRedisCookies", req.cookies);
     postHandler(req, res, insertUser);
     //insertUser(logincookie, instring); 
}

function saveSearchToRedis(req, res, next){
    postHandler(req, res, saveSearch);
}
function savePubToRedis(req, res, next){
    postHandler(req, res, savePub);
}

//why do we not bake logincookie stuff into doPublications? Could simplify some JS shenanigans. Philosophy?
function doPublications(req, res, next){
    console.log("=====================In do Publications", req.url, req.headers.referer, req.originalUrl);
    var camefrom=url.parse(req.url, true).query.camefrom;
    console.log("I CAME FROM:",camefrom)
    var view={
        pagehead:{pagetype:'Publications'},
        bodyhead:{isitchosenpublications:'chosen', current_url:req.url},
        bodybody:{bodyright:{}},
    };
    var lpartials=JSON.parse(globpartialsjson);
    lpartials['bodybody']=bodybodypub;
    var html=mustache.to_html(maint, view, lpartials);
    //makeADSCall(req, res)
    //console.log("+++++++++++++++++++++++=STUFF",stuff, adsoptions);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);    
}

function doSaved(req, res, next){
    console.log("In do Search",this);
    var logincookie=req.cookies['logincookie'];
    var view={
        pagehead:{pagetype:'Saved'},
        bodyhead:{isitchosensaved:'chosen', current_url:req.url},
        bodybody:{},
    };
    var lpartials=JSON.parse(globpartialsjson);
    lpartials['bodybody']=bodybodysaved;
    var savedsearches;
    var savedpubs;
    var email;
    var html;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    if (logincookie!=undefined){
        redis_client.get('email:'+logincookie, function(err, reply){
            email=reply;
            redis_client.smembers('savedsearch:'+email, function(err, reply){
                savedsearches=reply;
                redis_client.smembers('savedpub:'+email, function(err, reply){
                    savedpubs=reply;
                    view['savedsearches']=savedsearches;
                    view['savedpubs']=savedpubs;
                    html=mustache.to_html(maint, view, lpartials);
                    res.end(html);
                });
            });
        });
    } else {
        view['savedsearches']=[];
        view['savedpubs']=[];
        html=mustache.to_html(maint, view, lpartials);
        res.end(html);
        return;
    }
   
    
}

var explorouter=connect(
    connect.router(function(app){
        app.get('/publications', doPublications);
        app.get('/saved', doSaved);
    })
);

function cookieFunc(req, res, next){
    console.log('\\\\\\\\\\\\\\COOKIES:',JSON.stringify(req.cookies));
    //res.end(JSON.stringify(req.cookies));
    next();
  }


var server = connect.createServer();
//server.use(connect.logger());
server.use(connect.cookieParser());
//Not sure we need to use session middleware, more like login moddleware cookies.
//Especially since we dont seem to know how not to reextend the time for session cookies.
//thats prolly right behavior for session cookies since the more people use the more we wanna keep them on
//server.use(connect.session({ store: new RedisStore, secret: 'keyboard cat', cookie :{maxAge: 31536000000} }));
server.use('/', connect.static(__dirname + '/static/ajax-solr/'));
server.use('/solr/', solrrouter);
server.use('/explorer/', explorouter);
server.use('/adsjsonp', makeADSJSONPCall);
//using get to put into redis:BAD but just for testing
server.use('/addtoredis', addToRedis);
server.use('/getuser', getUser);
server.use('/logout', logoutUser);
server.use('/login', loginUser);
server.use('/savesearch', saveSearchToRedis);
server.use('/savedsearches', getSavedSearches);
server.use('/savepub', savePubToRedis);
server.use('/savedpubs', getSavedPubs);
server.listen(3000);

//http://adsabs.harvard.edu/cgi-bin/nph-manage_account?man_cmd=logout&man_url=http%3A//labs.adsabs.harvard.edu/ui/%3Frefresh%3D1eec2387-96cb-11e0-a591-842b2b65702a
