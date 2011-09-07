/* A NodeJS server that statically serves javascript out, proxies solr requests,
 and handles authentication through the ADS */

"use strict"; // for testing in JSLint

var SITEPREFIX = '';
var SITEPREFIX = '/semantic2/alpha';
var STATICPREFIX = '/static';
var SOLRHOST = 'labs.adsabs.harvard.edu';
var SOLRURL = '/semanticsolr2/solr';
var SOLRHOST = 'localhost';
var SOLRURL = '/solr';
// var SOLRPORT = 8983;
var SOLRPORT = 8984;
var ADSHOST = 'adsabs.harvard.edu';
var ADSURL = '/cgi-bin/insert_login/credentials/';
var TDIR = __dirname + '/static/ajax-solr/templates/';
//SOLRHOST = 'localhost';
//SOLRURL = '/solr';
var connect = require('connect');
var connectutils = connect.utils;
var http = require('http');
var url = require('url');
var mustache = require('mustache');
var fs = require('fs');
var redis_client = require("redis").createClient();
var RedisStore = require('connect-redis')(connect);
//var uuid = require('node-uuid');

function getTemplate(fname) {
    return fs.readFileSync(TDIR + fname, 'utf-8');
}

var maint = getTemplate('template.html');
var partials = {
    pagehead : getTemplate('pagehead.html'),
    bodyhead : getTemplate('bodyhead.html'),
    bodyright : getTemplate('bodyright.html')  
};

var bodybodypub = getTemplate('bodybody_publications.html');
var bodybodyobsv = getTemplate('bodybody_observations.html')
var bodybodysearch = getTemplate('bodybody_search.html');
var bodybodysaved = getTemplate('bodybody_saved.html');

var globpartialsjson = JSON.stringify(partials);

// Needed to check whether we get a string or an array
// of strings. Taken from
// http://stackoverflow.com/questions/1058427/how-to-detect-if-a-variable-is-an-array/1058457#1058457
//
var isArray = function (o) {
    return (o instanceof Array) ||
        (Object.prototype.toString.apply(o) === '[object Array]');
};

// Actually create and finish the request. The options argument
// controls the choice of arguments and defoptions gives the default
// values. The current approach is probably too flexible for its
// needs.
//
// The return message is sent using the keyword value set
// to the message value.
//
function completeRequest(res, options, defoptions) {

    var opts = {},
        out = {},
        omsg = "",
        key;
    for (key in defoptions) {
	if (key in options) {
	    opts[key] = options[key];
	} else {
	    opts[key] = defoptions[key];
	}
    }

    res.writeHead(200, "OK", {'Content-Type': 'application/json'});
    out[opts.keyword] = opts.message;
    omsg = JSON.stringify(out);
    console.log("Returning: ", omsg);
    res.end(omsg);
}

// The request failed so send back our generic "you failed" JSON
// payload.
//
// The options argument is used to set the name and value
// of the value returned; 
//      keyword, defaults to 'success'
//      message, defaults to 'undefined'
//
function failedRequest(res, options) {
    completeRequest(res, options || {}, { 'keyword': 'success', 'message': 'undefined' });
}

// The request succeeded.
//
// The options argument is used to set the name and value
// of the value returned; 
//      keyword, defaults to 'success'
//      message, defaults to 'defined'
//
function successfulRequest(res, options) {
    completeRequest(res, options || {}, { 'keyword': 'success', 'message': 'defined' });
}

function makelogincookie(cookiename,  cookievalue, days) {
    var secs = days * 24 * 60 * 60;
    var milisecs = secs * 1000;
    // I've seen some funny behaviour with Date.now() so switching
    // to a more explicit method which has worked elsewhere, but is probably
    // not an issue here.
    //var expdate = new Date(Date.now() + milisecs);
    var expdate = new Date(new Date().getTime() + milisecs);
    var cookie = connectutils.serializeCookie(cookiename, cookievalue, {'expires': expdate, 'path': '/'});
    return {'unique': cookievalue, 'cookie': cookie, 'expdateinsecs': secs};
}

