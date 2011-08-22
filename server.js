/* A NodeJS server that statically serves javascript out, proxies solr requests,
 and handles authentication through the ADS */
var SITEPREFIX='';
var SITEPREFIX='/semantic2/alpha';
var STATICPREFIX='/static';
var SOLRHOST='labs.adsabs.harvard.edu';
var SOLRURL='/semanticsolr2/solr';
var SOLRHOST='localhost';
var SOLRURL='/solr';
// var SOLRPORT=8983;
var SOLRPORT=8984;
var ADSHOST='adsabs.harvard.edu';
var ADSURL='/cgi-bin/insert_login/credentials/';
var TDIR=__dirname + '/static/ajax-solr/templates/';
//SOLRHOST='localhost';
//SOLRURL='/solr';
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
                port:SOLRPORT
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
    var bibcode=jsonobj['pubbibcode'];
    var title=jsonobj['pubtitle'];
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

	// Moved to a per-user database for titles and bibcodes so that we can delete
	// search information. Let's see how this goes compared to "global" values for the
	// bibcodes and titles hash arrays.
	//
	// Should worry about failures here, but not for now.
	redis_client.hset('savedbibcodes:'+email, savedpub, bibcode)
	redis_client.hset('savedtitles:'+email, savedpub, title)

        redis_client.sadd('savedpub:'+email, savedpub, function(err, reply){
            console.log("is email set", email);
            res.writeHead(200, "OK", {'Content-Type': 'application/json'});
            sendback['success']='defined';
            res.end(JSON.stringify(sendback));
        });
    });
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

/*
 * We only return the document ids here; for the full document info
 * see doSaved.
 */
  
