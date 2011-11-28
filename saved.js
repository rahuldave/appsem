(function() {
  /*
  Handles saved items - e.g. searches and publications - that involves
  accessing information from Redis.
  */
  var createSavedObsvTemplates, createSavedPubTemplates, createSavedSearchTemplates, deleteItem, deleteItems, failedRequest, getSavedObsvs, getSavedObsvs2, getSavedPubs, getSavedPubs2, getSavedSearches, getSavedSearches2, getSortedElements, getSortedElementsAndScores, ifLoggedIn, isArray, redis_client, removeDocs, removeObsvs, removeSearches, requests, saveObsv, savePub, saveSearch, successfulRequest, timeToText;
  redis_client = require("redis").createClient();
  requests = require("./requests");
  failedRequest = requests.failedRequest;
  successfulRequest = requests.successfulRequest;
  ifLoggedIn = requests.ifLoggedIn;
  saveSearch = function(payload, req, res, next) {
    var saveTime;
    console.log("In saveSearch: cookies=" + req.cookies + " payload=" + payload);
    saveTime = new Date().getTime();
    return ifLoggedIn(req, res, function(loginid) {
      var jsonObj, savedSearch;
      jsonObj = JSON.parse(payload);
      savedSearch = jsonObj.savedsearch;
      return redis_client.get("email:" + loginid, function(err, email) {
        var margs;
        margs = [['zadd', "savedsearch:" + email, saveTime, savedSearch]];
        return redis_client.multi(margs).exec(function(err2, reply) {
          return successfulRequest(res);
        });
      });
    });
  };
  savePub = function(payload, req, res, next) {
    var saveTime;
    console.log("In savePub: cookies=" + req.cookies + " payload=" + payload);
    saveTime = new Date().getTime();
    return ifLoggedIn(req, res, function(loginid) {
      var bibCode, jsonObj, savedPub, title;
      jsonObj = JSON.parse(payload);
      savedPub = jsonObj.savedpub;
      bibCode = jsonObj.pubbibcode;
      title = jsonObj.pubtitle;
      return redis_client.get("email:" + loginid, function(err, email) {
        var margs;
        margs = [['hset', "savedbibcodes:" + email, savedPub, bibCode], ['hset', "savedtitles:" + email, savedPub, title], ['zadd', "savedpub:" + email, saveTime, savedPub]];
        return redis_client.multi(margs).exec(function(err2, reply) {
          return successfulRequest(res);
        });
      });
    });
  };
  saveObsv = function(payload, req, res, next) {
    var saveTime;
    console.log("In saveObsv: cookies=" + req.cookies + " payload=" + payload);
    saveTime = new Date().getTime();
    return ifLoggedIn(req, res, function(loginid) {
      var jsonObj, savedObsv, target, title;
      jsonObj = JSON.parse(payload);
      savedObsv = jsonObj.savedobsv;
      target = jsonObj.obsvtarget;
      title = jsonObj.obsvtitle;
      return redis_client.get("email:" + loginid, function(err, email) {
        var margs;
        margs = [['hset', "savedtargets:" + email, savedObsv, target], ['hset', "savedobsvtitles:" + email, savedObsv, title], ['zadd', "savedobsv:" + email, saveTime, savedObsv]];
        return redis_client.multi(margs).exec(function(err2, reply) {
          return successfulRequest(res);
        });
      });
    });
  };
  timeToText = function(nowDate, timeString) {
    var d, delta, h, m, out, s, t;
    t = parseInt(timeString, 10);
    delta = nowDate - t;
    if (delta < 1000) {
      return "Now";
    } else if (delta < 60000) {
      return "" + (Math.floor(delta / 1000)) + "s ago";
    } else if (delta < 60000 * 60) {
      m = Math.floor(delta / 60000);
      s = Math.floor((delta - m * 60000) / 1000);
      out = "" + m + "m";
      if (s !== 0) {
        out += " " + s + "s";
      }
      return "" + out + " ago";
    } else if (delta < 60000 * 60 * 24) {
      h = Math.floor(delta / (60000 * 60));
      delta = delta - h * 60000 * 60;
      m = Math.floor(delta / 60000);
      out = "" + h + "h";
      if (m !== 0) {
        out += " " + m + "m";
      }
      return "" + out + " ago";
    }
    d = new Date(t);
    return d.toUTCString();
  };
  createSavedSearchTemplates = function(nowDate, searchkeys, searchtimes) {
    var i, makeTemplate, nsearch, view;
    view = {};
    nsearch = searchkeys.length;
    if (nsearch === 0) {
      view.hassearches = false;
      view.savedsearches = [];
    } else {
      view.hassearches = true;
      makeTemplate = function(ctr) {
        var key, out, time;
        key = searchkeys[ctr];
        time = searchtimes[ctr];
        out = {
          searchuri: key,
          searchtime: time,
          searchtimestr: timeToText(nowDate, time),
          searchctr: ctr
        };
        return out;
      };
      view.savedsearches = (function() {
        var _ref, _results;
        _results = [];
        for (i = 0, _ref = nsearch - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
          _results.push(makeTemplate(i));
        }
        return _results;
      })();
    }
    return view;
  };
  createSavedPubTemplates = function(nowDate, pubkeys, bibcodes, pubtitles, pubtimes) {
    var i, makeTemplate, npub, view;
    view = {};
    npub = pubkeys.length;
    if (npub === 0) {
      view.haspubs = false;
      view.savedpubs = [];
    } else {
      view.haspubs = true;
      makeTemplate = function(ctr) {
        var bibcode, linkuri, out;
        bibcode = bibcodes[ctr];
        linkuri = "bibcode%3A" + (bibcode.replace(/&/g, '%26'));
        out = {
          pubid: pubkeys[ctr],
          linktext: pubtitles[ctr],
          linkuri: linkuri,
          pubtime: pubtimes[ctr],
          pubtimestr: timeToText(nowDate, pubtimes[ctr]),
          bibcode: bibcode,
          pubctr: ctr
        };
        return out;
      };
      view.savedpubs = (function() {
        var _ref, _results;
        _results = [];
        for (i = 0, _ref = npub - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
          _results.push(makeTemplate(i));
        }
        return _results;
      })();
    }
    return view;
  };
  createSavedObsvTemplates = function(nowDate, obsvkeys, targets, obsvtitles, obsvtimes) {
    var i, makeTemplate, nobsv, view;
    view = {};
    nobsv = obsvkeys.length;
    if (nobsv === 0) {
      view.hasobsvs = false;
      view.savedobsvs = [];
    } else {
      view.hasobsvs = true;
      makeTemplate = function(ctr) {
        var linkuri, out, target;
        target = targets[ctr];
        linkuri = obsvkeys[ctr];
        out = {
          obsvid: obsvkeys[ctr],
          linktext: obsvtitles[ctr],
          linkuri: linkuri,
          obsvtime: obsvtimes[ctr],
          obsvtimestr: timeToText(nowDate, obsvtimes[ctr]),
          target: target,
          obsvctr: ctr
        };
        return out;
      };
      view.savedobsvs = (function() {
        var _ref, _results;
        _results = [];
        for (i = 0, _ref = nobsv - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
          _results.push(makeTemplate(i));
        }
        return _results;
      })();
    }
    return view;
  };
  getSortedElements = function(flag, key, cb) {
    return redis_client.zcard(key, function(err, nelem) {
      if (flag) {
        return redis_client.zrange(key, 0, nelem, cb);
      } else {
        return redis_client.zrevrange(key, 0, nelem, cb);
      }
    });
  };
  getSortedElementsAndScores = function(flag, key, cb) {
    return redis_client.zcard(key, function(e1, nelem) {
      var splitIt;
      if (nelem === 0) {
        return cb(e1, {
          elements: [],
          scores: []
        });
      } else {
        splitIt = function(err, values) {
          var i, nval, response;
          nval = values.length - 1;
          response = {
            elements: (function() {
              var _results;
              _results = [];
              for (i = 0; i <= nval; i += 2) {
                _results.push(values[i]);
              }
              return _results;
            })(),
            scores: (function() {
              var _results;
              _results = [];
              for (i = 1; i <= nval; i += 2) {
                _results.push(values[i]);
              }
              return _results;
            })()
          };
          return cb(err, response);
        };
        if (flag) {
          return redis_client.zrange(key, 0, nelem, "withscores", splitIt);
        } else {
          return redis_client.zrevrange(key, 0, nelem, "withscores", splitIt);
        }
      }
    });
  };
  getSavedSearches = function(req, res, next) {
    var doIt, kword;
    console.log("in getSavedSearches");
    kword = 'savedsearches';
    doIt = function(loginid) {
      return redis_client.get("email:" + loginid, function(err, email) {
        return getSortedElements(true, "savedsearch:" + email, function(err2, searches) {
          console.log("getSavedSearches reply=" + searches + " err=" + err2);
          return successfulRequest(res, {
            keyword: kword,
            message: searches
          });
        });
      });
    };
    return ifLoggedIn(req, res, doIt, {
      keyword: kword
    });
  };
  getSavedSearches2 = function(req, res, next) {
    var doIt, kword;
    kword = 'savedsearches';
    doIt = function(loginid) {
      return redis_client.get("email:" + loginid, function(err, email) {
        return getSortedElementsAndScores(false, "savedsearch:" + email, function(err2, searches) {
          var nowDate, view;
          if (err2 != null) {
            console.log("*** getSavedSearches2: failed for loginid=" + loginid + " email=" + email + " err=" + err2);
            return failedRequest(res, {
              keyword: kword
            });
          } else {
            nowDate = new Date().getTime();
            view = createSavedSearchTemplates(nowDate, searches.elements, searches.scores);
            return successfulRequest(res, {
              keyword: kword,
              message: view
            });
          }
        });
      });
    };
    return ifLoggedIn(req, res, doIt, {
      keyword: kword
    });
  };
  getSavedPubs = function(req, res, next) {
    var doIt, kword;
    kword = 'savedpubs';
    doIt = function(loginid) {
      return redis_client.get("email:" + loginid, function(err, email) {
        return getSortedElements(true, "savedpub:" + email, function(err2, searches) {
          console.log("getSavedPubs reply=" + searches + " err=" + err2);
          return successfulRequest(res, {
            keyword: kword,
            message: searches
          });
        });
      });
    };
    return ifLoggedIn(req, res, doIt, {
      keyword: kword
    });
  };
  getSavedPubs2 = function(req, res, next) {
    var doIt, kword;
    kword = 'savedpubs';
    doIt = function(loginid) {
      return redis_client.get("email:" + loginid, function(err, email) {
        return getSortedElementsAndScores(false, "savedpub:" + email, function(err2, savedpubs) {
          var pubkeys, pubtimes;
          if (err2 != null) {
            console.log("*** getSavedPubs2: failed for loginid=" + loginid + " email=" + email + " err=" + err2);
            return failedRequest(res, {
              keyword: kword
            });
          } else {
            pubkeys = savedpubs.elements;
            pubtimes = savedpubs.scores;
            return redis_client.hmget("savedtitles:" + email, pubkeys, function(err2, pubtitles) {
              return redis_client.hmget("savedbibcodes:" + email, pubkeys, function(err3, bibcodes) {
                var nowDate, view;
                nowDate = new Date().getTime();
                view = createSavedPubTemplates(nowDate, pubkeys, bibcodes, pubtitles, pubtimes);
                return successfulRequest(res, {
                  keyword: kword,
                  message: view
                });
              });
            });
          }
        });
      });
    };
    return ifLoggedIn(req, res, doIt, {
      keyword: kword
    });
  };
  getSavedObsvs = function(req, res, next) {
    var doIt, kword;
    kword = 'savedobsvs';
    doIt = function(loginid) {
      return redis_client.get("email:" + loginid, function(err, email) {
        return getSortedElements(true, "savedobsv:" + email, function(err2, searches) {
          console.log("getSavedObsvs reply=" + searches + " err=" + err2);
          return successfulRequest(res, {
            keyword: kword,
            message: searches
          });
        });
      });
    };
    return ifLoggedIn(req, res, doIt, {
      keyword: kword
    });
  };
  getSavedObsvs2 = function(req, res, next) {
    var doIt, kword;
    kword = 'savedobsvs';
    doIt = function(loginid) {
      return redis_client.get("email:" + loginid, function(err, email) {
        return getSortedElementsAndScores(false, "savedobsv:" + email, function(err2, savedobsvs) {
          var obsvkeys, obsvtimes;
          if (err2 != null) {
            console.log("*** getSavedObsvs2: failed for loginid=" + loginid + " email=" + email + " err=" + err2);
            return failedRequest(res, {
              keyword: kword
            });
          } else {
            obsvkeys = savedobsvs.elements;
            obsvtimes = savedobsvs.scores;
            return redis_client.hmget("savedobsvtitles:" + email, obsvkeys, function(err2, obsvtitles) {
              return redis_client.hmget("savedtargets:" + email, obsvkeys, function(err3, targets) {
                var nowDate, view;
                nowDate = new Date().getTime();
                view = createSavedObsvTemplates(nowDate, obsvkeys, targets, obsvtitles, obsvtimes);
                return successfulRequest(res, {
                  keyword: kword,
                  message: view
                });
              });
            });
          }
        });
      });
    };
    return ifLoggedIn(req, res, doIt, {
      keyword: kword
    });
  };
  removeSearches = function(res, loginid, searchids) {
    if (searchids.length === 0) {
      console.log("ERROR: removeSearches called with empty searchids list; loginid=" + loginid);
      failedRequest(res);
      return;
    }
    return redis_client.get("email:" + loginid, function(err, email) {
      var key, margs, sid;
      key = "savedsearch:" + email;
      margs = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = searchids.length; _i < _len; _i++) {
          sid = searchids[_i];
          _results.push(['zrem', key, sid]);
        }
        return _results;
      })();
      return redis_client.multi(margs).exec(function(err2, reply) {
        console.log("Removed " + searchids.length + " searches");
        return successfulRequest(res);
      });
    });
  };
  removeDocs = function(res, loginid, docids) {
    if (docids.length === 0) {
      console.log("ERROR: removeDocs called with empty docids list; loginid=" + loginid);
      failedRequest(res);
      return;
    }
    return redis_client.get("email:" + loginid, function(err, email) {
      var bibkey, docid, margs, margs1, margs2, margs3, pubkey, titlekey;
      console.log(">> removeDocs docids=" + docids);
      pubkey = "savedpub:" + email;
      titlekey = "savedtitles:" + email;
      bibkey = "savedbibcodes:" + email;
      margs1 = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = docids.length; _i < _len; _i++) {
          docid = docids[_i];
          _results.push(['zrem', pubkey, docid]);
        }
        return _results;
      })();
      margs2 = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = docids.length; _i < _len; _i++) {
          docid = docids[_i];
          _results.push(['hdel', titlekey, docid]);
        }
        return _results;
      })();
      margs3 = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = docids.length; _i < _len; _i++) {
          docid = docids[_i];
          _results.push(['hdel', bibkey, docid]);
        }
        return _results;
      })();
      margs = margs1.concat(margs2, margs2);
      return redis_client.multi(margs).exec(function(err2, reply) {
        console.log("Removed " + docids.length + " pubs");
        return successfulRequest(res);
      });
    });
  };
  removeObsvs = function(res, loginid, docids) {
    if (docids.length === 0) {
      console.log("ERROR: removeDocs called with empty docids list; loginid=" + loginid);
      failedRequest(res);
      return;
    }
    return redis_client.get("email:" + loginid, function(err, email) {
      var docid, margs, margs1, margs2, margs3, obsvkey, targetkey, titlekey;
      console.log(">> removeObsvs docids=" + docids);
      obsvkey = "savedobsv:" + email;
      titlekey = "savedobsvtitles:" + email;
      targetkey = "savedtargets:" + email;
      margs1 = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = docids.length; _i < _len; _i++) {
          docid = docids[_i];
          _results.push(['zrem', obsvkey, docid]);
        }
        return _results;
      })();
      margs2 = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = docids.length; _i < _len; _i++) {
          docid = docids[_i];
          _results.push(['hdel', titlekey, docid]);
        }
        return _results;
      })();
      margs3 = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = docids.length; _i < _len; _i++) {
          docid = docids[_i];
          _results.push(['hdel', targetkey, docid]);
        }
        return _results;
      })();
      margs = margs1.concat(margs2, margs2);
      return redis_client.multi(margs).exec(function(err2, reply) {
        console.log("Removed " + docids.length + " obsvs");
        return successfulRequest(res);
      });
    });
  };
  deleteItem = function(funcname, idname, delItems) {
    return function(payload, req, res, next) {
      console.log(">> In " + funcname);
      return ifLoggedIn(req, res, function(loginid) {
        var delid, jsonObj;
        jsonObj = JSON.parse(payload);
        delid = jsonObj[idname];
        console.log("deleteItem: logincookie=" + loginid + " item=" + delid);
        if (delid != null) {
          return delItems(res, loginid, [delid]);
        } else {
          return failedRequest(res);
        }
      });
    };
  };
  isArray = function (o) {
    return (o instanceof Array) ||
        (Object.prototype.toString.apply(o) === '[object Array]');
};;
  deleteItems = function(funcname, idname, delItems) {
    return function(payload, req, res, next) {
      console.log(">> In " + funcname);
      return ifLoggedIn(req, res, function(loginid) {
        var action, delids, terms;
        terms = JSON.parse(payload);
        console.log(">> JSON payload=" + payload);
        action = terms.action;
        delids = isArray(terms[idname]) ? terms[idname] : [terms[idname]];
        if (action === "delete" && delids.length > 0) {
          return delItems(res, loginid, delids);
        } else {
          return failedRequest(res);
        }
      });
    };
  };
  exports.deleteSearch = deleteItem("deleteSearch", "searchid", removeSearches);
  exports.deletePub = deleteItem("deletePub", "pubid", removeDocs);
  exports.deleteObsv = deleteItem("deleteObsv", "obsvid", removeObsvs);
  exports.deleteSearches = deleteItems("deleteSearches", "searchid", removeSearches);
  exports.deletePubs = deleteItems("deletePubs", "pubid", removeDocs);
  exports.deleteObsvs = deleteItems("deleteObsvs", "obsvid", removeObsvs);
  exports.saveSearch = saveSearch;
  exports.savePub = savePub;
  exports.saveObsv = saveObsv;
  exports.getSavedSearches = getSavedSearches;
  exports.getSavedSearches2 = getSavedSearches2;
  exports.getSavedPubs = getSavedPubs;
  exports.getSavedPubs2 = getSavedPubs2;
  exports.getSavedObsvs = getSavedObsvs;
  exports.getSavedObsvs2 = getSavedObsvs2;
}).call(this);