function doProxy(proxyoptions, req, res) {
    console.log("-----------------Request " + req.method + " " + req.url);
    var proxy_request = http.get(proxyoptions, function (proxy_response) {
        proxy_response.addListener('data', function (chunk) {
            res.write(chunk, 'binary');
        });
        proxy_response.addListener('end', function () {
	    // console.log('proxy request has ended.');
            res.end();
        });
        res.writeHead(proxy_response.statusCode, proxy_response.headers);
    }).on('error', function (e) {
        console.log("Got error: " + e.message);
    });

    //BELOW is not needed. presumably helps in POST
    req.addListener('data', function (chunk) {
        //console.log("proxyrequest.write");
        proxy_request.write(chunk, 'binary');
    });

    req.addListener('end', function () {
        //console.log("proxyrequest.end");
        proxy_request.end();
    });

    //next();
}

function doTransformedProxy(proxyoptions, req, res, transformcallback) {
    console.log("TP-----------------Request " + req.method + " " + req.url);
    var completebuffer = '';
    var proxy_request = http.get(proxyoptions, function (proxy_response) {
        proxy_response.addListener('data', function (chunk) {
            //console.log("response.write");
            completebuffer = completebuffer + chunk;
            //res.write(chunk, 'binary');
        });
        proxy_response.addListener('end', function () {
            console.log("response.end");
            res.end(transformcallback(completebuffer));
        });
        res.writeHead(proxy_response.statusCode, proxy_response.headers);

    }).on('error', function (e) {
        console.log("Got error: " + e.message);
    });

    //BELOW is not needed. presumably helps in POST
    req.addListener('data', function (chunk) {
        //console.log("proxyrequest.write");
        proxy_request.write(chunk, 'binary');
    });
    req.addListener('end', function () {
        //console.log("proxyrequest.end");
        proxy_request.end();
    });
    //next();
}

function postHandler(req, res, tcallback) {
    if (req.method === 'POST') {
        var completebuffer = '';
        req.addListener('data', function (chunk) {
            //console.log("proxyrequest.write");
            completebuffer += chunk;
        });
        req.addListener('end', function () {
            //console.log("proxyrequest.end");
            tcallback(completebuffer, req, res);//this can be sync or async
            //res.writeHead(200, proxy_response.headers);
        });
    }
}

var solrrouter = connect(
    connect.router(function (app) {
	app.get('/select', function (req, res) {
            var solroptions = {
                host: SOLRHOST,
                path: SOLRURL + req.url,
                port: SOLRPORT
            };
            doProxy(solroptions, req, res);
	}); 
    })
);

function insertUser(jsonpayload, req, res, next) {
    var logincookie = makelogincookie('logincookie', connectutils.uid(16), 365);
    var cookie = logincookie.cookie;
    var responsedo = function (err, reply) {
        res.writeHead(200, "OK", {'Content-Type': 'application/json',
				  'Set-Cookie': cookie
				 });
        res.end();
    };
    var mystring = jsonpayload;
    console.log('[[' + mystring + ']]');
    var jsonobj = JSON.parse(mystring);
    var email = jsonobj.email;
    Object.keys(jsonobj).forEach(function (key) {
	// TODO: Do we really need to det dajson and cookieval on each iteration?
	redis_client.multi([["hset", email, key, jsonobj[key]],
			    ["hset", email, 'dajson', jsonpayload],
			    ["hset", email, 'cookieval', cookie]
			   ]).exec();
    });
    
    // Store the user details (the unique value and email) in sets to make it
    // easier to identify them later. This may not be needed. Also, should the
    // unique value have a time-to-live associated with it (and can this be done
    // within a set)?
    //
    //Since thenext set will be the last one the others will have completed.Not that it matters as we dont error handle right now.
    //redis_client.setex('auth:' + logincookie['unique'], logincookie['expdateinsecs'], logincookie['cookie']);
    //on the fly we'll have savedsearches:email and savedpubs:email
    // redis_client.setex('email:' + logincookie['unique'], logincookie['expdateinsecs'], email, responsedo);
    //
    redis_client.multi([["sadd", "useremails", email],
			["sadd", "userids", logincookie.unique],
			["setex", 'email:' + logincookie.unique, logincookie.expdateinsecs, email]
		       ]).exec(responsedo);

} // insertUser