function getSavedPubs(req, res, next){
    console.log("::::::::::getSavedPubsCookies", req.cookies);
    var logincookie=req.cookies['logincookie'];
    var email;
    var sendback={};
    //this punts on the issue of having to make this extra call
    if (logincookie===undefined){
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

function deletePubFromRedis(req, res, next){
    postHandler(req, res, deletePub);
}
function deleteSearchFromRedis(req, res, next){
    postHandler(req, res, deleteSearch);
}

function deletePub(jsonpayload, req, res, next) {
    console.log(">> In deletePub");
    // console.log(">>   cookies = ", req.cookies);
    // console.log(">>   payload = ", jsonpayload);

    var jsonobj = JSON.parse(jsonpayload);
    var logincookie = req.cookies['logincookie'];
    var docid = jsonobj['savedpub'];
    console.log("logincookie:", logincookie, " docid:", docid);
    var sendback = {};

    if (logincookie===undefined || docid===undefined){
        res.writeHead(200, "OK", {'Content-Type': 'application/json'});
        sendback['success']='undefined';
        res.end(JSON.stringify(sendback));
        return; 
    }

    var email;
    redis_client.get('email:'+logincookie,function(err, reply){
        email=reply;

	redis_client.srem('savedpub:'+email, docid, function(err,reply){
	    console.log("Assumed we have removed " + docid + " from user's savedpub list");
	    
	    redis_client.hdel('savedtitles:'+email, docid, function(err,reply){
		console.log("Assumed we have removed " + docid + " from user's savedtitles hash");

		redis_client.hdel('savedbibcodes:'+email, docid, function(err,reply){
		    console.log("Assumed we have removed " + docid + " from user's savedbibcodes hash");

		    res.writeHead(200, "OK", {'Content-Type': 'application/json'});
		    sendback['success']='defined';
		    res.end(JSON.stringify(sendback));
		});
	    });
	});
    });

}

function deleteSearch(jsonpayload, req, res, next) {
    console.log(">> In deleteSearch");
    // console.log(">>   cookies = ", req.cookies);
    // console.log(">>   payload = ", jsonpayload);

    var jsonobj = JSON.parse(jsonpayload);
    var logincookie = req.cookies['logincookie'];
    var searchid = jsonobj['savedsearch'];
    console.log("logincookie:", logincookie, " search:", searchid);
    var sendback = {};

    if (logincookie===undefined || searchid===undefined){
        res.writeHead(200, "OK", {'Content-Type': 'application/json'});
        sendback['success']='undefined';
        res.end(JSON.stringify(sendback));
        return; 
    }

    var email;
    redis_client.get('email:'+logincookie,function(err, reply){
        email=reply;

	redis_client.srem('savedsearch:'+email, searchid, function(err,reply){
	    console.log("Assumed we have removed " + searchid + " from user's savedsearch list");

	    res.writeHead(200, "OK", {'Content-Type': 'application/json'});
	    sendback['success']='defined';
	    res.end(JSON.stringify(sendback));
	});
    });

}

//why do we not bake logincookie stuff into doPublications? Could simplify some JS shenanigans. Philosophy?
function doPublications(req, res, next){
    console.log("=====================In do Publications", req.url, req.headers.referer, req.originalUrl);
    var camefrom=url.parse(req.url, true).query.camefrom;
    console.log("I CAME FROM:",camefrom)
    var view={
        pagehead:{pagetype:'Publications', siteprefix: SITEPREFIX, staticprefix: SITEPREFIX+STATICPREFIX},
        bodyhead:{isitchosenpublications:'chosen', current_url:req.url, siteprefix: SITEPREFIX, staticprefix: SITEPREFIX+STATICPREFIX},
        bodybody:{bodyright:{siteprefix: SITEPREFIX, staticprefix: SITEPREFIX+STATICPREFIX}},
    };
    var lpartials=JSON.parse(globpartialsjson);
    lpartials['bodybody']=bodybodypub;
    var html=mustache.to_html(maint, view, lpartials);
    //makeADSCall(req, res)
    //console.log("+++++++++++++++++++++++=STUFF",stuff, adsoptions);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);    
}

/*
 * Given a saved search, which looks something like
 * "fq=keywords_s%3A%22stars%20luminosity%20function%3Bmass%20function%22&fq=author_s%3A%22Stahl%2C%20O%22&fq=instruments_s%3AMAST%2FIUE%2FLWR&q=*%3A*"
 * return a (hopefully) human-readable version.
 */
function searchToText(searchTerm) {
    // lazy way to remove the trailing search term
    var s = "&" + searchTerm;
    s = s.replace('&q=*%3A*', '');

    // only decode after the initial split to protect against the
    // unlikely event that &fq= appears as part of a search term.
    var terms = s.split(/&fq=/);

    // ignore the first entry as '' by construction
    var out = "";
    for (var i = 1; i < terms.length; i++) {
	var toks = decodeURIComponent(terms[i]).split(':', 2);
	out += toks[0] + "=" + toks[1] + " ";
    }

    return out;
}

function doSaved(req, res, next){
    console.log("In do Saved");
    var logincookie=req.cookies['logincookie'];
    var view={
        pagehead:{pagetype:'Saved', siteprefix: SITEPREFIX, staticprefix: SITEPREFIX+STATICPREFIX},
        bodyhead:{isitchosensaved:'chosen', current_url:req.url, siteprefix: SITEPREFIX, staticprefix: SITEPREFIX+STATICPREFIX},
        bodybody:{siteprefix: SITEPREFIX, staticprefix: SITEPREFIX+STATICPREFIX, hello: 'World'},
    };
    var lpartials=JSON.parse(globpartialsjson);
    lpartials['bodybody']=bodybodysaved;
    var savedsearches;
    var savedpubs;
    var email;
    var html;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
    if (logincookie!==undefined){
	var pubtitles;
	var pubcodes;
	redis_client.get('email:'+logincookie,function(err, reply){
	    email=reply;

	    redis_client.smembers('savedsearch:'+email, function(err, reply){
		savedsearches=reply;
		redis_client.smembers('savedpub:'+email, function(err, reply){
		    savedpubs=reply;

		    // want the bibcodes and titles for these publications
		    //
		    redis_client.hmget('savedtitles:'+email, savedpubs, function(err, reply){
			// console.log("Saved publication titles: ", reply);
			pubtitles=reply;

			redis_client.hmget('savedbibcodes:'+email, savedpubs, function(err, reply){
			    //console.log("Saved bibcode titles: ", reply);
			    bibcodes = reply;
						
			    /* consolidate the values for the templates */
						
			    view['savedsearches'] = new Array(savedsearches.length);
			    for (var i = 0; i < savedsearches.length; i++) {
				var searchuri = savedsearches[i];
				var searchtext = searchToText(searchuri);

				view['savedsearches'][i] = { 'searchuri':searchuri, 'searchtext':searchtext };
			    }

			    view['savedpubs'] = new Array(savedpubs.length);
			    for (var i = 0; i < savedpubs.length; i++) {
				var pubid = savedpubs[i];
				var pubtitle = pubtitles[i];
				var bibcode = bibcodes[i];
				var linktext;
				var linkuri;
				
				// In development code we can have entries without a title or
				// bibcode, so "hide" this. It may be sensible for general use
				// case anyway. It also seems that we have to protect the 
				// text used to create the bibcode link, even though I thought
				// Mustache handled this.
				//
				if (bibcode === null) {
				    linkuri = "id%3A" + pubid;
				    if (pubtitle === null) {
					linktext = "Unknown";
				    } else {
					linktext = pubtitle;
				    }
				} else {
				    linkuri = "bibcode%3A" + bibcode.replace(/&/g, '%26');
				    if (pubtitle === null) {
					linktext = "Unknown title";
				    } else {
					linktext = pubtitle;
				    }
				    
				    linktext += " (" + bibcode + ")";
				}
				
				view['savedpubs'][i] = {'pubid': pubid, 'linktext': linktext, 'linkuri': linkuri };

			    }
				
			    // console.log("HACK: mustache view = ", view);
			    // console.log("CALLING MUSTACHE");
			    html=mustache.to_html(maint, view, lpartials);
			    // TODO: can I process the html to add in callbacks for the remove links?
			    res.end(html);
			    
			});
		    });
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
server.use(SITEPREFIX+STATICPREFIX+'/', connect.static(__dirname + '/static/ajax-solr/'));
server.use(SITEPREFIX+'/solr/', solrrouter);
server.use(SITEPREFIX+'/explorer/', explorouter);
server.use(SITEPREFIX+'/adsjsonp', makeADSJSONPCall);
//using get to put into redis:BAD but just for testing
server.use(SITEPREFIX+'/addtoredis', addToRedis);
server.use(SITEPREFIX+'/getuser', getUser);
server.use(SITEPREFIX+'/logout', logoutUser);
server.use(SITEPREFIX+'/login', loginUser);
server.use(SITEPREFIX+'/savesearch', saveSearchToRedis);
server.use(SITEPREFIX+'/savedsearches', getSavedSearches);
server.use(SITEPREFIX+'/savepub', savePubToRedis);

server.use(SITEPREFIX+'/deletesearch', deleteSearchFromRedis);
server.use(SITEPREFIX+'/deletepub', deletePubFromRedis);

server.use(SITEPREFIX+'/savedpubs', getSavedPubs);

// not sure of the best way to do this, but want to privide access to
// ajax-loader.gif and this way avoids hacking ResultWidget.2.0.js
//
server.use('/images', connect.static(__dirname + '/static/ajax-solr/images/'));

server.listen(3000);

//http://adsabs.harvard.edu/cgi-bin/nph-manage_account?man_cmd=logout&man_url=http%3A//labs.adsabs.harvard.edu/ui/%3Frefresh%3D1eec2387-96cb-11e0-a591-842b2b65702a
