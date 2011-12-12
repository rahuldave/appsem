(function() {
  var assert, config, getRequestOptions, logincookie, makeCookieJar, request, s1, should, testGlobal, vows;
  config = require('../config').config;
  request = require('request');
  assert = require('assert');
  vows = require('vows');
  should = require('should');
  testGlobal = {};
  testGlobal.jar = null;
  logincookie = 'logincookie=GJnUa6yclX8Z5ko1; path=/; expires=Sat, 08 Dec 2012 22:26:43 GMT';
  makeCookieJar = function() {
    var c, j;
    j = request.jar();
    c = request.cookie(logincookie);
    j.add(c);
    testGlobal.jar = j;
    return j;
  };
  getRequestOptions = function(requestType, cookieJar, postHash) {
    var requestdict;
    return requestdict = {
      url: "http://localhost:3010" + config.SITEPREFIX + "/" + requestType + "group",
      jar: cookieJar,
      body: JSON.stringify(postHash)
    };
  };
  s1 = vows.describe("start and remove a group");
  s1.addBatch({
    'buildup': {
      topic: makeCookieJar(),
      'a cookie jar with one cookie': function(jar) {
        return (jar != null) && jar.cookies.should.have.length(1);
      }
    }
  });
  s1.addBatch({
    "add a group": {
      topic: function() {
        var requestdict;
        requestdict = getRequestOptions('create', testGlobal.jar, {
          rawGroupName: 'huns'
        });
        return request.post(requestdict, this.callback);
      },
      'group was created': function(error, res, body) {
        console.log(body, typeof res.statusCode);
        return assert.deepEqual(res.statusCode, 200);
      }
    }
  });
  s1["export"](module);
}).call(this);