function loginUser(req, res, next) {
    var urlparse = url.parse(req.url, true);
    var redirect = urlparse.query.redirect;
    var currenttoken = connectutils.uid(16);
    var adsurl = 'http://adsabs.harvard.edu/cgi-bin/nph-manage_account?man_cmd=login&man_url=' + redirect;
    var startupcookie = makelogincookie('startupcookie',currenttoken, 0.005);
    console.log('REDIRECT', redirect);
    var responsedo = function (err, reply) {
        res.writeHead(302, "Redirect", {
            'Set-Cookie': startupcookie.cookie,
            'Location': redirect
        });
        res.statusCode = 302;
        res.end();
    };
    responsedo();
    //redis_client.set('startup:' + currenttoken, currenttoken, responsedo)
}
function logoutUser(req, res, next) {
    console.log("::::::::::logoutCookies", req.cookies);
    var logincookie = req.cookies.logincookie;
    var newlogincookie = makelogincookie('logincookie', logincookie, -1);
    var redirect = url.parse(req.url, true).query.redirect;
    var responsedo = function (err, reply) {
        res.writeHead(302, "Redirect", {
            'Set-Cookie': newlogincookie.cookie,
            'Location': redirect
        });
        res.statusCode = 302;
        res.end();
    };
    //expire it now
    redis_client.expire('email:' + logincookie, 0, responsedo);
}

function getUser(req, res, next) {
    var stashmail;
    var logincookie = req.cookies.logincookie;
    var startupcookie = req.cookies.startupcookie;
    var sendback = {};
    var newstartupcookie;

    if (startupcookie) {
        newstartupcookie = makelogincookie('startupcookie', startupcookie, -1);
	sendback.startup = startupcookie;
    } else {
	sendback.startup = 'undefined';
    }

    if (logincookie === undefined) {
        var headerdict = {'Content-Type': 'application/json'};
        if (startupcookie) {
            headerdict['Set-Cookie'] = newstartupcookie.cookie;
        }
        res.writeHead(200, "OK", headerdict);
        sendback.email = 'undefined';
        stashmail = JSON.stringify(sendback);
        console.log("REPLY",stashmail);
        res.end(stashmail);
        return;
    }
    res.writeHead(200, "OK", {'Content-Type': 'application/json'});
    console.log('==================',logincookie);    
    redis_client.get('email:' + logincookie, function (err, reply) {
        if (err) {
            //not really an error but user aint there
            next(err);
        } else {
            sendback.email = String(reply);
            stashmail = JSON.stringify(sendback);
            console.log("REPLY",stashmail);
            res.end(stashmail);
            
        }        
    });
} // getUser

/*
 * Call cb with the login cookie otherwise return
 * a failed request with failopts (defaults to {} if
 * not given).
 */
function ifLoggedIn(req, res, cb, failopts) {
    var logincookie = req.cookies.logincookie;
    if (logincookie === undefined) {
	if (failopts === undefined) {
	    failedRequest(res);
	} else {
	    failedRequest(res, failopts);
	}
    } else {
	cb(logincookie);
    }
}

// A comment on saved times, used in both savePub and saveSearch.
//
// Approximate the save time as the time we process the request
// on the server, rather than when it was made (in case the user's
// clock is not set sensibly). 
//
// For now we save the UTC version of the time and provide no
// way to change this to something meaningful to the user.
//
// Alternatives include:
//
// *  the client could send the time as a string, including the
//    time zone, but this relies on their clock being okay
//
// *  the client can send in the local timezone info which can
//    then be used to format the server-side derived time
//    Not sure if can trust the time zone offset from the client
//    if can not trust the time itself. Calculating a useful display
//    string from the timezone offset is fiddly.
//

