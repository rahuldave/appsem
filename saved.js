(function() {
  /*
  Handles saved items - e.g. searches and publications - that involves
  accessing information from Redis.
  */
  var createSavedObsvTemplates, createSavedPubTemplates, createSavedSearchTemplates, deleteItem, deleteItems, failedRequest, getSavedObsvs, getSavedObsvs2, getSavedObsvsForGroup2, getSavedPubs, getSavedPubs2, getSavedPubsForGroup2, getSavedSearches, getSavedSearches2, getSavedSearchesForGroup2, getSortedElements, getSortedElementsAndScores, ifLoggedIn, isArray, redis_client, removeObsvs, removeObsvsFromGroup, removePubs, removePubsFromGroup, removeSearches, removeSearchesFromGroup, requests, saveObsv, saveObsvToGroup, savePub, savePubToGroup, saveSearch, saveSearchToGroup, searchToText, successfulRequest, timeToText;
  var __hasProp = Object.prototype.hasOwnProperty;
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
  saveSearchToGroup = function(payload, req, res, next) {
    var saveTime;
    console.log("In saveSearchtoGroup: cookies=" + req.cookies + " payload=" + payload);
    saveTime = new Date().getTime();
    return ifLoggedIn(req, res, function(loginid) {
      var jsonObj, savedGroup, savedSearch;
      jsonObj = JSON.parse(payload);
      savedSearch = jsonObj.savedsearch;
      savedGroup = jsonObj.savedgroup;
      return redis_client.get("email:" + loginid, function(err, savedBy) {
        var margs, savejson;
        savejson = {
          savedBy: savedBy,
          savedSearch: savedSearch
        };
        margs = [['zadd', "savedsearch:" + savedGroup, saveTime, JSON.stringify(savejson)]];
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
        margs = [['hset', "savedbibcodes", savedPub, bibCode], ['hset', "savedtitles", savedPub, title], ['zadd', "savedpub:" + email, saveTime, savedPub]];
        return redis_client.multi(margs).exec(function(err2, reply) {
          return successfulRequest(res);
        });
      });
    });
  };
  savePubToGroup = function(payload, req, res, next) {
    var saveTime;
    console.log("In savePubToGroup: cookies=" + req.cookies + " payload=" + payload);
    saveTime = new Date().getTime();
    return ifLoggedIn(req, res, function(loginid) {
      var jsonObj, savedGroup, savedPub;
      jsonObj = JSON.parse(payload);
      savedPub = jsonObj.savedpub;
      savedGroup = jsonObj.savedgroup;
      return redis_client.get("email:" + loginid, function(err, savedBy) {
        var margs, savejson;
        savejson = {
          savedBy: savedBy,
          savedPub: savedPub
        };
        margs = [['zadd', "savedpub:" + savedGroup, saveTime, JSON.stringify(savejson)]];
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
        margs = [['hset', "savedtargets", savedObsv, target], ['hset', "savedobsvtitles", savedObsv, title], ['zadd', "savedobsv:" + email, saveTime, savedObsv]];
        return redis_client.multi(margs).exec(function(err2, reply) {
          return successfulRequest(res);
        });
      });
    });
  };
  saveObsvToGroup = function(payload, req, res, next) {
    var saveTime;
    console.log("In saveObsvToGroup: cookies=" + req.cookies + " payload=" + payload);
    saveTime = new Date().getTime();
    return ifLoggedIn(req, res, function(loginid) {
      var jsonObj, savedGroup, savedObsv;
      jsonObj = JSON.parse(payload);
      savedObsv = jsonObj.savedobsv;
      savedGroup = jsonObj.savedgroup;
      return redis_client.get("email:" + loginid, function(err, savedBy) {
        var margs, savejson;
        savejson = {
          savedBy: savedBy,
          savedObsv: savedObsv
        };
        margs = [['zadd', "savedobsv:" + savedGroup, saveTime, JSON.stringify(savejson)]];
        return redis_client.multi(margs).exec(function(err2, reply) {
          return successfulRequest(res);
        });
      });
    });
  };
  searchToText = function(searchTerm) {
    var name, out, s, splits, term, terms, value, _i, _len, _ref;
    splits = searchTerm.split('#');
    s = "&" + splits[1];
    s = s.replace('&q=*%3A*', '');
    terms = s.split(/&fq=/);
    terms.shift();
    out = '';
    for (_i = 0, _len = terms.length; _i < _len; _i++) {
      term = terms[_i];
      _ref = decodeURIComponent(term).split(':', 2), name = _ref[0], value = _ref[1];
      out += "" + name + "=" + value + " ";
    }
    return out;
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
  createSavedSearchTemplates = function(nowDate, searchkeys, searchtimes, searchbys) {
    var i, makeTemplate, nsearch, view;
    view = {};
    console.log("VIEW", view);
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
          searchby: searchbys[ctr],
          searchtext: searchToText(key),
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
  createSavedPubTemplates = function(nowDate, pubkeys, bibcodes, pubtitles, pubtimes, searchbys) {
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
          searchby: searchbys[ctr],
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
  createSavedObsvTemplates = function(nowDate, obsvkeys, targets, obsvtitles, obsvtimes, searchbys) {
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
          searchby: searchbys[ctr],
          linktext: obsvkeys[ctr],
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
          var ele, nowDate, view;
          if (err2 != null) {
            console.log("*** getSavedSearches2: failed for loginid=" + loginid + " email=" + email + " err=" + err2);
            return failedRequest(res, {
              keyword: kword
            });
          } else {
            nowDate = new Date().getTime();
            view = createSavedSearchTemplates(nowDate, searches.elements, searches.scores, (function() {
              var _i, _len, _ref, _results;
              _ref = searches.elements;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                ele = _ref[_i];
                _results.push(email);
              }
              return _results;
            })());
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
  getSavedSearchesForGroup2 = function(req, res, next) {
    var doIt, kword;
    kword = 'savedsearchesforgroup';
    doIt = function(loginid) {
      var wantedGroup;
      wantedGroup = req.query.wantedgroup;
      return redis_client.get("email:" + loginid, function(err, email) {
        return redis_client.sismember(wantedGroup, email, function(errm, saved_p) {
          if (saved_p) {
            return getSortedElementsAndScores(false, "savedsearch:" + wantedGroup, function(err2, searches) {
              var jsonObj, nowDate, searchbys, searchelements, searchesjson, sjson, view;
              if (err2 != null) {
                console.log("*** getSavedSearchesForGroup2: failed for loginid=" + loginid + " email=" + email + " err=" + err2);
                return failedRequest(res, {
                  keyword: kword
                });
              } else {
                searchesjson = (function() {
                  var _i, _len, _ref, _results;
                  _ref = searches.elements;
                  _results = [];
                  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    sjson = _ref[_i];
                    _results.push(JSON.parse(sjson));
                  }
                  return _results;
                })();
                searchelements = (function() {
                  var _i, _len, _results;
                  _results = [];
                  for (_i = 0, _len = searchesjson.length; _i < _len; _i++) {
                    jsonObj = searchesjson[_i];
                    _results.push(jsonObj.savedSearch);
                  }
                  return _results;
                })();
                searchbys = (function() {
                  var _i, _len, _results;
                  _results = [];
                  for (_i = 0, _len = searchesjson.length; _i < _len; _i++) {
                    jsonObj = searchesjson[_i];
                    _results.push(jsonObj.savedBy);
                  }
                  return _results;
                })();
                nowDate = new Date().getTime();
                view = createSavedSearchTemplates(nowDate, searchelements, searches.scores, searchbys);
                return successfulRequest(res, {
                  keyword: kword,
                  message: view
                });
              }
            });
          } else {
            console.log("*** getSavedSearchesForGroup2: membership failed for loginid=" + loginid + " email=" + email + " err=" + errm);
            return failedRequest(res, {
              keyword: kword
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
            return redis_client.hmget("savedtitles", pubkeys, function(err2, pubtitles) {
              return redis_client.hmget("savedbibcodes", pubkeys, function(err3, bibcodes) {
                var ele, nowDate, view;
                nowDate = new Date().getTime();
                view = createSavedPubTemplates(nowDate, pubkeys, bibcodes, pubtitles, pubtimes, (function() {
                  var _i, _len, _ref, _results;
                  _ref = savedpubs.elements;
                  _results = [];
                  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    ele = _ref[_i];
                    _results.push(email);
                  }
                  return _results;
                })());
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
  getSavedPubsForGroup2 = function(req, res, next) {
    var doIt, kword;
    kword = 'savedpubsforgroup';
    doIt = function(loginid) {
      var wantedGroup;
      wantedGroup = req.query.wantedgroup;
      return redis_client.get("email:" + loginid, function(err, email) {
        return redis_client.sismember(wantedGroup, email, function(errm, saved_p) {
          if (saved_p) {
            return getSortedElementsAndScores(false, "savedpub:" + wantedGroup, function(err2, savedpubs) {
              var jsonObj, pubkeys, pubtimes, searchbys, searchesjson, sjson;
              if (err2 != null) {
                console.log("*** getSavedPubsForGroup2: failed for loginid=" + loginid + " email=" + email + " err=" + err2);
                return failedRequest(res, {
                  keyword: kword
                });
              } else {
                searchesjson = (function() {
                  var _i, _len, _ref, _results;
                  _ref = savedpubs.elements;
                  _results = [];
                  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    sjson = _ref[_i];
                    _results.push(JSON.parse(sjson));
                  }
                  return _results;
                })();
                pubkeys = (function() {
                  var _i, _len, _results;
                  _results = [];
                  for (_i = 0, _len = searchesjson.length; _i < _len; _i++) {
                    jsonObj = searchesjson[_i];
                    _results.push(jsonObj.savedPub);
                  }
                  return _results;
                })();
                searchbys = (function() {
                  var _i, _len, _results;
                  _results = [];
                  for (_i = 0, _len = searchesjson.length; _i < _len; _i++) {
                    jsonObj = searchesjson[_i];
                    _results.push(jsonObj.savedBy);
                  }
                  return _results;
                })();
                pubtimes = savedpubs.scores;
                return redis_client.hmget("savedtitles", pubkeys, function(err2, pubtitles) {
                  return redis_client.hmget("savedbibcodes", pubkeys, function(err3, bibcodes) {
                    var nowDate, view;
                    nowDate = new Date().getTime();
                    view = createSavedPubTemplates(nowDate, pubkeys, bibcodes, pubtitles, pubtimes, searchbys);
                    return successfulRequest(res, {
                      keyword: kword,
                      message: view
                    });
                  });
                });
              }
            });
          } else {
            console.log("*** getSavedPubsForGroup2: membership failed for loginid=" + loginid + " email=" + email + " err=" + errm);
            return failedRequest(res, {
              keyword: kword
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
            return redis_client.hmget("savedobsvtitles", obsvkeys, function(err2, obsvtitles) {
              return redis_client.hmget("savedtargets", obsvkeys, function(err3, targets) {
                var ele, nowDate, view;
                nowDate = new Date().getTime();
                view = createSavedObsvTemplates(nowDate, obsvkeys, targets, obsvtitles, obsvtimes, (function() {
                  var _i, _len, _ref, _results;
                  _ref = savedobsvs.elements;
                  _results = [];
                  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    ele = _ref[_i];
                    _results.push(email);
                  }
                  return _results;
                })());
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
  getSavedObsvsForGroup2 = function(req, res, next) {
    var doIt, kword;
    kword = 'savedobsvsforgroup';
    doIt = function(loginid) {
      var wantedGroup;
      wantedGroup = req.query.wantedgroup;
      return redis_client.get("email:" + loginid, function(err, email) {
        return redis_client.sismember(wantedGroup, email, function(errm, saved_p) {
          if (saved_p) {
            return getSortedElementsAndScores(false, "savedobsv:" + wantedGroup, function(err2, savedobsvs) {
              var jsonObj, obsvkeys, obsvtimes, searchbys, searchesjson, sjson;
              if (err2 != null) {
                console.log("*** getSavedObsvsForGroup2: failed for loginid=" + loginid + " email=" + email + " err=" + err2);
                return failedRequest(res, {
                  keyword: kword
                });
              } else {
                searchesjson = (function() {
                  var _i, _len, _ref, _results;
                  _ref = savedobsvs.elements;
                  _results = [];
                  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    sjson = _ref[_i];
                    _results.push(JSON.parse(sjson));
                  }
                  return _results;
                })();
                obsvkeys = (function() {
                  var _i, _len, _results;
                  _results = [];
                  for (_i = 0, _len = searchesjson.length; _i < _len; _i++) {
                    jsonObj = searchesjson[_i];
                    _results.push(jsonObj.savedObsv);
                  }
                  return _results;
                })();
                searchbys = (function() {
                  var _i, _len, _results;
                  _results = [];
                  for (_i = 0, _len = searchesjson.length; _i < _len; _i++) {
                    jsonObj = searchesjson[_i];
                    _results.push(jsonObj.savedBy);
                  }
                  return _results;
                })();
                obsvtimes = savedobsvs.scores;
                return redis_client.hmget("savedobsvtitles", obsvkeys, function(err2, obsvtitles) {
                  return redis_client.hmget("savedtargets", obsvkeys, function(err3, targets) {
                    var nowDate, view;
                    nowDate = new Date().getTime();
                    view = createSavedObsvTemplates(nowDate, obsvkeys, targets, obsvtitles, obsvtimes, searchbys);
                    return successfulRequest(res, {
                      keyword: kword,
                      message: view
                    });
                  });
                });
              }
            });
          } else {
            console.log("*** getSavedObsvsForGroup2: membership failed for loginid=" + loginid + " email=" + email + " err=" + errm);
            return failedRequest(res, {
              keyword: kword
            });
          }
        });
      });
    };
    return ifLoggedIn(req, res, doIt, {
      keyword: kword
    });
  };
  removeSearches = function(res, loginid, group, searchids) {
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
  removeSearchesFromGroup = function(res, loginid, group, searchids) {
    if (searchids.length === 0) {
      console.log("ERROR: removeSearches called with empty searchids list; loginid=" + loginid);
      failedRequest(res);
      return;
    }
    return redis_client.get("email:" + loginid, function(err, email) {
      var key, key2, margs, margs1, margs2, sid;
      key = "savedsearch:" + email;
      key2 = "savedsearch:" + group;
      margs1 = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = searchids.length; _i < _len; _i++) {
          sid = searchids[_i];
          _results.push(['zrank', key, sid]);
        }
        return _results;
      })();
      margs2 = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = searchids.length; _i < _len; _i++) {
          sid = searchids[_i];
          _results.push(['zrank', key2, sid]);
        }
        return _results;
      })();
      margs = margs1.concat(margs2);
      return redis_client.multi(margs).exec(function(err, replies) {
        var key, margs3, rank, ranks, rid, uniq, _i, _j, _len, _len2, _ref;
        uniq = {};
        for (_i = 0, _len = replies.length; _i < _len; _i++) {
          rank = replies[_i];
          if (rank !== 'nil') {
            if ((_ref = uniq[rank]) == null) {
              uniq[rank] = 0;
            }
          }
        }
        for (_j = 0, _len2 = replies.length; _j < _len2; _j++) {
          rank = replies[_j];
          if (rank !== 'nil') {
            uniq[rank]++;
          }
        }
        ranks = (function() {
          var _results;
          _results = [];
          for (key in uniq) {
            if (!__hasProp.call(uniq, key)) continue;
            if (uniq[key] === 2) {
              _results.push(key);
            }
          }
          return _results;
        })();
        margs3 = (function() {
          var _k, _len3, _results;
          _results = [];
          for (_k = 0, _len3 = ranks.length; _k < _len3; _k++) {
            rid = ranks[_k];
            _results.push(['zremrangebyrank', key2, rid, rid]);
          }
          return _results;
        })();
        return redis_client.multi(margs3).exec(function(err2, reply) {
          console.log("Removed " + ranks.length + " searches from group " + group);
          return successfulRequest(res);
        });
      });
    });
  };
  removePubs = function(res, loginid, group, docids) {
    if (docids.length === 0) {
      console.log("ERROR: removePubs called with empty docids list; loginid=" + loginid);
      failedRequest(res);
      return;
    }
    return redis_client.get("email:" + loginid, function(err, email) {
      var docid, margs, margs1, pubkey;
      console.log(">> removePubs docids=" + docids);
      pubkey = "savedpub:" + email;
      margs1 = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = docids.length; _i < _len; _i++) {
          docid = docids[_i];
          _results.push(['zrem', pubkey, docid]);
        }
        return _results;
      })();
      margs = margs1;
      return redis_client.multi(margs).exec(function(err2, reply) {
        console.log("Removed " + docids.length + " pubs");
        return successfulRequest(res);
      });
    });
  };
  removePubsFromGroup = function(res, loginid, group, docids) {
    if (docids.length === 0) {
      console.log("ERROR: removePubsFromGroup called with empty docids list; loginid=" + loginid);
      failedRequest(res);
      return;
    }
    return redis_client.get("email:" + loginid, function(err, email) {
      var docid, key, key2, margs, margs1, margs2;
      console.log(">> removePubsFromGroup docids=" + docids);
      key = "savedpub:" + email;
      key2 = "savedpub:" + group;
      margs1 = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = docids.length; _i < _len; _i++) {
          docid = docids[_i];
          _results.push(['zrank', key, docid]);
        }
        return _results;
      })();
      margs2 = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = docids.length; _i < _len; _i++) {
          docid = docids[_i];
          _results.push(['zrank', key2, docid]);
        }
        return _results;
      })();
      margs = margs1.concat(margs2);
      return redis_client.multi(margs).exec(function(err, replies) {
        var key, margs3, rank, ranks, rid, uniq, _i, _j, _len, _len2, _ref;
        uniq = {};
        for (_i = 0, _len = replies.length; _i < _len; _i++) {
          rank = replies[_i];
          if (rank !== 'nil') {
            if ((_ref = uniq[rank]) == null) {
              uniq[rank] = 0;
            }
          }
        }
        for (_j = 0, _len2 = replies.length; _j < _len2; _j++) {
          rank = replies[_j];
          if (rank !== 'nil') {
            uniq[rank]++;
          }
        }
        ranks = (function() {
          var _results;
          _results = [];
          for (key in uniq) {
            if (!__hasProp.call(uniq, key)) continue;
            if (uniq[key] === 2) {
              _results.push(key);
            }
          }
          return _results;
        })();
        margs3 = (function() {
          var _k, _len3, _results;
          _results = [];
          for (_k = 0, _len3 = ranks.length; _k < _len3; _k++) {
            rid = ranks[_k];
            _results.push(['zremrangebyrank', key2, rid, rid]);
          }
          return _results;
        })();
        return redis_client.multi(margs3).exec(function(err2, reply) {
          console.log("Removed " + ranks.length + " pubs from group " + group);
          return successfulRequest(res);
        });
      });
    });
  };
  removeObsvs = function(res, loginid, group, docids) {
    if (docids.length === 0) {
      console.log("ERROR: removeObsvs called with empty docids list; loginid=" + loginid);
      failedRequest(res);
      return;
    }
    return redis_client.get("email:" + loginid, function(err, email) {
      var docid, margs, margs1, obsvkey;
      console.log(">> removeObsvs docids=" + docids);
      obsvkey = "savedobsv:" + email;
      margs1 = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = docids.length; _i < _len; _i++) {
          docid = docids[_i];
          _results.push(['zrem', obsvkey, docid]);
        }
        return _results;
      })();
      margs = margs1;
      return redis_client.multi(margs).exec(function(err2, reply) {
        console.log("Removed " + docids.length + " obsvs");
        return successfulRequest(res);
      });
    });
  };
  removeObsvsFromGroup = function(res, loginid, group, docids) {
    if (docids.length === 0) {
      console.log("ERROR: removeObsvsFromGroup called with empty docids list; loginid=" + loginid);
      failedRequest(res);
      return;
    }
    return redis_client.get("email:" + loginid, function(err, email) {
      var docid, key, key2, margs, margs1, margs2;
      console.log(">> removePubsFromGroup docids=" + docids);
      key = "savedobsv:" + email;
      key2 = "savedobsv:" + group;
      margs1 = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = docids.length; _i < _len; _i++) {
          docid = docids[_i];
          _results.push(['zrank', key, docid]);
        }
        return _results;
      })();
      margs2 = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = docids.length; _i < _len; _i++) {
          docid = docids[_i];
          _results.push(['zrank', key2, docid]);
        }
        return _results;
      })();
      margs = margs1.concat(margs2);
      return redis_client.multi(margs).exec(function(err, replies) {
        var key, margs3, rank, ranks, rid, uniq, _i, _j, _len, _len2, _ref;
        uniq = {};
        for (_i = 0, _len = replies.length; _i < _len; _i++) {
          rank = replies[_i];
          if (rank !== 'nil') {
            if ((_ref = uniq[rank]) == null) {
              uniq[rank] = 0;
            }
          }
        }
        for (_j = 0, _len2 = replies.length; _j < _len2; _j++) {
          rank = replies[_j];
          if (rank !== 'nil') {
            uniq[rank]++;
          }
        }
        ranks = (function() {
          var _results;
          _results = [];
          for (key in uniq) {
            if (!__hasProp.call(uniq, key)) continue;
            if (uniq[key] === 2) {
              _results.push(key);
            }
          }
          return _results;
        })();
        margs3 = (function() {
          var _k, _len3, _results;
          _results = [];
          for (_k = 0, _len3 = ranks.length; _k < _len3; _k++) {
            rid = ranks[_k];
            _results.push(['zremrangebyrank', key2, rid, rid]);
          }
          return _results;
        })();
        return redis_client.multi(margs3).exec(function(err2, reply) {
          console.log("Removed " + ranks.length + " obsvs from group " + group);
          return successfulRequest(res);
        });
      });
    });
  };
  deleteItem = function(funcname, idname, delItems) {
    return function(payload, req, res, next) {
      console.log(">> In " + funcname);
      return ifLoggedIn(req, res, function(loginid) {
        var delid, group, jsonObj;
        jsonObj = JSON.parse(payload);
        delid = jsonObj[idname];
        group = 'default';
        console.log("deleteItem: logincookie=" + loginid + " item=" + delid);
        if (delid != null) {
          return delItems(res, loginid, group, [delid]);
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
        var action, delids, group, terms, _ref;
        terms = JSON.parse(payload);
        console.log(">> JSON payload=" + payload);
        action = terms.action;
        group = (_ref = terms.group) != null ? _ref : 'default';
        delids = isArray(terms[idname]) ? terms[idname] : [terms[idname]];
        if (action === "delete" && delids.length > 0) {
          return delItems(res, loginid, group, delids);
        } else {
          return failedRequest(res);
        }
      });
    };
  };
  exports.deleteSearch = deleteItem("deleteSearch", "searchid", removeSearches);
  exports.deletePub = deleteItem("deletePub", "pubid", removePubs);
  exports.deleteObsv = deleteItem("deleteObsv", "obsvid", removeObsvs);
  exports.deleteSearches = deleteItems("deleteSearches", "searchid", removeSearches);
  exports.deletePubs = deleteItems("deletePubs", "pubid", removePubs);
  exports.deleteObsvs = deleteItems("deleteObsvs", "obsvid", removeObsvs);
  exports.deleteSearchesFromGroup = deleteItems("deleteSearches", "searchid", removeSearchesFromGroup);
  exports.deletePubsFromGroup = deleteItems("deletePubs", "pubid", removePubsFromGroup);
  exports.deleteObsvsFromGroup = deleteItems("deleteObsvs", "obsvid", removeObsvsFromGroup);
  exports.saveSearch = saveSearch;
  exports.savePub = savePub;
  exports.saveObsv = saveObsv;
  exports.saveSearchToGroup = saveSearchToGroup;
  exports.savePubToGroup = savePubToGroup;
  exports.saveObsvToGroup = saveObsvToGroup;
  exports.getSavedSearches = getSavedSearches;
  exports.getSavedSearches2 = getSavedSearches2;
  exports.getSavedSearchesForGroup2 = getSavedSearchesForGroup2;
  exports.getSavedPubs = getSavedPubs;
  exports.getSavedPubs2 = getSavedPubs2;
  exports.getSavedPubsForGroup2 = getSavedPubsForGroup2;
  exports.getSavedObsvs = getSavedObsvs;
  exports.getSavedObsvs2 = getSavedObsvs2;
  exports.getSavedObsvsForGroup2 = getSavedObsvsForGroup2;
}).call(this);
