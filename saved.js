(function() {
  /*
  Handles saved items - e.g. searches and publications - that involves
  accessing information from Redis.
  */
  var createSavedObsvTemplates, createSavedPubTemplates, createSavedSearchTemplates, deleteItem, deleteItems, failedRequest, getSavedObsvs, getSavedObsvs2, getSavedObsvsForGroup2, getSavedPubs, getSavedPubs2, getSavedPubsForGroup2, getSavedSearches, getSavedSearches2, getSavedSearchesForGroup2, getSortedElements, getSortedElementsAndScores, ifLoggedIn, isArray, redis_client, removeObsvs, removeObsvsFromGroup, removePubs, removePubsFromGroup, removeSearches, removeSearchesFromGroup, requests, saveObsv, saveObsvsToGroup, savePub, savePubsToGroup, saveSearch, saveSearchesToGroup, searchToText, successfulRequest, timeToText, _doRemoveSearchesFromGroup, _doSaveSearchToGroup, _doSearchForGroup;
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
  _doSaveSearchToGroup = function(savedBy, savedhashlist, searchtype, res) {
    var margs, savedhash, savedtype;
    savedtype = "saved" + searchtype;
    margs = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = savedhashlist.length; _i < _len; _i++) {
        savedhash = savedhashlist[_i];
        _results.push(['hexists', "savedby:" + savedhash.savedgroup, savedhash.savedsearch]);
      }
      return _results;
    })();
    return redis_client.multi(margs).exec(function(err, replies) {
      var idx, savedGroup, savedSearch, _ref, _results;
      _results = [];
      for (idx = 0, _ref = replies.length; 0 <= _ref ? idx < _ref : idx > _ref; 0 <= _ref ? idx++ : idx--) {
        if (replies[idx] !== 1) {
          savedSearch = savedhashlist[idx][savedtype];
          savedGroup = savedhashlist[idx].savedgroup;
          _results.push(redis_client.hget("savedInGroups:" + searchtype, savedSearch, function(err2, reply) {
            var groupJson;
            if (reply === 'nil') {
              groupJson = [savedGroup];
            } else {
              groupJson = JSON.parse(reply);
              groupJson.push(savedGroup);
            }
            margs = [['zadd', "saved" + searchtype + ":" + savedBy + ":" + savedGroup, saveTime, savedSearch], ['zadd', "saved" + searchtype + ":" + savedGroup, saveTime, savedSearch], ['hset', "savedby:" + savedGroup, savedSearch, savedBy], ['hset', "savedInGroups:" + searchtype, savedSearch, JSON.stringify(groupJson)]];
            return redis_client.multi(margs).exec(function(err2, reply) {
              return successfulRequest(res);
            });
          }));
        }
      }
      return _results;
    });
  };
  saveSearchesToGroup = function(payload, req, res, next) {
    var saveTime;
    console.log("In saveSearchtoGroup: cookies=" + req.cookies + " payload=" + payload);
    saveTime = new Date().getTime();
    return ifLoggedIn(req, res, function(loginid) {
      var savedhashlist;
      savedhashlist = JSON.parse(payload);
      return redis_client.get("email:" + loginid, function(err, savedBy) {
        return _doSaveSearchToGroup(savedBy, savedhashlist, 'search', res);
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
  savePubsToGroup = function(payload, req, res, next) {
    var saveTime;
    console.log("In savePubToGroup: cookies=" + req.cookies + " payload=" + payload);
    saveTime = new Date().getTime();
    return ifLoggedIn(req, res, function(loginid) {
      var savedhashlist;
      savedhashlist = JSON.parse(payload);
      return redis_client.get("email:" + loginid, function(err, savedBy) {
        return _doSaveSearchToGroup(savedBy, savedhashlist, 'pub', res);
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
  saveObsvsToGroup = function(payload, req, res, next) {
    var saveTime;
    console.log("In saveObsvToGroup: cookies=" + req.cookies + " payload=" + payload);
    saveTime = new Date().getTime();
    return ifLoggedIn(req, res, function(loginid) {
      var savedhashlist;
      savedhashlist = JSON.parse(payload);
      return redis_client.get("email:" + loginid, function(err, savedBy) {
        return _doSaveSearchToGroup(savedBy, savedhashlist, 'obsv', res);
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
  createSavedSearchTemplates = function(nowDate, searchkeys, searchtimes, searchbys, groupsin) {
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
          groupsin: groupsin[ctr],
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
  createSavedPubTemplates = function(nowDate, pubkeys, pubtimes, bibcodes, pubtitles, searchbys, groupsin) {
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
          groupsin: groupsin[ctr],
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
  createSavedObsvTemplates = function(nowDate, obsvkeys, obsvtimes, targets, obsvtitles, searchbys, groupsin) {
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
          groupsin: groupsin[ctr],
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
            })(), (function() {
              var _i, _len, _ref, _results;
              _ref = searches.elements;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                ele = _ref[_i];
                _results.push(['default']);
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
  _doSearchForGroup = function(email, wantedGroup, searchtype, templateCreatorFunc, res, kword, augmenthash) {
    if (augmenthash == null) {
      augmenthash = null;
    }
    return redis_client.sismember(wantedGroup, email, function(errm, saved_p) {
      if (saved_p) {
        return getSortedElementsAndScores(false, "saved" + searchtype + ":" + wantedGroup, function(err2, searches) {
          var ele, margs;
          if (err2 != null) {
            console.log("*** getSaved" + searchtype + "ForGroup2: failed for email=" + email + " err=" + err2);
            return failedRequest(res, {
              keyword: kword
            });
          } else {
            margs = (function() {
              var _i, _len, _ref, _results;
              _ref = searches.elements;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                ele = _ref[_i];
                _results.push(['hget', "savedby:" + wantedGroup, ele]);
              }
              return _results;
            })();
            return redis_client.multi(margs).exec(function(err, replies) {
              var ele, margs2, nowDate, reply, searchbys;
              searchbys = (function() {
                var _i, _len, _results;
                _results = [];
                for (_i = 0, _len = replies.length; _i < _len; _i++) {
                  reply = replies[_i];
                  _results.push(reply);
                }
                return _results;
              })();
              nowDate = new Date().getTime();
              margs2 = (function() {
                var _i, _len, _ref, _results;
                _ref = searches.elements;
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  ele = _ref[_i];
                  _results.push(['hget', "savedinGroup:" + searchtype, ele]);
                }
                return _results;
              })();
              return redis_client.multi(margs2).exec(function(err, replies) {
                var ele, savedingroups, view;
                savedingroups = (function() {
                  var _i, _len, _results;
                  _results = [];
                  for (_i = 0, _len = replies.length; _i < _len; _i++) {
                    ele = replies[_i];
                    _results.push(JSON.parse(ele));
                  }
                  return _results;
                })();
                if (augmenthash === null) {
                  view = templatecreatorFunc(nowDate, searches.elements, searches.scores, searchbys, savedingroups);
                  return successfulRequest(res, {
                    keyword: kword,
                    message: view
                  });
                } else {
                  return redis_client.hmget("saved" + augmenthash.titlefield, searches.elements, function(err2, titles) {
                    return redis_client.hmget("saved" + augmenthash.namefield, searches.elements, function(err3, names) {
                      view = templatecreatorFunc(nowDate, searches.elements, searches.scores, names, titles, searchbys, savedingroups);
                      return successfulRequest(res, {
                        keyword: kword,
                        message: view
                      });
                    });
                  });
                }
              });
            });
          }
        });
      } else {
        console.log("*** getSaved" + searchtype + "ForGroup2: membership failed for email=" + email + " err=" + errm);
        return failedRequest(res, {
          keyword: kword
        });
      }
    });
  };
  getSavedSearchesForGroup2 = function(req, res, next) {
    var doIt, kword;
    kword = 'savedsearchesforgroup';
    doIt = function(loginid) {
      var wantedGroup;
      wantedGroup = req.query.wantedgroup;
      return redis_client.get("email:" + loginid, function(err, email) {
        return _doSearchForGroup(email, wantedGroup, 'search', createSavedSearchTemplates, res, kword);
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
                view = createSavedPubTemplates(nowDate, pubkeys, pubtimes, bibcodes, pubtitles, (function() {
                  var _i, _len, _ref, _results;
                  _ref = savedpubs.elements;
                  _results = [];
                  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    ele = _ref[_i];
                    _results.push(email);
                  }
                  return _results;
                })(), (function() {
                  var _i, _len, _ref, _results;
                  _ref = savedpubs.elements;
                  _results = [];
                  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    ele = _ref[_i];
                    _results.push(['default']);
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
        return _doSearchForGroup(email, wantedGroup, 'pub', createSavedPubTemplates, res, kword, {
          titlefield: 'titles',
          namefield: 'bibcodes'
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
                view = createSavedObsvTemplates(nowDate, obsvkeys, obsvtimes, targets, obsvtitles, (function() {
                  var _i, _len, _ref, _results;
                  _ref = savedobsvs.elements;
                  _results = [];
                  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    ele = _ref[_i];
                    _results.push(email);
                  }
                  return _results;
                })(), (function() {
                  var _i, _len, _ref, _results;
                  _ref = savedobsvs.elements;
                  _results = [];
                  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    ele = _ref[_i];
                    _results.push(['default']);
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
        return _doSearchForGroup(email, wantedGroup, 'obsv', createSavedObsvTemplates, res, kword, {
          titlefield: 'obsvtitles',
          namefield: 'targets'
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
  _doRemoveSearchesFromGroup = function(email, group, searchtype, searchids, res) {
    var hashkeystodelete, key4savedbyhash, keyemail, keyemailgroup, keygroup, margs, sid;
    keyemail = "saved" + searchtype + ":" + email;
    keygroup = "saved" + searchtype + ":" + group;
    keyemailgroup = "saved" + searchtype + ":" + email + ":" + group;
    key4savedbyhash = "savedby:" + group;
    margs = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = searchids.length; _i < _len; _i++) {
        sid = searchids[_i];
        _results.push(['zrank', keyemailgroup, sid]);
      }
      return _results;
    })();
    hashkeystodelete = [];
    return redis_client.multi(margs).exec(function(err, replies) {
      var idx, margs2, margsemailgroup, margsgroup, mysidstodelete, rank, ranks, rid, sididx, sididxs;
      ranks = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = replies.length; _i < _len; _i++) {
          rank = replies[_i];
          if (rank !== 'nil') {
            _results.push(rank);
          }
        }
        return _results;
      })();
      sididxs = (function() {
        var _ref, _results;
        _results = [];
        for (sididx = 0, _ref = replies.length; 0 <= _ref ? sididx < _ref : sididx > _ref; 0 <= _ref ? sididx++ : sididx--) {
          if (replies[sididx] !== 'nil') {
            _results.push(sididx);
          }
        }
        return _results;
      })();
      mysidstodelete = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = sididxs.length; _i < _len; _i++) {
          idx = sididxs[_i];
          _results.push(searchids[idx]);
        }
        return _results;
      })();
      margsgroup = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = ranks.length; _i < _len; _i++) {
          rid = ranks[_i];
          _results.push(['zremrangebyrank', keygroup, rid, rid]);
        }
        return _results;
      })();
      margsemailgroup = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = ranks.length; _i < _len; _i++) {
          rid = ranks[_i];
          _results.push(['zremrangebyrank', keyemailgroup, rid, rid]);
        }
        return _results;
      })();
      margs2 = margsgroup.concat(margsemailgroup);
      return redis_client.multi(margs2).exec(function(err2, reply) {
        var ele;
        console.log("Removed " + ranks.length + " " + searchtype + "s from group " + group);
        hashkeystodelete = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = mysidstodelete.length; _i < _len; _i++) {
            ele = mysidstodelete[_i];
            _results.push(['hdel', keys4savedbyhash, ele]);
          }
          return _results;
        })();
        return redis_client.multi(hashkeystodelete).exec(function(err3, reply) {
          console.log("Hash has been cleaned for " + searchtype);
          return successfulRequest(res);
        });
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
      return _doRemoveSearchesFromGroup(email, group, 'search', searchids, res);
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
      console.log(">> removePubsFromGroup docids=" + docids);
      return _doRemoveSearchesFromGroup(email, group, 'pub', docids, res);
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
      return _doRemoveSearchesFromGroup(email, group, 'obsv', docids, res);
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
  exports.saveSearchesToGroup = saveSearchesToGroup;
  exports.savePubsToGroup = savePubsToGroup;
  exports.saveObsvsToGroup = saveObsvsToGroup;
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