function saveSearch(jsonpayload, req, res, next) {
    console.log("savedsearchcookies", req.cookies, jsonpayload);
    var savetime = new Date().getTime();

    ifLoggedIn(req, res, function(loginid) {
	var jsonobj = JSON.parse(jsonpayload);
	var savedsearch = jsonobj.savedsearch;
	redis_client.get('email:' + loginid, function (err, email) {

	    // keep as a multi even though now a single addition
	    var margs = [["zadd", 'savedsearch:' + email, savetime, savedsearch]
			];
	    redis_client.multi(margs).exec(function (err, reply) {
		successfulRequest(res);
	    });
	});
    });

} // saveSearch

function savePub(jsonpayload, req, res, next) {
    console.log("savedpubcookies", req.cookies, jsonpayload);
    var savetime = new Date().getTime();

    ifLoggedIn(req, res, function (loginid) {
	var jsonobj = JSON.parse(jsonpayload);
	var savedpub = jsonobj.savedpub;
	var bibcode = jsonobj.pubbibcode;
	var title = jsonobj.pubtitle;

	redis_client.get('email:' + loginid, function (err, email) {
            console.log("REPLY", email);

	    // Moved to a per-user database for titles and bibcodes so that we can delete
	    // search information. Let's see how this goes compared to "global" values for the
	    // bibcodes and titles hash arrays.
	    //
	    // Should worry about failures here, but not for now.
	    //
	    var margs = [["hset", 'savedbibcodes:' + email, savedpub, bibcode],
			 ["hset", 'savedtitles:' + email, savedpub, title],
			 ["zadd", 'savedpub:' + email, savetime, savedpub]
			];
	    redis_client.multi(margs).exec(function (err, reply) {
		console.log("Saving publication: ", title);
		successfulRequest(res);
	    });
	});
    });

} // savePub

/*
 * get all the elements for the given key, stored
 * in a sorted list, and sent it to callback
 * as cb(err,values). If flag is true then the list is sorted in
 * ascending order of score (ie zrange rather than zrevrange)
 * otherwise descending order.
 */
function getSortedElements(flag, key, cb) {

    redis_client.zcard(key, function (err, nelem) {
	// could subtract 1 from nelem but it looks like
	// Redis stops at the end of the list
	if (flag) {
	    redis_client.zrange(key, 0, nelem, cb);
	} else {
	    redis_client.zrevrange(key, 0, nelem, cb);
	}
    });
}

/*
 * As getSortedElements but the values sent to the callback is
 * a hash with two elements:
 *    elements  - the elements
 *    scores    - the scores
 */
function getSortedElementsAndScores(flag, key, cb) {

    redis_client.zcard(key, function (err, nelem) {

	function splitIt(err, values) {
	    var response = { "elements": [], "scores": [] };
	    var i;
	    for (i = 0; i < nelem; i++) {
		response.elements[i] = values[i * 2];
		response.scores[i]   = values[i * 2 + 1];
	    }
	    cb(err, response);
	}

	// could subtract 1 from reply but it looks like
	// Redis stops at the end of the list
	if (flag) {
	    redis_client.zrange(key, 0, nelem, "withscores", splitIt);
	} else {
	    redis_client.zrevrange(key, 0, nelem, "withscores", splitIt);
	}
    });
}

function getSavedSearches(req, res, next) {

    ifLoggedIn(req, res, function(loginid) {
	redis_client.get('email:' + loginid, function (err, email) {
	    getSortedElements(true, 'savedsearch:' + email, function (err, searches) {
		console.log("GETSAVEDSEARCHESREPLY", searches, err);
		successfulRequest(res, { 'keyword': 'savedsearches', 'message': searches } );
            });
	});
    }, { 'keyword': 'savedsearches' });

}

/*
 * We only return the document ids here; for the full document info
 * see doSaved.
 */
  
