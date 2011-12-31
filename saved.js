(function() {
  /*
  Handles saved items - e.g. searches and publications - that involves
  accessing information from Redis.
  */
  var createSavedObsvTemplates, createSavedPubTemplates, createSavedSearchTemplates, deleteItem, deleteItems, deleteItemsWithJSON, failedRequest, getSavedObsvs, getSavedObsvs2, getSavedObsvs22, getSavedObsvsForGroup2, getSavedPubs, getSavedPubs2, getSavedPubs22, getSavedPubsForGroup2, getSavedSearches, getSavedSearches2, getSavedSearches22, getSavedSearchesForGroup2, getSortedElements, getSortedElementsAndScores, httpcallbackmaker, ifHaveEmail, ifLoggedIn, isArray, redis_client, removeObsvs, removeObsvsFromGroup, removePubs, removePubsFromGroup, removeSearches, removeSearchesFromGroup, requests, saveObsv, saveObsvsToGroup, savePub, savePubsToGroup, saveSearch, saveSearchesToGroup, searchToText, successfulRequest, timeToText, _doRemoveSearchesFromGroup, _doSaveSearchToGroup, _doSearch, _doSearchForGroup;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  }, __slice = Array.prototype.slice;
  redis_client = require("redis").createClient();
  requests = require("./requests");
  failedRequest = requests.failedRequest;
  successfulRequest = requests.successfulRequest;
  ifLoggedIn = requests.ifLoggedIn;
  httpcallbackmaker = requests.httpcallbackmaker;
  ifHaveEmail = function(fname, req, res, cb, failopts) {
    var ecb;
    if (failopts == null) {
      failopts = {};
    }
    ecb = httpcallbackmaker(fname, req, res);
    return ifLoggedIn(req, res, function(loginid) {
      return redis_client.get("email:" + loginid, function(err, email) {
        if (err) {
          return ecb(err, email);
        }
        if (email) {
          return cb(email);
        } else {
          return ecb(err, email);
        }
      });
    });
  };
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
  _doSaveSearchToGroup = function(savedBy, fqGroupName, savedhashlist, searchtype, callback) {
    var allTagsGroupHash, allTagsHash, idx, saveTime, savedSearches, savedtype, taggedtype, tagsForGroup, tagsForUser;
    saveTime = new Date().getTime();
    savedtype = "saved" + searchtype;
    taggedtype = "tagged" + searchtype;
    allTagsHash = "tagged:" + savedBy + ":" + searchtype;
    allTagsGroupHash = "tagged:" + fqGroupName + ":" + searchtype;
    tagsForUser = "tags:" + savedBy;
    tagsForGroup = "tags:" + fqGroupName;
    savedSearches = (function() {
      var _ref, _results;
      _results = [];
      for (idx = 0, _ref = savedhashlist.length; 0 <= _ref ? idx < _ref : idx > _ref; 0 <= _ref ? idx++ : idx--) {
        _results.push(savedhashlist[idx][savedtype]);
      }
      return _results;
    })();
    return redis_client.sismember("members:" + fqGroupName, savedBy, function(err, is_member) {
      var margs, savedhash;
      if (err) {
        return callback(err, is_member);
      }
      if (is_member) {
        margs = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = savedhashlist.length; _i < _len; _i++) {
            savedhash = savedhashlist[_i];
            _results.push(['hget', "savedby:" + fqGroupName, savedhash[savedtype]]);
          }
          return _results;
        })();
        return redis_client.multi(margs).exec(function(err2, replies) {
          var counter, idx, margsi, savedByJSON, savedSearch, _ref;
          if (err2) {
            return callback(err2, replies);
          }
          console.log('REPLIES', replies, savedhashlist);
          counter = 0;
          margs = [];
          for (idx = 0, _ref = replies.length; 0 <= _ref ? idx < _ref : idx > _ref; 0 <= _ref ? idx++ : idx--) {
            console.log("kkk", idx, replies[idx]);
            savedSearch = savedSearches[idx];
            if (replies[idx] !== null) {
              console.log("saved before", savedSearch, replies[idx]);
              savedByJSON = JSON.parse(replies[idx]);
              savedByJSON.push(savedBy);
            } else {
              console.log("first time saving", savedSearch, savedBy, fqGroupName);
              savedByJSON = [savedBy];
            }
            margsi = [['zadd', "saved" + searchtype + ":" + savedBy + ":" + fqGroupName, saveTime, savedSearch], ['zadd', "saved" + searchtype + ":" + fqGroupName, saveTime, savedSearch], ['hset', "savedby:" + fqGroupName, savedSearch, JSON.stringify(savedByJSON)]];
            margs = margs.concat(margsi);
          }
          return redis_client.smembers("memberof:" + savedBy, function(errb, mygroups) {
            var margs2, thesearch;
            if (errb) {
              return callback(errb, mygroups);
            }
            margs2 = (function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = savedSearches.length; _i < _len; _i++) {
                thesearch = savedSearches[_i];
                _results.push(['hget', "savedInGroups:" + searchtype, thesearch]);
              }
              return _results;
            })();
            console.log("margs2", margs2);
            return redis_client.multi(margs2).exec(function(err4, groupJSONList) {
              var groupJSON, grouplist, i, margs22, margs3, outJSON, outgroupsforuser, thesearch, _i, _len;
              console.log("groupJSONList", groupJSONList, err4);
              if (err4) {
                return callback(err4, groupJSONList);
              }
              outJSON = [];
              outgroupsforuser = [];
              for (_i = 0, _len = groupJSONList.length; _i < _len; _i++) {
                groupJSON = groupJSONList[_i];
                if (groupJSON === null) {
                  grouplist = [fqGroupName];
                } else {
                  grouplist = JSON.parse(groupJSON);
                  grouplist.push(fqGroupName);
                }
                outJSON.push(JSON.stringify(grouplist));
              }
              console.log("outjsom", outJSON, outgroupsforuser, savedSearches);
              margs3 = (function() {
                var _ref2, _results;
                _results = [];
                for (i = 0, _ref2 = savedSearches.length; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
                  _results.push(['hset', "savedInGroups:" + searchtype, savedSearches[i], outJSON[i]]);
                }
                return _results;
              })();
              console.log("margs3", margs3);
              margs = margs.concat(margs3);
              margs22 = (function() {
                var _j, _len2, _results;
                _results = [];
                for (_j = 0, _len2 = savedSearches.length; _j < _len2; _j++) {
                  thesearch = savedSearches[_j];
                  _results.push(['hget', allTagsHash, thesearch]);
                }
                return _results;
              })();
              console.log("margs22", margs22);
              return redis_client.multi(margs22).exec(function(err22, tagJSONList) {
                var margs33, thesearch;
                console.log("tagJSONList", tagJSONList, err22);
                if (err22) {
                  return callback(err22, tagJSONList);
                }
                margs33 = (function() {
                  var _j, _len2, _results;
                  _results = [];
                  for (_j = 0, _len2 = savedSearches.length; _j < _len2; _j++) {
                    thesearch = savedSearches[_j];
                    _results.push(['hget', "tagged:" + fqGroupName + ":" + searchtype, thesearch]);
                  }
                  return _results;
                })();
                return redis_client.multi(margs33).exec(function(err33, tagGroupJSONList) {
                  var ele, grptadd1, grtptadd2, grtptadd3, idx, margstagcmds, mergedJSON, mergedtaglist, searchgrouplist, taggrouplist, taglist, _ref2, _ref3;
                  console.log("tagGroupJSONList", tagGroupJSONList, err33);
                  if (err33) {
                    return callback(err33, tagGroupJSONList);
                  }
                  searchgrouplist = [];
                  for (idx = 0, _ref2 = savedSearches.length; 0 <= _ref2 ? idx < _ref2 : idx > _ref2; 0 <= _ref2 ? idx++ : idx--) {
                    if (tagGroupJSONList[idx] === null) {
                      taglist = [];
                    } else {
                      taglist = JSON.parse(tagGroupJSONList[idx]);
                    }
                    searchgrouplist.push(taglist);
                  }
                  margstagcmds = [];
                  for (idx = 0, _ref3 = savedSearches.length; 0 <= _ref3 ? idx < _ref3 : idx > _ref3; 0 <= _ref3 ? idx++ : idx--) {
                    if (tagJSONList[idx]) {
                      taglist = JSON.parse(tagJSONList[idx]);
                      taggrouplist = searchgrouplist[idx];
                      mergedtaglist = taggrouplist.concat(taglist);
                      mergedJSON = JSON.stringify(mergedtaglist);
                      grptadd1 = (function() {
                        var _j, _len2, _results;
                        _results = [];
                        for (_j = 0, _len2 = taglist.length; _j < _len2; _j++) {
                          ele = taglist[_j];
                          _results.push(['sadd', "tags:" + fqGroupName, ele]);
                        }
                        return _results;
                      })();
                      grtptadd2 = (function() {
                        var _j, _len2, _results;
                        _results = [];
                        for (_j = 0, _len2 = taglist.length; _j < _len2; _j++) {
                          ele = taglist[_j];
                          _results.push(['sadd', "" + taggedtype + ":" + fqGroupName + ":" + ele, savedSearches[idx]]);
                        }
                        return _results;
                      })();
                      grtptadd3 = [['hset', "tagged:" + fqGroupName + ":" + searchtype, savedSearches[idx], mergedJSON]];
                      margstagcmds = margstagcmds.concat(grptadd1);
                      margstagcmds = margstagcmds.concat(grptadd2);
                      margstagcmds = margstagcmds.concat(grptadd3);
                    }
                  }
                  margs = margs.concat(margstagcmds);
                  return redis_client.multi(margs).exec(callback);
                });
              });
            });
          });
        });
      } else {
        return callback(err, is_member);
      }
    });
  };
  saveSearchesToGroup = function(_arg, req, res, next) {
    var fqGroupName, objectsToSave, __fname;
    fqGroupName = _arg.fqGroupName, objectsToSave = _arg.objectsToSave;
    console.log(__fname = "saveSearchestoGroup");
    return ifHaveEmail(__fname, req, res, function(savedBy) {
      return _doSaveSearchToGroup(savedBy, fqGroupName, objectsToSave, 'search', httpcallbackmaker(__fname, req, res, next));
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
  savePubsToGroup = function(_arg, req, res, next) {
    var fqGroupName, objectsToSave, __fname;
    fqGroupName = _arg.fqGroupName, objectsToSave = _arg.objectsToSave;
    console.log(__fname = "savePubsToGroup");
    return ifHaveEmail(__fname, req, res, function(savedBy) {
      return _doSaveSearchToGroup(savedBy, fqGroupName, objectsToSave, 'pub', httpcallbackmaker(__fname, req, res, next));
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
  saveObsvsToGroup = function(_arg, req, res, next) {
    var fqGroupName, objectsToSave, __fname;
    fqGroupName = _arg.fqGroupName, objectsToSave = _arg.objectsToSave;
    console.log(__fname = "saveObsvToGroup");
    return ifHaveEmail(__fname, req, res, function(savedBy) {
      return _doSaveSearchToGroup(savedBy, fqGroupName, objectsToSave, 'obsv', httpcallbackmaker(__fname, req, res, next));
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
  createSavedSearchTemplates = function(nowDate, searchkeys, searchtimes, searchbys, groupsin, tagsin) {
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
          searchby: searchbys[ctr],
          groupsin: groupsin[ctr],
          tagsin: tagsin[ctr],
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
  createSavedPubTemplates = function(nowDate, pubkeys, pubtimes, bibcodes, pubtitles, searchbys, groupsin, tagsin) {
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
          tagsin: tagsin[ctr],
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
  createSavedObsvTemplates = function(nowDate, obsvkeys, obsvtimes, targets, obsvtitles, searchbys, groupsin, tagsin) {
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
          tagsin: tagsin[ctr],
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
  getSavedSearches22 = function(req, res, next) {
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
  _doSearch = function(email, searchtype, templateCreatorFunc, res, kword, callback, augmenthash) {
    var allTagsHash, nowDate;
    if (augmenthash == null) {
      augmenthash = null;
    }
    nowDate = new Date().getTime();
    allTagsHash = "tagged:" + email + ":" + searchtype;
    return redis_client.smembers("memberof:" + email, function(err, groups) {
      if (err) {
        return callback(err, groups);
      }
      return getSortedElementsAndScores(false, "saved" + searchtype + ":" + email, function(err2, searches) {
        var ele, margs2;
        if (err2) {
          return callback(err2, searches);
        }
        margs2 = (function() {
          var _i, _len, _ref, _results;
          _ref = searches.elements;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            ele = _ref[_i];
            _results.push(['hget', "savedInGroups:" + searchtype, ele]);
          }
          return _results;
        })();
        console.log("margs2<<<<<", margs2);
        return redis_client.multi(margs2).exec(function(errg, groupjsonlist) {
          var ele, groupstoadd, margs22, parsedgroups, savedingroups, _i, _len;
          if (errg) {
            return callback(errg, groupjsonlist);
          }
          savedingroups = [];
          for (_i = 0, _len = groupjsonlist.length; _i < _len; _i++) {
            ele = groupjsonlist[_i];
            if (!ele) {
              savedingroups.push([]);
            } else {
              parsedgroups = JSON.parse(ele);
              groupstoadd = (function() {
                var _j, _len2, _results;
                _results = [];
                for (_j = 0, _len2 = parsedgroups.length; _j < _len2; _j++) {
                  ele = parsedgroups[_j];
                  if (__indexOf.call(groups, ele) >= 0) {
                    _results.push(ele);
                  }
                }
                return _results;
              })();
              savedingroups.push(groupstoadd);
            }
          }
          margs22 = (function() {
            var _j, _len2, _ref, _results;
            _ref = searches.elements;
            _results = [];
            for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
              ele = _ref[_j];
              _results.push(['hget', allTagsHash, ele]);
            }
            return _results;
          })();
          console.log("margs22<<<<<", margs22);
          return redis_client.multi(margs22).exec(function(errg22, tagjsonlist) {
            var ele, names, parsedtags, savedBys, savedintags, tagstoadd, titles, view, _j, _len2;
            if (errg22) {
              return callback(errg22, tagjsonlist);
            }
            savedintags = [];
            for (_j = 0, _len2 = tagjsonlist.length; _j < _len2; _j++) {
              ele = tagjsonlist[_j];
              if (!ele) {
                savedintags.push([]);
              } else {
                parsedtags = JSON.parse(ele);
                tagstoadd = (function() {
                  var _k, _len3, _results;
                  _results = [];
                  for (_k = 0, _len3 = parsedtags.length; _k < _len3; _k++) {
                    ele = parsedtags[_k];
                    _results.push(ele);
                  }
                  return _results;
                })();
                savedintags.push(tagstoadd);
              }
            }
            console.log("<<<<<<<<<<<<<<<<>", savedingroups, savedintags);
            savedBys = (function() {
              var _k, _len3, _ref, _results;
              _ref = searches.elements;
              _results = [];
              for (_k = 0, _len3 = _ref.length; _k < _len3; _k++) {
                ele = _ref[_k];
                _results.push(email);
              }
              return _results;
            })();
            if (augmenthash === null) {
              view = templateCreatorFunc(nowDate, searches.elements, searches.scores, savedBys, savedingroups, savedintags);
              return callback(err, view);
            } else {
              if (searches.elements.length === 0) {
                titles = [];
                names = [];
                view = templateCreatorFunc(nowDate, searches.elements, searches.scores, names, titles, savedBys, savedingroups, savedintags);
                return callback(err, view);
              }
              return redis_client.hmget.apply(redis_client, ["saved" + augmenthash.titlefield].concat(__slice.call(searches.elements), [function(err3, titles) {
                if (err3) {
                  console.log("titlefield error");
                  return callback(err3, titles);
                }
                return redis_client.hmget.apply(redis_client, ["saved" + augmenthash.namefield].concat(__slice.call(searches.elements), [function(err4, names) {
                  if (err4) {
                    console.log("namefield error");
                    return callback(err4, names);
                  }
                  view = templateCreatorFunc(nowDate, searches.elements, searches.scores, names, titles, savedBys, savedingroups, savedintags);
                  return callback(err4, view);
                }]));
              }]));
            }
          });
        });
      });
    });
  };
  getSavedPubs2 = function(req, res, next) {
    var kword, __fname;
    kword = 'savedpubs';
    __fname = kword;
    return ifHaveEmail(__fname, req, res, function(email) {
      return _doSearch(email, 'pub', createSavedPubTemplates, res, kword, httpcallbackmaker(__fname, req, res, next), {
        titlefield: 'titles',
        namefield: 'bibcodes'
      });
    });
  };
  getSavedSearches2 = function(req, res, next) {
    var kword, __fname;
    kword = 'savedsearches';
    __fname = kword;
    return ifHaveEmail(__fname, req, res, function(email) {
      return _doSearch(email, 'search', createSavedSearchTemplates, res, kword, httpcallbackmaker(__fname, req, res, next));
    });
  };
  getSavedObsvs2 = function(req, res, next) {
    var kword, __fname;
    kword = 'savedobsvs';
    __fname = kword;
    return ifHaveEmail(__fname, req, res, function(email) {
      return _doSearch(email, 'obsv', createSavedObsvTemplates, res, kword, httpcallbackmaker(__fname, req, res, next), {
        titlefield: 'obsvtitles',
        namefield: 'targets'
      });
    });
  };
  _doSearchForGroup = function(email, fqGroupName, searchtype, templateCreatorFunc, res, kword, callback, augmenthash) {
    var allTagsGroupHash, nowDate;
    if (augmenthash == null) {
      augmenthash = null;
    }
    nowDate = new Date().getTime();
    allTagsGroupHash = "tagged:" + fqGroupName + ":" + searchtype;
    return redis_client.sismember("members:" + fqGroupName, email, function(erra, saved_p) {
      if (erra) {
        return callback(erra, saved_p);
      }
      if (saved_p) {
        return redis_client.smembers("memberof:" + email, function(errb, groups) {
          if (errb) {
            return callback(errb, groups);
          }
          return getSortedElementsAndScores(false, "saved" + searchtype + ":" + fqGroupName, function(err2, searches) {
            var ele, margs;
            if (err2) {
              console.log("*** getSaved" + searchtype + "ForGroup2: failed for email=" + email + " err=" + err2);
              return callback(err2, searches);
            }
            console.log(searchtype, 'searches.elements', searches.elements);
            margs = (function() {
              var _i, _len, _ref, _results;
              _ref = searches.elements;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                ele = _ref[_i];
                _results.push(['hget', "savedby:" + fqGroupName, ele]);
              }
              return _results;
            })();
            return redis_client.multi(margs).exec(function(errm, savedbysjsonlist) {
              var ele, margs2, parsedsavedbys, savedBys, savedbystoadd, _i, _len;
              if (errm) {
                return callback(errm, savedBys);
              }
              savedBys = [];
              for (_i = 0, _len = savedbysjsonlist.length; _i < _len; _i++) {
                ele = savedbysjsonlist[_i];
                console.log("ELE", ele);
                if (!ele) {
                  savedBys.push([]);
                } else {
                  parsedsavedbys = JSON.parse(ele);
                  savedbystoadd = (function() {
                    var _j, _len2, _results;
                    _results = [];
                    for (_j = 0, _len2 = parsedsavedbys.length; _j < _len2; _j++) {
                      ele = parsedsavedbys[_j];
                      _results.push(ele);
                    }
                    return _results;
                  })();
                  savedBys.push(savedbystoadd);
                }
              }
              margs2 = (function() {
                var _j, _len2, _ref, _results;
                _ref = searches.elements;
                _results = [];
                for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
                  ele = _ref[_j];
                  _results.push(['hget', "savedInGroups:" + searchtype, ele]);
                }
                return _results;
              })();
              console.log("<<<<<" + searchtype, margs2);
              return redis_client.multi(margs2).exec(function(err, groupjsonlist) {
                var ele, groupstoadd, margs22, parsedgroups, savedingroups, _j, _len2;
                if (err) {
                  return callback(err, groupjsonlist);
                }
                console.log(">>>>>>>" + searchtype, searches.elements, groupjsonlist);
                savedingroups = [];
                for (_j = 0, _len2 = groupjsonlist.length; _j < _len2; _j++) {
                  ele = groupjsonlist[_j];
                  if (!ele) {
                    savedingroups.push([]);
                  } else {
                    parsedgroups = JSON.parse(ele);
                    groupstoadd = (function() {
                      var _k, _len3, _results;
                      _results = [];
                      for (_k = 0, _len3 = parsedgroups.length; _k < _len3; _k++) {
                        ele = parsedgroups[_k];
                        if (__indexOf.call(groups, ele) >= 0) {
                          _results.push(ele);
                        }
                      }
                      return _results;
                    })();
                    savedingroups.push(groupstoadd);
                  }
                }
                margs22 = (function() {
                  var _k, _len3, _ref, _results;
                  _ref = searches.elements;
                  _results = [];
                  for (_k = 0, _len3 = _ref.length; _k < _len3; _k++) {
                    ele = _ref[_k];
                    _results.push(['hget', allTagsGroupHash, ele]);
                  }
                  return _results;
                })();
                console.log("<<<<<", margs22);
                return redis_client.multi(margs22).exec(function(errg22, tagjsonlist) {
                  var ele, names, parsedtags, savedintags, tagstoadd, titles, view, _k, _len3;
                  if (errg22) {
                    return callback(errg22, tagjsonlist);
                  }
                  savedintags = [];
                  for (_k = 0, _len3 = tagjsonlist.length; _k < _len3; _k++) {
                    ele = tagjsonlist[_k];
                    if (!ele) {
                      savedintags.push([]);
                    } else {
                      parsedtags = JSON.parse(ele);
                      tagstoadd = (function() {
                        var _l, _len4, _results;
                        _results = [];
                        for (_l = 0, _len4 = parsedtags.length; _l < _len4; _l++) {
                          ele = parsedtags[_l];
                          _results.push(ele);
                        }
                        return _results;
                      })();
                      savedintags.push(tagstoadd);
                    }
                  }
                  console.log("<<<<<<<<<<<<<<<<>", savedingroups);
                  if (augmenthash === null) {
                    view = templateCreatorFunc(nowDate, searches.elements, searches.scores, savedBys, savedingroups, savedintags);
                    return callback(err, view);
                  } else {
                    if (searches.elements.length === 0) {
                      titles = [];
                      names = [];
                      view = templateCreatorFunc(nowDate, searches.elements, searches.scores, names, titles, savedBys, savedingroups, savedintags);
                      return callback(err, view);
                    }
                    return redis_client.hmget.apply(redis_client, ["saved" + augmenthash.titlefield].concat(__slice.call(searches.elements), [function(err3, titles) {
                      if (err3) {
                        console.log("titlefield error");
                        return callback(err3, titles);
                      }
                      return redis_client.hmget.apply(redis_client, ["saved" + augmenthash.namefield].concat(__slice.call(searches.elements), [function(err4, names) {
                        if (err4) {
                          console.log("namefield error");
                          return callback(err4, names);
                        }
                        view = templateCreatorFunc(nowDate, searches.elements, searches.scores, names, titles, savedBys, savedingroups, savedintags);
                        return callback(err4, view);
                      }]));
                    }]));
                  }
                });
              });
            });
          });
        });
      } else {
        console.log("*** getSaved" + searchtype + "ForGroup2: membership failed for email=" + email + " err=" + erra);
        return callback(erra, saved_p);
      }
    });
  };
  getSavedSearchesForGroup2 = function(req, res, next) {
    var fqGroupName, kword, __fname;
    kword = 'savedsearchesforgroup';
    __fname = kword;
    fqGroupName = req.query.fqGroupName;
    return ifHaveEmail(__fname, req, res, function(email) {
      return _doSearchForGroup(email, fqGroupName, 'search', createSavedSearchTemplates, res, kword, httpcallbackmaker(__fname, req, res, next));
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
  getSavedPubs22 = function(req, res, next) {
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
    var fqGroupName, kword, __fname;
    kword = 'savedpubsforgroup';
    __fname = kword;
    fqGroupName = req.query.fqGroupName;
    return ifHaveEmail(__fname, req, res, function(email) {
      return _doSearchForGroup(email, fqGroupName, 'pub', createSavedPubTemplates, res, kword, httpcallbackmaker(__fname, req, res, next), {
        titlefield: 'titles',
        namefield: 'bibcodes'
      });
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
  getSavedObsvs22 = function(req, res, next) {
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
    var fqGroupName, kword, __fname;
    kword = 'savedobsvsforgroup';
    fqGroupName = req.query.fqGroupName;
    __fname = kword;
    return ifHaveEmail(__fname, req, res, function(email) {
      return _doSearchForGroup(email, fqGroupName, 'obsv', createSavedObsvTemplates, res, kword, httpcallbackmaker(__fname, req, res, next), {
        titlefield: 'obsvtitles',
        namefield: 'targets'
      });
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
  _doRemoveSearchesFromGroup = function(email, group, searchtype, searchids, callback) {
    var hashkeystodelete, keyemail, keyemailgroup, keygroup, keys4savedbyhash, margs, savedingroupshash, sid;
    keyemail = "saved" + searchtype + ":" + email;
    keygroup = "saved" + searchtype + ":" + group;
    keyemailgroup = "saved" + searchtype + ":" + email + ":" + group;
    keys4savedbyhash = "savedby:" + group;
    savedingroupshash = "savedInGroups:" + searchtype;
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
      var idx, margs2, mysidstodelete, rank, ranks, sididx, sididxs;
      if (err) {
        return callback(err, replies);
      }
      ranks = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = replies.length; _i < _len; _i++) {
          rank = replies[_i];
          if (rank !== null) {
            _results.push(rank);
          }
        }
        return _results;
      })();
      sididxs = (function() {
        var _ref, _results;
        _results = [];
        for (sididx = 0, _ref = replies.length; 0 <= _ref ? sididx < _ref : sididx > _ref; 0 <= _ref ? sididx++ : sididx--) {
          if (replies[sididx] !== null) {
            _results.push(sididx);
          }
        }
        return _results;
      })();
      console.log("sididxs", sididxs);
      mysidstodelete = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = sididxs.length; _i < _len; _i++) {
          idx = sididxs[_i];
          _results.push(searchids[idx]);
        }
        return _results;
      })();
      margs2 = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = sididxs.length; _i < _len; _i++) {
          idx = sididxs[_i];
          _results.push(['hget', savedingroupshash, searchids[idx]]);
        }
        return _results;
      })();
      return redis_client.multi(margs2).exec(function(errj, groupjsonlist) {
        var ele, glist, grouplist, i, idx, margs22, newgroupjsonlist, newgrouplist, newsavedgroups, savedingroups, savedingroupshashcmds, _i, _j, _len, _len2;
        if (errj) {
          return callback(errj, groupjsonlist);
        }
        console.log("o>>>>>>>", searchids, groupjsonlist);
        savedingroups = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = groupjsonlist.length; _i < _len; _i++) {
            ele = groupjsonlist[_i];
            _results.push(JSON.parse(ele));
          }
          return _results;
        })();
        console.log("savedingroups", savedingroups);
        newsavedgroups = [];
        for (_i = 0, _len = savedingroups.length; _i < _len; _i++) {
          grouplist = savedingroups[_i];
          console.log('grouplist', grouplist);
          newgrouplist = [];
          for (_j = 0, _len2 = grouplist.length; _j < _len2; _j++) {
            ele = grouplist[_j];
            if (ele !== group) {
              newgrouplist.push(ele);
            }
          }
          console.log('newgrouplist', newgrouplist);
          newsavedgroups.push(newgrouplist);
        }
        newgroupjsonlist = (function() {
          var _k, _len3, _results;
          _results = [];
          for (_k = 0, _len3 = newsavedgroups.length; _k < _len3; _k++) {
            glist = newsavedgroups[_k];
            _results.push(JSON.stringify(glist));
          }
          return _results;
        })();
        savedingroupshashcmds = (function() {
          var _k, _len3, _results;
          _results = [];
          for (_k = 0, _len3 = sididxs.length; _k < _len3; _k++) {
            i = sididxs[_k];
            _results.push(['hset', savedingroupshash, searchids[i], newgroupjsonlist[i]]);
          }
          return _results;
        })();
        console.log("savedingroupshashcmds", savedingroupshashcmds);
        margs22 = (function() {
          var _k, _len3, _results;
          _results = [];
          for (_k = 0, _len3 = sididxs.length; _k < _len3; _k++) {
            idx = sididxs[_k];
            _results.push(['hget', keys4savedbyhash, searchids[idx]]);
          }
          return _results;
        })();
        return redis_client.multi(margs22).exec(function(errj2, userjsonlist) {
          var ele, i, margs3, margs4, margsemailgroup, margsgroup, margsi, newsavedbyusers, newuserjsonlist, newuserlist, rid, savedbyusers, savedbyusershashcmds, ulist, userlist, _k, _l, _len3, _len4;
          if (errj2) {
            return callback(errj2, userjsonlist);
          }
          console.log("oo>>>>>>>", searchids, userjsonlist);
          savedbyusers = (function() {
            var _k, _len3, _results;
            _results = [];
            for (_k = 0, _len3 = userjsonlist.length; _k < _len3; _k++) {
              ele = userjsonlist[_k];
              _results.push(JSON.parse(ele));
            }
            return _results;
          })();
          console.log("savedbyusers", savedbyusers);
          newsavedbyusers = [];
          for (_k = 0, _len3 = savedbyusers.length; _k < _len3; _k++) {
            userlist = savedbyusers[_k];
            console.log('userlist', userlist);
            newuserlist = [];
            for (_l = 0, _len4 = userlist.length; _l < _len4; _l++) {
              ele = userlist[_l];
              if (ele !== email) {
                newuserlist.push(ele);
              }
            }
            console.log('newuserlist', newuserlist);
            newsavedbyusers.push(newuserlist);
          }
          newuserjsonlist = (function() {
            var _len5, _m, _results;
            _results = [];
            for (_m = 0, _len5 = newsavedbyusers.length; _m < _len5; _m++) {
              ulist = newsavedbyusers[_m];
              _results.push(JSON.stringify(ulist));
            }
            return _results;
          })();
          savedbyusershashcmds = (function() {
            var _len5, _m, _results;
            _results = [];
            for (_m = 0, _len5 = sididxs.length; _m < _len5; _m++) {
              i = sididxs[_m];
              _results.push(['hset', keys4savedbyhash, searchids[i], newuserjsonlist[i]]);
            }
            return _results;
          })();
          console.log("savedbyusershashcmds", savedbyusershashcmds);
          margsgroup = (function() {
            var _len5, _m, _results;
            _results = [];
            for (_m = 0, _len5 = ranks.length; _m < _len5; _m++) {
              rid = ranks[_m];
              _results.push(['zremrangebyrank', keygroup, rid, rid]);
            }
            return _results;
          })();
          margsemailgroup = (function() {
            var _len5, _m, _results;
            _results = [];
            for (_m = 0, _len5 = ranks.length; _m < _len5; _m++) {
              rid = ranks[_m];
              _results.push(['zremrangebyrank', keyemailgroup, rid, rid]);
            }
            return _results;
          })();
          margsi = margsgroup.concat(margsemailgroup);
          margs3 = margsi.concat(savedingroupshashcmds);
          margs4 = margs3.concat(savedbyusershashcmds);
          console.log('margs4', margs4);
          return redis_client.multi(margs4).exec(callback);
        });
      });
    });
  };
  removeSearchesFromGroup = function(email, group, searchids, callback) {
    return _doRemoveSearchesFromGroup(email, group, 'search', searchids, callback);
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
  removePubsFromGroup = function(email, group, docids, callback) {
    return _doRemoveSearchesFromGroup(email, group, 'pub', docids, callback);
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
  removeObsvsFromGroup = function(email, group, obsids, callback) {
    return _doRemoveSearchesFromGroup(email, group, 'obsv', obsids, callback);
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
  deleteItemsWithJSON = function(funcname, idname, delItems) {
    return function(terms, req, res, next) {
      console.log(">> In " + funcname);
      return ifHaveEmail(funcname, req, res, function(email) {
        var action, delids, group, _ref;
        action = terms.action;
        group = (_ref = terms.fqGroupName) != null ? _ref : 'default';
        delids = isArray(terms.items) ? terms.items : [terms.items];
        if (action === "delete" && delids.length > 0) {
          return delItems(email, group, delids, httpcallbackmaker(funcname, req, res, next));
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
  exports.deleteSearchesFromGroup = deleteItemsWithJSON("deleteSearchesFromGroup", "searches", removeSearchesFromGroup);
  exports.deletePubsFromGroup = deleteItemsWithJSON("deletePubsFromGroup", "pubs", removePubsFromGroup);
  exports.deleteObsvsFromGroup = deleteItemsWithJSON("deleteObsvsFromGroup", "obsvs", removeObsvsFromGroup);
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
