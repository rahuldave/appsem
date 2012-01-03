(function() {
  /*
  Handles saved items - e.g. searches and publications - that involves
  accessing information from Redis.
  */
  var createSavedObsvTemplates, createSavedPubTemplates, createSavedSearchTemplates, deleteItemsWithJSON, failedRequest, getSavedObsvsForTag, getSavedPubsForTag, getSavedSearchesForTag, getSortedElements, getSortedElementsAndScores, getTagsForGroup, getTagsForUser, httpcallbackmaker, ifHaveEmail, ifLoggedIn, isArray, redis_client, removeObsvsFromTag, removePubsFromTag, removeSearchesFromTag, requests, saveObsvsToTag, savePubsToTag, saveSearchesToTag, searchToText, successfulRequest, timeToText, _doRemoveSearchesFromTag, _doSaveSearchToTag, _doSearchForTag, _doSearchForTagInGroup;
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
  _doSaveSearchToTag = function(taggedBy, tagName, savedhashlist, searchtype, callback) {
    var allTagsHash, idx, margs2, saveTime, savedSearches, savedUserSet, savedtype, taggedAllSet, taggedUserSet, taggedtype, tagsForUser, thesearch, toBeTaggedSearchesToUse;
    saveTime = new Date().getTime();
    savedtype = "saved" + searchtype;
    taggedtype = "tagged" + searchtype;
    allTagsHash = "tagged:" + taggedBy + ":" + searchtype;
    tagsForUser = "tags:" + taggedBy;
    taggedAllSet = "" + taggedtype + ":" + tagName;
    taggedUserSet = "" + taggedtype + ":" + taggedBy + ":" + tagName;
    savedUserSet = "saved" + searchtype + ":" + taggedBy;
    savedSearches = (function() {
      var _ref, _results;
      _results = [];
      for (idx = 0, _ref = savedhashlist.length; 0 <= _ref ? idx < _ref : idx > _ref; 0 <= _ref ? idx++ : idx--) {
        _results.push(savedhashlist[idx][savedtype]);
      }
      return _results;
    })();
    toBeTaggedSearchesToUse = savedSearches;
    margs2 = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = toBeTaggedSearchesToUse.length; _i < _len; _i++) {
        thesearch = toBeTaggedSearchesToUse[_i];
        _results.push(['hget', allTagsHash, thesearch]);
      }
      return _results;
    })();
    console.log("margs2", margs2);
    return redis_client.multi(margs2).exec(function(err4, tagJSONList) {
      var outJSON, outList, tagJSON, taglist, _i, _len;
      console.log("tagJSONList", tagJSONList, err4);
      if (err4) {
        return callback(err4, tagJSONList);
      }
      outJSON = [];
      outList = [];
      for (_i = 0, _len = tagJSONList.length; _i < _len; _i++) {
        tagJSON = tagJSONList[_i];
        if (tagJSON === null) {
          taglist = [tagName];
        } else {
          taglist = JSON.parse(tagJSON);
          taglist.push(tagName);
        }
        outJSON.push(JSON.stringify(taglist));
        outList.push(taglist);
      }
      console.log("outjsom", outList, outJSON);
      return redis_client.smembers("memberof:" + taggedBy, function(errb, mygroups) {
        var dagrp, ele, margs11, mygroupslength, _j, _len2;
        if (errb) {
          return callback(errb, mygroups);
        }
        mygroupslength = mygroups.length;
        margs11 = [];
        for (_j = 0, _len2 = toBeTaggedSearchesToUse.length; _j < _len2; _j++) {
          ele = toBeTaggedSearchesToUse[_j];
          margs11 = margs11.concat((function() {
            var _k, _len3, _results;
            _results = [];
            for (_k = 0, _len3 = mygroups.length; _k < _len3; _k++) {
              dagrp = mygroups[_k];
              _results.push(['hget', "tagged:" + dagrp + ":" + searchtype, ele]);
            }
            return _results;
          })());
        }
        return redis_client.multi(margs11).exec(function(err11, grouptagJSONList) {
          var dagrp, ele, groupSearchList, i, idx, jdx, kdx, margs22, _k, _len3, _ref;
          console.log("tagJSONList", grouptagJSONList, err11);
          if (err4) {
            return callback(err11, grouptagJSONList);
          }
          groupSearchList = (function() {
            var _ref, _results;
            _results = [];
            for (i = 0, _ref = toBeTaggedSearchesToUse.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
              _results.push({});
            }
            return _results;
          })();
          for (idx = 0, _ref = toBeTaggedSearchesToUse.length; 0 <= _ref ? idx < _ref : idx > _ref; 0 <= _ref ? idx++ : idx--) {
            for (jdx = 0; 0 <= mygroupslength ? jdx < mygroupslength : jdx > mygroupslength; 0 <= mygroupslength ? jdx++ : jdx--) {
              kdx = idx * mygroupslength + jdx;
              if (grouptagJSONList[kdx] === null) {
                taglist = [];
              } else {
                taglist = JSON.parse(grouptagJSONList[kdx]);
              }
              groupSearchList[idx][mygroups[jdx]] = taglist;
            }
          }
          console.log("groupSearchList", groupSearchList);
          margs22 = [];
          for (_k = 0, _len3 = toBeTaggedSearchesToUse.length; _k < _len3; _k++) {
            ele = toBeTaggedSearchesToUse[_k];
            margs22 = margs22.concat((function() {
              var _l, _len4, _results;
              _results = [];
              for (_l = 0, _len4 = mygroups.length; _l < _len4; _l++) {
                dagrp = mygroups[_l];
                _results.push(['hget', "savedby:" + dagrp, ele]);
              }
              return _results;
            })());
          }
          console.log("<<<<<", margs22);
          return redis_client.multi(margs22).exec(function(err22, usergroupjsonlist) {
            var cmds, currentGroup, currentSearchAndGroupList, currentSearchAndUserList, hashcmds, i, idx, jdx, margs, margs3, margsgroupssetcmds, margsi, margsj, mergedJSON, mergedList, parsedusers, savedSearch, tagscmds, user, _ref2;
            if (err22) {
              return callback(err22, usergroupjsonlist);
            }
            console.log("usrgroupjsonlist", usergroupjsonlist, mygroupslength, groupSearchList, mygroups);
            margsgroupssetcmds = [];
            for (idx = 0, _ref2 = toBeTaggedSearchesToUse.length; 0 <= _ref2 ? idx < _ref2 : idx > _ref2; 0 <= _ref2 ? idx++ : idx--) {
              for (jdx = 0; 0 <= mygroupslength ? jdx < mygroupslength : jdx > mygroupslength; 0 <= mygroupslength ? jdx++ : jdx--) {
                kdx = idx * mygroupslength + jdx;
                currentGroup = mygroups[jdx];
                currentSearchAndGroupList = groupSearchList[idx][currentGroup];
                currentSearchAndUserList = outList[idx];
                if (usergroupjsonlist[kdx]) {
                  mergedList = currentSearchAndGroupList.concat(currentSearchAndUserList);
                  mergedJSON = JSON.stringify(mergedList);
                  parsedusers = JSON.parse(usergroupjsonlist[kdx]);
                  cmds = (function() {
                    var _l, _len4, _results;
                    _results = [];
                    for (_l = 0, _len4 = parsedusers.length; _l < _len4; _l++) {
                      user = parsedusers[_l];
                      if (user === taggedBy) {
                        _results.push(['sadd', "" + taggedtype + ":" + mygroups[jdx] + ":" + tagName, toBeTaggedSearchesToUse[idx]]);
                      }
                    }
                    return _results;
                  })();
                  tagscmds = (function() {
                    var _l, _len4, _results;
                    _results = [];
                    for (_l = 0, _len4 = parsedusers.length; _l < _len4; _l++) {
                      user = parsedusers[_l];
                      if (user === taggedBy) {
                        _results.push(['sadd', "tags:" + mygroups[jdx], tagName]);
                      }
                    }
                    return _results;
                  })();
                  hashcmds = (function() {
                    var _l, _len4, _results;
                    _results = [];
                    for (_l = 0, _len4 = parsedusers.length; _l < _len4; _l++) {
                      user = parsedusers[_l];
                      if (user === taggedBy) {
                        _results.push(['hset', "tagged:" + mygroups[jdx] + ":" + searchtype, toBeTaggedSearchesToUse[idx], mergedJSON]);
                      }
                    }
                    return _results;
                  })();
                  console.log("CMDS", cmds, tagscmds, hashcmds);
                  margsgroupssetcmds = margsgroupssetcmds.concat(cmds);
                  margsgroupssetcmds = margsgroupssetcmds.concat(tagscmds);
                  margsgroupssetcmds = margsgroupssetcmds.concat(hashcmds);
                }
              }
            }
            margs3 = (function() {
              var _ref3, _results;
              _results = [];
              for (i = 0, _ref3 = toBeTaggedSearchesToUse.length; 0 <= _ref3 ? i < _ref3 : i > _ref3; 0 <= _ref3 ? i++ : i--) {
                _results.push(['hset', allTagsHash, toBeTaggedSearchesToUse[i], outJSON[i]]);
              }
              return _results;
            })();
            console.log("margs3", margs3);
            margsi = (function() {
              var _l, _len4, _results;
              _results = [];
              for (_l = 0, _len4 = toBeTaggedSearchesToUse.length; _l < _len4; _l++) {
                savedSearch = toBeTaggedSearchesToUse[_l];
                _results.push(['sadd', taggedAllSet, savedSearch]);
              }
              return _results;
            })();
            margsj = (function() {
              var _l, _len4, _results;
              _results = [];
              for (_l = 0, _len4 = toBeTaggedSearchesToUse.length; _l < _len4; _l++) {
                savedSearch = toBeTaggedSearchesToUse[_l];
                _results.push(['sadd', taggedUserSet, savedSearch]);
              }
              return _results;
            })();
            margs = margs3.concat(margsi);
            margs = margs.concat(margsj);
            margs = margs.concat([['sadd', tagsForUser, tagName]]);
            margs = margs.concat(margsgroupssetcmds);
            return redis_client.multi(margs).exec(callback);
          });
        });
      });
    });
  };
  saveSearchesToTag = function(_arg, req, res, next) {
    var objectsToSave, tagName, __fname;
    tagName = _arg.tagName, objectsToSave = _arg.objectsToSave;
    console.log(__fname = "saveSearchestoTag");
    return ifHaveEmail(__fname, req, res, function(savedBy) {
      return _doSaveSearchToTag(savedBy, tagName, objectsToSave, 'search', httpcallbackmaker(__fname, req, res, next));
    });
  };
  savePubsToTag = function(_arg, req, res, next) {
    var objectsToSave, tagName, __fname;
    tagName = _arg.tagName, objectsToSave = _arg.objectsToSave;
    console.log(__fname = "savePubsToTag");
    return ifHaveEmail(__fname, req, res, function(savedBy) {
      return _doSaveSearchToTag(savedBy, tagName, objectsToSave, 'pub', httpcallbackmaker(__fname, req, res, next));
    });
  };
  saveObsvsToTag = function(_arg, req, res, next) {
    var objectsToSave, tagName, __fname;
    tagName = _arg.tagName, objectsToSave = _arg.objectsToSave;
    console.log(__fname = "saveObsvsToTag");
    return ifHaveEmail(__fname, req, res, function(savedBy) {
      return _doSaveSearchToTag(savedBy, tagName, objectsToSave, 'obsv', httpcallbackmaker(__fname, req, res, next));
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
  _doSearchForTag = function(email, tagName, searchtype, templateCreatorFunc, res, kword, callback, augmenthash) {
    var allTagsHash, nowDate, taggedAllSet, taggedUserSet, taggedtype;
    if (augmenthash == null) {
      augmenthash = null;
    }
    nowDate = new Date().getTime();
    taggedtype = "tagged" + searchtype;
    allTagsHash = "tagged:" + email + ":" + searchtype;
    taggedAllSet = "" + taggedtype + ":" + tagName;
    taggedUserSet = "" + taggedtype + ":" + email + ":" + tagName;
    return redis_client.smembers("memberof:" + email, function(err, groups) {
      if (err) {
        return callback(err, groups);
      }
      console.log("groups", groups);
      return redis_client.smembers(taggedUserSet, function(err2, searchreplies) {
        if (err2) {
          return callback(err2, searchreplies);
        }
        console.log("searchreplies", searchreplies);
        return getSortedElementsAndScores(false, "saved" + searchtype + ":" + email, function(err22, allsearches) {
          var ele, idx, margs2, searches, _ref, _ref2;
          if (err22) {
            return callback(err22, allsearches);
          }
          console.log("allsearches", allsearches, allsearches.elements.length);
          searches = {};
          searches.scores = [];
          searches.elements = [];
          for (idx = 0, _ref = allsearches.elements.length; 0 <= _ref ? idx < _ref : idx > _ref; 0 <= _ref ? idx++ : idx--) {
            console.log("BLARG", allsearches.elements[idx], searchreplies);
            if (_ref2 = allsearches.elements[idx], __indexOf.call(searchreplies, _ref2) >= 0) {
              searches.elements.push(allsearches.elements[idx]);
              searches.scores.push(allsearches.scores[idx]);
            }
          }
          console.log("s.e, s.s", searches.elements, searches.scores);
          margs2 = (function() {
            var _i, _len, _ref3, _results;
            _ref3 = searches.elements;
            _results = [];
            for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
              ele = _ref3[_i];
              _results.push(['hget', "savedInGroups:" + searchtype, ele]);
            }
            return _results;
          })();
          console.log("<<<<<", margs2);
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
              var _j, _len2, _ref3, _results;
              _ref3 = searches.elements;
              _results = [];
              for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
                ele = _ref3[_j];
                _results.push(['hget', allTagsHash, ele]);
              }
              return _results;
            })();
            console.log("<<<<<", margs22);
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
                var _k, _len3, _ref3, _results;
                _ref3 = searches.elements;
                _results = [];
                for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
                  ele = _ref3[_k];
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
    });
  };
  _doSearchForTagInGroup = function(email, tagName, fqGroupName, searchtype, templateCreatorFunc, res, kword, callback, augmenthash) {
    var allTagsGroupHash, allTagsHash, nowDate, taggedAllSet, taggedGroupSet, taggedUserSet, taggedtype;
    if (augmenthash == null) {
      augmenthash = null;
    }
    nowDate = new Date().getTime();
    taggedtype = "tagged" + searchtype;
    allTagsHash = "tagged:" + email + ":" + searchtype;
    allTagsGroupHash = "tagged:" + fqGroupName + ":" + searchtype;
    taggedAllSet = "" + taggedtype + ":" + tagName;
    taggedUserSet = "" + taggedtype + ":" + email + ":" + tagName;
    taggedGroupSet = "" + taggedtype + ":" + fqGroupName + ":" + tagName;
    return redis_client.sismember("members:" + fqGroupName, email, function(erra, saved_p) {
      if (erra) {
        return callback(erra, saved_p);
      }
      if (saved_p) {
        return redis_client.smembers("memberof:" + email, function(errb, groups) {
          if (errb) {
            return callback(errb, groups);
          }
          return redis_client.smembers("members:" + fqGroupName, function(errc, users) {
            if (errc) {
              return callback(errc, users);
            }
            return redis_client.smembers(taggedGroupSet, function(err2, searchreplies) {
              if (err2) {
                return callback(err2, searchreplies);
              }
              return getSortedElementsAndScores(false, "saved" + searchtype + ":" + fqGroupName, function(err22, allsearches) {
                var ele, idx, margs, searches, _ref, _ref2;
                if (err22) {
                  return callback(err22, allsearches);
                }
                searches = {};
                searches.scores = [];
                searches.elements = [];
                for (idx = 0, _ref = allsearches.elements.length; 0 <= _ref ? idx < _ref : idx > _ref; 0 <= _ref ? idx++ : idx--) {
                  if (_ref2 = allsearches.elements[idx], __indexOf.call(searchreplies, _ref2) >= 0) {
                    searches.elements.push(allsearches.elements[idx]);
                    searches.scores.push(allsearches.scores[idx]);
                  }
                }
                console.log(searchtype, 'searches.elements', searches.elements);
                margs = (function() {
                  var _i, _len, _ref3, _results;
                  _ref3 = searches.elements;
                  _results = [];
                  for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
                    ele = _ref3[_i];
                    _results.push(['hget', "savedby:" + fqGroupName, ele]);
                  }
                  return _results;
                })();
                return redis_client.multi(margs).exec(function(errm, savedBys) {
                  var ele, margs2;
                  if (errm) {
                    return callback(errm, savedBys);
                  }
                  margs2 = (function() {
                    var _i, _len, _ref3, _results;
                    _ref3 = searches.elements;
                    _results = [];
                    for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
                      ele = _ref3[_i];
                      _results.push(['hget', "savedInGroups:" + searchtype, ele]);
                    }
                    return _results;
                  })();
                  console.log("<<<<<" + searchtype, margs2);
                  return redis_client.multi(margs2).exec(function(err, groupjsonlist) {
                    var ele, groupstoadd, margs22, parsedgroups, savedingroups, _i, _len;
                    if (err) {
                      return callback(err, groupjsonlist);
                    }
                    console.log(">>>>>>>" + searchtype, searches.elements, groupjsonlist);
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
                      var _j, _len2, _ref3, _results;
                      _ref3 = searches.elements;
                      _results = [];
                      for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
                        ele = _ref3[_j];
                        _results.push(['hget', allTagsGroupHash, ele]);
                      }
                      return _results;
                    })();
                    console.log("<<<<<", margs22);
                    return redis_client.multi(margs22).exec(function(errg22, tagjsonlist) {
                      var ele, names, parsedtags, savedintags, tagstoadd, titles, view, _j, _len2;
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
          });
        });
      } else {
        console.log("*** getSaved" + searchtype + "ForGroup2: membership failed for email=" + email + " err=" + erra);
        return callback(erra, saved_p);
      }
    });
  };
  getSavedSearchesForTag = function(req, res, next) {
    var fqGroupName, kword, tagName, __fname, _ref;
    kword = 'savedsearchesfortag';
    __fname = kword;
    tagName = req.query.tagName;
    fqGroupName = (_ref = req.query.fqGroupName) != null ? _ref : 'default';
    return ifHaveEmail(__fname, req, res, function(email) {
      if (fqGroupName === 'default') {
        return _doSearchForTag(email, tagName, 'search', createSavedSearchTemplates, res, kword, httpcallbackmaker(__fname, req, res, next));
      } else {
        return _doSearchForTagInGroup(email, tagName, fqGroupName, 'search', createSavedSearchTemplates, res, kword, httpcallbackmaker(__fname, req, res, next));
      }
    });
  };
  getSavedPubsForTag = function(req, res, next) {
    var fqGroupName, kword, tagName, __fname, _ref;
    kword = 'savedpubsfortag';
    __fname = kword;
    tagName = req.query.tagName;
    fqGroupName = (_ref = req.query.fqGroupName) != null ? _ref : 'default';
    console.log('-----', fqGroupName, tagName);
    return ifHaveEmail(__fname, req, res, function(email) {
      if (fqGroupName === 'default') {
        return _doSearchForTag(email, tagName, 'pub', createSavedPubTemplates, res, kword, httpcallbackmaker(__fname, req, res, next), {
          titlefield: 'titles',
          namefield: 'bibcodes'
        });
      } else {
        return _doSearchForTagInGroup(email, tagName, fqGroupName, 'pub', createSavedPubTemplates, res, kword, httpcallbackmaker(__fname, req, res, next), {
          titlefield: 'titles',
          namefield: 'bibcodes'
        });
      }
    });
  };
  getSavedObsvsForTag = function(req, res, next) {
    var fqGroupName, kword, tagName, __fname, _ref;
    kword = 'savedobsvsfortag';
    tagName = req.query.tagName;
    fqGroupName = (_ref = req.query.fqGroupName) != null ? _ref : 'default';
    __fname = kword;
    return ifHaveEmail(__fname, req, res, function(email) {
      if (fqGroupName === 'default') {
        return _doSearchForTag(email, tagName, 'obsv', createSavedObsvTemplates, res, kword, httpcallbackmaker(__fname, req, res, next), {
          titlefield: 'obsvtitles',
          namefield: 'targets'
        });
      } else {
        return _doSearchForTagInGroup(email, tagName, fqGroupName, 'obsv', createSavedObsvTemplates, res, kword, httpcallbackmaker(__fname, req, res, next), {
          titlefield: 'obsvtitles',
          namefield: 'targets'
        });
      }
    });
  };
  getTagsForUser = function(req, res, next) {
    var callback, kword, __fname;
    kword = 'gettagsforuser';
    __fname = kword;
    callback = httpcallbackmaker(__fname, req, res, next);
    return ifHaveEmail(__fname, req, res, function(email) {
      return redis_client.smembers("tags:" + email, callback);
    });
  };
  getTagsForGroup = function(req, res, next) {
    var callback, kword, wantedGroup, __fname;
    kword = 'gettagsforgroup';
    __fname = kword;
    wantedGroup = req.query.fqGroupName;
    callback = httpcallbackmaker(__fname, req, res, next);
    return ifHaveEmail(__fname, req, res, function(email) {
      return redis_client.sismember("members:" + wantedGroup, email, function(err, reply) {
        if (err) {
          return callback(err, reply);
        }
        if (reply) {
          return redis_client.smembers("tags:" + wantedGroup, callback);
        } else {
          return callback(err, reply);
        }
      });
    });
  };
  _doRemoveSearchesFromTag = function(email, tagName, searchtype, searchids, callback) {
    var allTagsHash, hashkeystodelete, margs, sid, taggedAllSet, taggedUserSet, taggedtype;
    taggedtype = "tagged" + searchtype;
    allTagsHash = "tagged:" + taggedBy + ":" + searchtype;
    taggedAllSet = "" + taggedtype + ":" + tagName;
    taggedUserSet = "" + taggedtype + ":" + taggedBy + ":" + tagName;
    margs = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = searchids.length; _i < _len; _i++) {
        sid = searchids[_i];
        _results.push(['sismember', taggedUserSet, sid]);
      }
      return _results;
    })();
    hashkeystodelete = [];
    return redis_client.multi(margs).exec(function(err, replies) {
      var idx, margs2, mysidstodelete, sididx, sididxs;
      if (err) {
        return callback(err, replies);
      }
      sididxs = (function() {
        var _ref, _results;
        _results = [];
        for (sididx = 0, _ref = replies.length; 0 <= _ref ? sididx < _ref : sididx > _ref; 0 <= _ref ? sididx++ : sididx--) {
          if (replies[sididx] !== 0) {
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
          _results.push(['hget', allTagsHash, searchids[idx]]);
        }
        return _results;
      })();
      return redis_client.multi(margs2).exec(function(errj, tagjsonlist) {
        var ele, i, margs4, margsall, margsi, margsuser, newsavedtags, newtagjsonlist, newtaglist, savedintags, savedintagshashcmds, sid, taglist, tlist, _i, _j, _len, _len2;
        if (errj) {
          return callback(errj, tagjsonlist);
        }
        console.log("o>>>>>>>", searchids, tagjsonlist);
        savedintags = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = tagjsonlist.length; _i < _len; _i++) {
            ele = tagjsonlist[_i];
            _results.push(JSON.parse(ele));
          }
          return _results;
        })();
        console.log("savedintags", savedintags);
        newsavedtags = [];
        for (_i = 0, _len = savedintags.length; _i < _len; _i++) {
          taglist = savedintags[_i];
          console.log('taglist', taglist);
          newtaglist = [];
          for (_j = 0, _len2 = taglist.length; _j < _len2; _j++) {
            ele = taglist[_j];
            if (ele !== tagName) {
              newtaglist.push(ele);
            }
          }
          console.log('newtaglist', newtaglist);
          newsavedtags.push(newtaglist);
        }
        newtagjsonlist = (function() {
          var _k, _len3, _results;
          _results = [];
          for (_k = 0, _len3 = newsavedtags.length; _k < _len3; _k++) {
            tlist = newsavedtags[_k];
            _results.push(JSON.stringify(tlist));
          }
          return _results;
        })();
        savedintagshashcmds = (function() {
          var _k, _len3, _results;
          _results = [];
          for (_k = 0, _len3 = sididxs.length; _k < _len3; _k++) {
            i = sididxs[_k];
            _results.push(['hset', allTagsHash, searchids[i], newtagjsonlist[i]]);
          }
          return _results;
        })();
        console.log("savedintagshashcmds", savedintagshashcmds);
        margsuser = (function() {
          var _k, _len3, _results;
          _results = [];
          for (_k = 0, _len3 = mysidstodelete.length; _k < _len3; _k++) {
            sid = mysidstodelete[_k];
            _results.push(['srem', taggedAllSet, sid]);
          }
          return _results;
        })();
        margsall = (function() {
          var _k, _len3, _results;
          _results = [];
          for (_k = 0, _len3 = mysidstodelete.length; _k < _len3; _k++) {
            sid = mysidstodelete[_k];
            _results.push(['srem', taggedUserSet, sid]);
          }
          return _results;
        })();
        margsi = margsuser.concat(margsall);
        margs4 = margsi.concat(savedingroupshashcmds);
        console.log('margs4', margs4);
        return redis_client.multi(margs4).exec(callback);
      });
    });
  };
  removeSearchesFromTag = function(email, tagName, searchids, callback) {
    return _doRemoveSearchesFromTag(email, tagName, 'search', searchids, callback);
  };
  removePubsFromTag = function(email, tagName, docids, callback) {
    return _doRemoveSearchesFromGroup(email, tagName, 'pub', docids, callback);
  };
  removeObsvsFromTag = function(email, tagName, obsids, callback) {
    return _doRemoveSearchesFromGroup(email, tagName, 'obsv', obsids, callback);
  };
  isArray = function (o) {
    return (o instanceof Array) ||
        (Object.prototype.toString.apply(o) === '[object Array]');
};;
  deleteItemsWithJSON = function(funcname, idname, delItems) {
    return function(terms, req, res, next) {
      console.log(">> In " + funcname);
      return ifHaveEmail(funcname, req, res, function(email) {
        var action, delids, tag, _ref;
        action = terms.action;
        tag = (_ref = terms.tagName) != null ? _ref : 'default';
        delids = isArray(terms.items) ? terms.items : [terms.items];
        if (action === "delete" && delids.length > 0) {
          return delItems(email, tag, delids, httpcallbackmaker(funcname, req, res, next));
        } else {
          return failedRequest(res);
        }
      });
    };
  };
  exports.deleteSearchesFromTag = deleteItemsWithJSON("deleteSearchesFromTag", "searches", removeSearchesFromTag);
  exports.deletePubsFromTag = deleteItemsWithJSON("deletePubsFromTag", "pubs", removePubsFromTag);
  exports.deleteObsvsFromTag = deleteItemsWithJSON("deleteObsvsFromTag", "obsvs", removeObsvsFromTag);
  exports.saveSearchesToTag = saveSearchesToTag;
  exports.savePubsToTag = savePubsToTag;
  exports.saveObsvsToTag = saveObsvsToTag;
  exports.getSavedSearchesForTag = getSavedSearchesForTag;
  exports.getSavedPubsForTag = getSavedPubsForTag;
  exports.getSavedObsvsForTag = getSavedObsvsForTag;
  exports.getTagsForUser = getTagsForUser;
  exports.getTagsForGroup = getTagsForGroup;
}).call(this);