function getSavedPubs(req, res, next) {
    // console.log("::::::::::getSavedPubsCookies", req.cookies);

    ifLoggedIn(req, res, function (loginid) {
	redis_client.get('email:' + loginid, function (err, email) {
	    getSortedElements(true, 'savedpub:' + email, function (err, searches) {
		console.log("GETSAVEDPUBSREPLY", searches, err);
		successfulRequest(res, { 'keyword': 'savedpubs', 'message': searches } );
            });
	});
    }, {'keyword': 'savedpubs'});

}

function makeADSJSONPCall(req, res, next) {
    //Add logic if the appropriate cookie is not defined
    var jsonpcback = url.parse(req.url, true).query.callback;
    var adsoptions = {
        host:ADSHOST,
        path:ADSURL,
        headers:{Cookie: 'NASA_ADS_ID=' + req.cookies.nasa_ads_id}
    };
    //var stuff = undefined;
    var isfunc = function (instring) {
        return jsonpcback + '(' + instring + ')';
    };
    console.log(jsonpcback);
    doTransformedProxy(adsoptions, req, res, isfunc);
}

// Remove the list of searchids, associated with the given 
// user cookie, from Redis.
//
// At present we require that searchids not be empty; this may
// be changed.
//
function removeSearches(res, loginid, searchids) {
    if (searchids.length === 0) {
	console.log("Error: removeSearches called with empty searchids list; loginid=" + loginid);
	failedRequest(res);
    } else {
	redis_client.get('email:' + loginid, function (err, email) {
	    var margs = [];
	    var key = 'savedsearch:' + email
	    var i;
	    // with Redis v2.4 we will be able to delete multiple keys with a single
	    // zrem call.
	    for (i in searchids) {
		margs.push(["zrem", key, searchids[i]]);
	    }
	    redis_client.multi(margs).exec(function (err, reply) {
		console.log("Assumed we have removed " + searchids.length + " searches from user's saved search list");
		successfulRequest(res);
	    });
	});
    }

} // removeSearches

// Similar to removeSearches but removes publications.
//
function removeDocs(res, loginid, docids) {
    if (docids.length === 0) {
	console.log("Error: removeDocs called with empty docids list; loginid=" + loginid);
	failedRequest(res);
    } else {
	redis_client.get('email:' + loginid, function (err, email) {
	    var margs = [];
	    var pubkey = 'savedpub:' + email;
	    var titlekey = 'savedtitles:' + email;
	    var bibkey = 'savedbibcodes:' + email;
	    var i;
	    // In Redis 2.4 zrem and hdel can be sent multiple keys
	    for (i in docids) {
		var docid = docids[i];
		margs.push(["zrem", pubkey, docid]);
		margs.push(["hdel", titlekey, docid]);
		margs.push(["hdel", bibkey, docid]);
	    }
	    redis_client.multi(margs).exec(function (err, reply) {
		console.log("Assumed we have removed " + docids.length + " papers from user's saved publication list");
		successfulRequest(res);
	    });
	});
    }

} // removeDocs

// Create a function to delete a single search or publication
//   funcname is used to create a console log message of 'In ' + funcname
//     on entry to the function
//   idname is the name of the key used to identify the item to delete
//     in the JSON payload
//   delItems is the routine we call to delete multiple elements
//
function deleteItem(funcname, idname, delItems) {
    return function (jsonpayload, req, res, next) {
	console.log(">> In " + funcname);
	// console.log(">>   cookies = ", req.cookies);
	// console.log(">>   payload = ", jsonpayload);

	ifLoggedIn(req, res, function (loginid) {
	    var jsonobj = JSON.parse(jsonpayload);
	    var delid = jsonobj[idname];
	    console.log("logincookie:", loginid, " delete item:", delid);
	    
	    if (delid === undefined) {
		failedRequest(res);
	    } else {
		delItems(res, loginid, [delid]);
	    }
	});
    };

} // deleteItem

