(function() {
  /*
  A NodeJS server that statically serves javascript out, proxies solr requests,
  and handles authentication through the ADS
  */
  var SITEPREFIX, STATICPREFIX, addUser, completeRequest, config, connect, connectutils, doADSProxy, doADSProxyHandler, doPost, doPostWithJSON, explorouter, failedRequest, fs, getUser, groups, http, ifLoggedIn, loginUser, logoutUser, makeADSJSONPCall, migration, mustache, postHandler, postHandlerWithJSON, proxy, quickRedirect, redis_client, requests, runServer, saved, server, solrrouter, solrrouter2, successfulRequest, url, user, views;
  connect = require('connect');
  connectutils = connect.utils;
  http = require('http');
  url = require('url');
  mustache = require('mustache');
  fs = require('fs');
  redis_client = require('redis').createClient();
  requests = require("./requests");
  completeRequest = requests.completeRequest;
  failedRequest = requests.failedRequest;
  successfulRequest = requests.successfulRequest;
  ifLoggedIn = requests.ifLoggedIn;
  postHandler = requests.postHandler;
  postHandlerWithJSON = requests.postHandlerWithJSON;
  proxy = require("./proxy");
  user = require("./user");
  loginUser = user.loginUser;
  logoutUser = user.logoutUser;
  getUser = user.getUser;
  views = require("./views");
  saved = require("./saved");
  groups = require("./groups");
  migration = require('./migration2');
  config = require("./config").config;
  SITEPREFIX = config.SITEPREFIX;
  STATICPREFIX = config.STATICPREFIX;
  solrrouter = connect(connect.router(function(app) {
    return app.get('/select', function(req, res) {
      var solroptions;
      solroptions = {
        host: config.SOLRHOST,
        path: config.SOLRURL + req.url,
        port: config.SOLRPORT
      };
      return proxy.doProxy(solroptions, req, res);
    });
  }));
  solrrouter2 = connect(connect.router(function(app) {
    return app.get('/select', function(req, res) {
      var solroptions;
      solroptions = {
        host: config.SOLRHOST,
        path: config.SOLRURL + req.url,
        port: config.SOLRPORT2
      };
      return proxy.doProxy(solroptions, req, res);
    });
  }));
  makeADSJSONPCall = function(req, res, next) {
    var adsoptions, jsonpcback;
    jsonpcback = req.query.callback;
    console.log("makeADSJSONPCCall: " + jsonpcback);
    adsoptions = {
      host: config.ADSHOST,
      path: config.ADSURL,
      headers: {
        Cookie: "NASA_ADS_ID=" + req.cookies.nasa_ads_id
      }
    };
    return proxy.doTransformedProxy(adsoptions, req, res, function(val) {
      return "" + jsonpcback + "(" + val + ")";
    });
  };
  addUser = function(req, res, next) {
    console.log("::addToRedis cookies=" + (JSON.stringify(req.cookies)));
    return postHandler(req, res, user.insertUser);
  };
  doPost = function(func) {
    return function(req, res, next) {
      return postHandler(req, res, func);
    };
  };
  doPostWithJSON = function(func) {
    return function(req, res, next) {
      return postHandlerWithJSON(req, res, func);
    };
  };
  doADSProxyHandler = function(payload, req, res, next) {
    console.log('>> In doADSProxyHandler');
    console.log(">>    cookies=" + (JSON.stringify(req.cookies)));
    console.log(">>    payload=" + payload);
    return ifLoggedIn(req, res, function(loginid) {
      var args, opts, urlpath;
      args = JSON.parse(payload);
      urlpath = args.urlpath;
      console.log(">>   proxying request: " + urlpath);
      opts = {
        host: config.ADSHOST,
        port: 80,
        path: urlpath,
        headers: {
          Cookie: "NASA_ADS_ID=" + req.cookies.nasa_ads_id
        }
      };
      return proxy.doProxy(opts, req, res);
    });
  };
  doADSProxy = doPost(doADSProxyHandler);
  quickRedirect = function(newloc) {
    return function(req, res, next) {
      res.writeHead(302, 'Redirect', {
        Location: newloc
      });
      res.statusCode = 302;
      return res.end();
    };
  };
  explorouter = connect(connect.router(function(app) {
    app.get('/publications', views.doPublications);
    app.get('/saved', views.doSaved);
    app.get('/group', views.doGroup);
    app.get('/objects', quickRedirect('publications/'));
    app.get('/observations', views.doObservations);
    app.get('/proposals', quickRedirect('publications/'));
    return app.get('/', quickRedirect('publications/'));
  }));
  server = connect.createServer();
  server.use(connect.cookieParser());
  server.use(connect.query());
  server.use(STATICPREFIX + '/', connect.static(__dirname + '/static/ajax-solr/'));
  server.use(SITEPREFIX + '/solr/', solrrouter);
  server.use(SITEPREFIX + '/solr2/', solrrouter2);
  server.use(SITEPREFIX + '/explorer/', explorouter);
  server.use(SITEPREFIX + '/adsjsonp', makeADSJSONPCall);
  server.use(SITEPREFIX + '/addtoredis', addUser);
  server.use(SITEPREFIX + '/getuser', getUser);
  server.use(SITEPREFIX + '/logout', logoutUser);
  server.use(SITEPREFIX + '/login', loginUser);
  server.use(SITEPREFIX + '/savesearch', doPost(saved.saveSearch));
  server.use(SITEPREFIX + '/savepub', doPost(saved.savePub));
  server.use(SITEPREFIX + '/saveobsv', doPost(saved.saveObsv));
  server.use(SITEPREFIX + '/savesearchestogroup', doPostWithJSON(saved.saveSearchesToGroup));
  server.use(SITEPREFIX + '/savepubstogroup', doPostWithJSON(saved.savePubsToGroup));
  server.use(SITEPREFIX + '/saveobsvstogroup', doPostWithJSON(saved.saveObsvsToGroup));
  server.use(SITEPREFIX + '/deletesearch', doPost(saved.deleteSearch));
  server.use(SITEPREFIX + '/deletesearches', doPost(saved.deleteSearches));
  server.use(SITEPREFIX + '/deletepub', doPost(saved.deletePub));
  server.use(SITEPREFIX + '/deletepubs', doPost(saved.deletePubs));
  server.use(SITEPREFIX + '/deleteobsv', doPost(saved.deleteObsv));
  server.use(SITEPREFIX + '/deleteobsvs', doPost(saved.deleteObsvs));
  server.use(SITEPREFIX + '/deletesearchesfromgroup', doPostWithJSON(saved.deleteSearchesFromGroup));
  server.use(SITEPREFIX + '/deletepubsfromgroup', doPostWithJSON(saved.deletePubsFromGroup));
  server.use(SITEPREFIX + '/deleteobsvsfromgroup', doPostWithJSON(saved.deleteObsvsFromGroup));
  server.use(SITEPREFIX + '/adsproxy', doADSProxy);
  server.use(SITEPREFIX + '/savedsearches', saved.getSavedSearches);
  server.use(SITEPREFIX + '/savedsearches2', saved.getSavedSearches2);
  server.use(SITEPREFIX + '/savedsearchesforgroup2', saved.getSavedSearchesForGroup2);
  server.use(SITEPREFIX + '/savedpubs', saved.getSavedPubs);
  server.use(SITEPREFIX + '/savedpubs2', saved.getSavedPubs2);
  server.use(SITEPREFIX + '/savedpubsforgroup2', saved.getSavedPubsForGroup2);
  server.use(SITEPREFIX + '/savedobsvs', saved.getSavedObsvs);
  server.use(SITEPREFIX + '/savedobsvs2', saved.getSavedObsvs2);
  server.use(SITEPREFIX + '/savedobsvsforgroup2', saved.getSavedObsvsForGroup2);
  server.use(SITEPREFIX + '/creategroup', doPostWithJSON(groups.createGroup));
  server.use(SITEPREFIX + '/addinvitationtogroup', doPostWithJSON(groups.addInvitationToGroup));
  server.use(SITEPREFIX + '/removeinvitationfromgroup', doPostWithJSON(groups.removeInvitationFromGroup));
  server.use(SITEPREFIX + '/acceptinvitationtogroup', doPostWithJSON(groups.acceptInvitationToGroup));
  server.use(SITEPREFIX + '/removeuserfromgroup', doPostWithJSON(groups.removeUserFromGroup));
  server.use(SITEPREFIX + '/changeownershipofgroup', doPostWithJSON(groups.changeOwnershipOfGroup));
  server.use(SITEPREFIX + '/removeoneselffromgroup', doPostWithJSON(groups.removeOneselfFromGroup));
  server.use(SITEPREFIX + '/deletegroup', doPostWithJSON(groups.deleteGroup));
  server.use(SITEPREFIX + '/getmembersofgroup', groups.getMembersOfGroup);
  server.use(SITEPREFIX + '/memberofgroups', groups.memberOfGroups);
  server.use(SITEPREFIX + '/pendinginvitationtogroups', groups.pendingInvitationToGroups);
  server.use('/images', connect.static(__dirname + '/static/ajax-solr/images/'));
  server.use('/bootstrap', connect.static(__dirname + '/static/ajax-solr/images/'));
  server.use('/backbone', connect.static(__dirname + '/static/ajax-solr/images/'));
  runServer = function(svr, port) {
    var hosturl, now;
    now = new Date();
    hosturl = "http://localhost:" + port + SITEPREFIX + "/explorer/publications/";
    console.log("" + (now.toUTCString()) + " - Starting server on " + hosturl);
    return svr.listen(port);
  };
  migration.validateRedis(redis_client, function() {
    return runServer(server, 3010);
  });
}).call(this);
