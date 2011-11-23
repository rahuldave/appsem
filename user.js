(function() {
  /*
  Handle user login/out and checks.
  */
  var connectutils, getUser, insertUser, loginUser, logoutUser, makeLoginCookie, redis_client, url;
  connectutils = require('connect').utils;
  url = require('url');
  redis_client = require("redis").createClient();
  makeLoginCookie = function(cookiename, cookievalue, days) {
    var cookie, expdate, milisecs, secs;
    secs = days * 24 * 60 * 60;
    milisecs = secs * 1000;
    expdate = new Date(new Date().getTime() + milisecs);
    cookie = connectutils.serializeCookie(cookiename, cookievalue, {
      expires: expdate,
      path: '/'
    });
    return {
      unique: cookievalue,
      cookie: cookie,
      expdateinsecs: secs
    };
  };
  loginUser = function(req, res, next) {
    var adsurl, currentToken, redirect, startupCookie;
    redirect = url.parse(req.url, true).query.redirect;
    currentToken = connectutils.uid(16);
    adsurl = "http://adsabs.harvard.edu/cgi-bin/nph-manage_account?man_cmd=login&man_url=" + redirect;
    startupCookie = makeLoginCookie('startupcookie', currentToken, 0.005);
    console.log("loginUser: REDIRECT=" + redirect);
    res.writeHead(302, 'Redirect', {
      'Set-Cookie': startupCookie.cookie,
      Location: redirect
    });
    res.statusCode = 302;
    return res.end();
  };
  logoutUser = function(req, res, next) {
    var loginCookie, newLoginCookie, redirect;
    console.log("::: logoutCookies " + (JSON.stringify(req.cookies)));
    loginCookie = req.cookies.logincookie;
    newLoginCookie = makeLoginCookie('logincookie', loginCookie, -1);
    redirect = url.parse(req.url, true).query.redirect;
    return redis_client.expire("email:" + loginCookie, 0, function(err, reply) {
      res.writeHead(302, 'Redirect', {
        'Set-Cookie': newLoginCookie.cookie,
        Location: redirect
      });
      res.statusCode = 302;
      return res.end();
    });
  };
  insertUser = function(jsonpayload, req, res, next) {
    var cookie, currentToken, efunc, email, jsonObj, key, loginCookie, margs, mkeys, value;
    currentToken = connectutils.uid(16);
    loginCookie = makeLoginCookie('logincookie', currentToken, 365);
    cookie = loginCookie.cookie;
    console.log("insertUser payload=" + jsonpayload);
    if (("" + jsonpayload) === "undefined" || !(jsonpayload != null) || jsonpayload === "") {
      console.log("@@ payload is undefined or empty!");
      res.writeHead(200, "OK", {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie
      });
      res.end();
      return;
    }
    jsonObj = JSON.parse(jsonpayload);
    if (!(jsonObj.email != null)) {
      console.log("@@ payload has no email field!");
      res.writeHead(200, "OK", {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie
      });
      res.end();
      return;
    }
    email = jsonObj.email;
    mkeys = [['hset', email, 'dajson', jsonpayload], ['hset', email, 'cookieval', cookie]];
    margs = (function() {
      var _results;
      _results = [];
      for (key in jsonObj) {
        value = jsonObj[key];
        _results.push(['hset', email, key, value]);
      }
      return _results;
    })();
    redis_client.multi(margs.concat(mkeys)).exec();
    efunc = function(err, reply) {
      res.writeHead(200, "OK", {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie
      });
      return res.end();
    };
    return redis_client.multi([['sadd', 'useremails', email], ['sadd', 'userids', loginCookie.unique], ['setex', "email:" + loginCookie.unique, loginCookie.expdateinsecs, email]]).exec(efunc);
  };
  getUser = function(req, res, next) {
    var headerDict, loginCookie, sendback, startupCookie, stashMail;
    loginCookie = req.cookies.logincookie;
    startupCookie = req.cookies.startupcookie;
    sendback = {
      startup: startupCookie != null ? startupCookie : 'undefined',
      email: 'undefined'
    };
    if (!(loginCookie != null)) {
      headerDict = {
        'Content-Type': 'application/json'
      };
      if (startupCookie != null) {
        headerDict['Set-Cookie'] = makeLoginCookie('startupcookie', startupCookie, -1).cookie;
      }
      res.writeHead(200, 'OK', headerDict);
      stashMail = JSON.stringify(sendback);
      console.log("getUser: no loginCookie, returning " + stashMail);
      res.end(stashMail);
      return;
    }
    res.writeHead(200, 'OK', {
      'Content-Type': 'application/json'
    });
    console.log("getUser: loginCookie=" + loginCookie);
    return redis_client.get("email:" + loginCookie, function(err, reply) {
      if (err) {
        console.log("@@ getUser get email:" + loginCookie + " failed with " + err);
        return next(err);
      } else {
        sendback.email = String(reply);
        stashMail = JSON.stringify(sendback);
        console.log("getUser: reply " + stashMail);
        return res.end(stashMail);
      }
    });
  };
  exports.loginUser = loginUser;
  exports.logoutUser = logoutUser;
  exports.insertUser = insertUser;
  exports.getUser = getUser;
}).call(this);