// Create a function to delete multiple search or publication items
//   funcname is used to create a console log message of 'In ' + funcname
//     on entry to the function
//   idname is the name of the key used to identify the items to delete
//     in the JSON payload
//   delItems is the routine we call to delete multiple elements
//
function deleteItems(funcname, idname, delItems) {
    return function (payload, req, res, next) {
	console.log(">> In " + funcname);
	//console.log(">>   cookies = ", req.cookies);
	//console.log(">>   payload = ", payload);

	ifLoggedIn(req, res, function (loginid) {
	    var terms = JSON.parse(payload);
	    var action = terms.action;
	    var delids = [];
	    if (isArray(terms[idname])) {
		delids = terms[idname];
	    } else {
		delids = [ terms[idname] ];
	    }
    
	    if (action === "delete" && delids.length > 0) {
		delItems(res, loginid, delids);
	    } else {
		failedRequest(res);
	    }
	});
    };

} // deleteItems

var deleteSearch   = deleteItem("deleteSearch", "searchid", removeSearches);
var deletePub      = deleteItem("deletePub",    "pubid",    removeDocs);

var deleteSearches = deleteItems("deleteSearches", "searchid", removeSearches);
var deletePubs     = deleteItems("deletePubs",     "pubid",    removeDocs);


function addToRedis(req, res, next) {
     console.log("::::::::::addToRedisCookies", req.cookies);
     postHandler(req, res, insertUser);
     //insertUser(logincookie, instring); 
}

function saveSearchToRedis(req, res, next) {
    postHandler(req, res, saveSearch);
}
function savePubToRedis(req, res, next) {
    postHandler(req, res, savePub);
}

function deletePubFromRedis(req, res, next) {
    postHandler(req, res, deletePub);
}
function deletePubsFromRedis(req, res, next) {
    postHandler(req, res, deletePubs);
}
function deleteSearchFromRedis(req, res, next) {
    postHandler(req, res, deleteSearch);
}
function deleteSearchesFromRedis(req, res, next) {
    postHandler(req, res, deleteSearches);
}

// Proxy the call to ADS, setting up the NASA_ADS_ID cookie
//
function doADSProxyHandler(payload, req, res, next) {
    console.log(">> In doADSProxyHandler");
    console.log(">>   cookies = ", req.cookies);
    console.log(">>   payload = ", payload);

    ifLoggedIn(req, res, function (loginid) {
	var args = JSON.parse(payload);
	var urlpath = args.urlpath;

	console.log("Proxying request to adsabs " + urlpath);
	doProxy({host: ADSHOST, port: 80, path: urlpath,
		 headers: { 'Cookie': 'NASA_ADS_ID=' + req.cookies.nasa_ads_id }
		}, req, res);
    });

} // doADSProxyHandler

function doADSProxy(req, res, next) {
    postHandler(req, res, doADSProxyHandler);
}


//why do we not bake logincookie stuff into doPublications? Could simplify some JS shenanigans. Philosophy?
function doPublications(req, res, next) {
    console.log("=====================In do Publications", req.url, req.headers.referer, req.originalUrl);
    var camefrom = url.parse(req.url, true).query.camefrom;
    console.log("I CAME FROM:",camefrom);
    var view = {
        pagehead:{pagetitle:'Publications', pageclass:'publications', haswidgets: true,
		  siteprefix: SITEPREFIX, staticprefix: SITEPREFIX+STATICPREFIX},
        bodyhead:{isitchosenpublications:'chosen', current_url:req.url, siteprefix: SITEPREFIX, staticprefix: SITEPREFIX+STATICPREFIX},
        bodybody:{bodyright:{siteprefix: SITEPREFIX, staticprefix: SITEPREFIX+STATICPREFIX}}
    };
    var lpartials = JSON.parse(globpartialsjson);
    lpartials.bodybody = bodybodypub;
    var html = mustache.to_html(maint, view, lpartials);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
    res.end(html);    
}

function doObservations(req, res, next) {
    console.log("=====================In do Observations", req.url, req.headers.referer, req.originalUrl);
    var camefrom = url.parse(req.url, true).query.camefrom;
    console.log("I CAME FROM:",camefrom);
    var view = {
        pagehead:{pagetitle:'Observations', pageclass: 'observations', haswidgets: true,
		  siteprefix: SITEPREFIX, staticprefix: SITEPREFIX+STATICPREFIX},
        bodyhead:{isitchosenobservations:'chosen', current_url:req.url, siteprefix: SITEPREFIX, staticprefix: SITEPREFIX+STATICPREFIX},
        bodybody:{bodyright:{siteprefix: SITEPREFIX, staticprefix: SITEPREFIX+STATICPREFIX}}
    };
    var lpartials = JSON.parse(globpartialsjson);
    lpartials.bodybody = bodybodyobsv;
    var html = mustache.to_html(maint, view, lpartials);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
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
    var i;
    for (i = 1; i < terms.length; i++) {
	var toks = decodeURIComponent(terms[i]).split(':', 2);
	out += toks[0] + "=" + toks[1] + " ";
    }

    return out;
}

/*
 * Returns a string representation of timeString, which
 * should be a string containing the time in milliseconds,
 * nowDate is the "current" date in milliseconds.
 *
 */
function timeToText(nowDate, timeString) {
    var t = parseInt(timeString, 10);
    var delta = nowDate - t;
    var h, m, s, out;
    if (delta < 1000) {
	return "Now";
    } else if (delta < 60000) {
	return String(Math.floor(delta/1000)) + "s ago";
    } else if (delta < 60000 * 60) {
	m = Math.floor(delta / 60000);
	s = Math.floor((delta - m * 60000) /1000);
	out = String(m) + "m ";
	if (s !== 0) {
	    out += String(s) + "s ";
	}
	return out + "ago";
    } else if (delta < 60000 * 60 * 24) {
	h = Math.floor(delta / (60000 * 60));
	delta = delta - h * 60000 * 60;
	m = Math.floor(delta / 60000);
	out = String(h) + "h ";
	if (m !== 0) {
	    out += String(m) + "m ";
	}
	return out + "ago";
    } else {

	// 
	// NOTE: deleting a saved search can return an element with "Invalid Date"; possibly some form of
        // concurrency issue whereby number of elements is temporarily invalid, or some of the
	// recent refactoring I've done has changed behavior
	//
	// console.log("DEBUGGING TO FIND OUT WHY TIMES ARE MESSED UP: t = " + t);

	var d = new Date(t);
	// console.log("DEBUGGING t -> " + d.toUTCString());

	return d.toUTCString();
    }
}

// Modify the object view to add in the needed Mustache template values
// given the search results.
//
function createSavedSearchTemplates(view, nowDate, searchkeys, searchtimes) {
    var nsearch = searchkeys.length;
    var i, skey, stime;

    view.hassearches = nsearch > 0;
    view.savedsearches = [];
    for (i = 0; i < nsearch; i++) {
	skey = searchkeys[i];
	stime = searchtimes[i];
	view.savedsearches[i] = { 'searchuri': skey,
				  'searchtext': searchToText(skey),
				  'searchtime': stime,
				  'searchtimestr': timeToText(nowDate, stime),
				  'searchctr': i };
    }

} // createSavedSearchTemplates

function createSavedPubTemplates(view, nowDate, pubkeys, bibcodes, pubtitles, pubtimes) {
    var npub = pubkeys.length;
    var i;

    view.haspubs = npub > 0;
    view.savedpubs = [];
    for (i = 0; i < npub; i++) {
	var bibcode = bibcodes[i];
	
	// It seems that we have to protect the 
	// text used to create the bibcode link, even though I thought
	// Mustache handled this. Unfortunately titles can contain HTML
	// formatting so need to be careful. This may be invalid since I
	// had missed the handy {{{ }}} mustache functionality.
	//
	var linkuri = "bibcode%3A" + bibcode.replace(/&/g, '%26');
	    
	view.savedpubs[i] = {'pubid': pubkeys[i],
			     'linktext': pubtitles[i],
			     'linkuri': linkuri,
			     'pubtime': pubtimes[i],
			     'pubtimestr': timeToText(nowDate, pubtimes[i]),
			     'bibcode': bibcode,
			     'pubctr': i };
				
    }

} // createSavedPubTemplates

function doSaved(req, res, next) {
    console.log("In do Saved");
    var logincookie = req.cookies.logincookie;
    var view = {
        pagehead:{pagetitle:'Saved', pageclass: 'saved', haswidgets: false,
		  siteprefix: SITEPREFIX, staticprefix: SITEPREFIX+STATICPREFIX},
        bodyhead:{isitchosensaved:'chosen', current_url:req.url, siteprefix: SITEPREFIX, staticprefix: SITEPREFIX+STATICPREFIX},
        bodybody:{siteprefix: SITEPREFIX, staticprefix: SITEPREFIX+STATICPREFIX}
    };
    var lpartials = JSON.parse(globpartialsjson);
    lpartials.bodybody = bodybodysaved;
    var html;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
    if (logincookie !== undefined) {
	// var nowDate = Date().now;
	var nowDate = new Date().getTime();
	redis_client.get('email:'+logincookie, function (err, email) {
	    getSortedElementsAndScores(false, 'savedsearch:'+email, function (err, savedsearches) {
		var searchkeys = savedsearches.elements;
		var searchtimes = savedsearches.scores;
		getSortedElementsAndScores(false, 'savedpub:'+email, function (err, savedpubs) {
		    var pubkeys = savedpubs.elements;
		    var pubtimes = savedpubs.scores;
		    redis_client.hmget('savedtitles:'+email, pubkeys, function (err, pubtitles) {
			redis_client.hmget('savedbibcodes:'+email, pubkeys, function (err, bibcodes) {
			    createSavedSearchTemplates(view, nowDate, searchkeys, searchtimes);
			    createSavedPubTemplates(view, nowDate, pubkeys, bibcodes, pubtitles, pubtimes);
			    res.end(mustache.to_html(maint, view, lpartials));
			});
		    });
		});
	    });
	});

    } else {
        res.end(mustache.to_html(maint, view, lpartials));
    }
    
}

// This is just temporary code:
//   could add in a timeout and message
function quickRedirect(newloc) {
    return function (req, res, next) {
	res.writeHead(302, "Redirect", {
	    // does this lose any cookies?
	    'Location': newloc
	});
	res.statusCode = 302;
	res.end();
    };
}

var explorouter = connect(
    connect.router(function (app) {
        app.get('/publications', doPublications);
        app.get('/saved', doSaved);
	app.get('/objects', quickRedirect('publications/'));
	app.get('/observations', doObservations);
	app.get('/proposals', quickRedirect('publications/'));
	app.get('/', quickRedirect('publications/'));
    })
);

/***
function cookieFunc(req, res, next) {
    console.log('\\\\\\\\\\\\\\COOKIES:',JSON.stringify(req.cookies));
    //res.end(JSON.stringify(req.cookies));
    next();
  }
***/

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
server.use(SITEPREFIX+'/deletesearches', deleteSearchesFromRedis);
server.use(SITEPREFIX+'/deletepub', deletePubFromRedis);
server.use(SITEPREFIX+'/deletepubs', deletePubsFromRedis);

// Used by the saved search page to provide functionality
// to the saved publications list. This is a hack to work
// around the same-origin policy.
//
server.use(SITEPREFIX+'/adsproxy', doADSProxy);

server.use(SITEPREFIX+'/savedpubs', getSavedPubs);

// not sure of the best way to do this, but want to privide access to
// ajax-loader.gif and this way avoids hacking ResultWidget.2.0.js
//
server.use('/images', connect.static(__dirname + '/static/ajax-solr/images/'));

function runServer(port) {
    var now = new Date();
    var url = 'http://localhost:' + port + SITEPREFIX + '/explorer/publications/';
    console.log(now.toUTCString() + " - Starting server on", url);
    server.listen(port);
}

var migration = require('./migration');
migration.validateRedis(redis_client, function () { runServer(3002); });

//http://adsabs.harvard.edu/cgi-bin/nph-manage_account?man_cmd=logout&man_url=http%3A//labs.adsabs.harvard.edu/ui/%3Frefresh%3D1eec2387-96cb-11e0-a591-842b2b65702a
