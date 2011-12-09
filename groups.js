(function() {
  var acceptInvitationToGroup, addInvitationToGroup, changeOwnershipOfGroup, connectutils, createGroup, create_group, deleteGroup, delete_group, failedRequest, getMembersOfGroup, httpcallbackmaker, ifHaveEmail, ifLoggedIn, memberOfGroups, pendingInvitationToGroups, redis_client, removeInvitationFromGroup, removeOneselfFromGroup, removeUserFromGroup, requests, successfulRequest, url;
  var __slice = Array.prototype.slice;
  requests = require("./requests");
  failedRequest = requests.failedRequest;
  successfulRequest = requests.successfulRequest;
  ifLoggedIn = requests.ifLoggedIn;
  httpcallbackmaker = requests.httpcallbackmaker;
  connectutils = require('connect').utils;
  url = require('url');
  redis_client = require("redis").createClient();
  ifHaveEmail = function(req, res, cb, failopts) {
    if (failopts == null) {
      failopts = {};
    }
    return ifLoggedIn(req, res, function(loginid) {
      return redis_client.get("email:" + loginid, function(err, email) {
        if (email) {
          return cb(email);
        } else {
          return failedRequest(res, failopts);
        }
      });
    });
  };
  create_group = function(email, rawGroupName, callback) {
    var changeTime, fqGroupName, margs;
    changeTime = new Date().getTime();
    fqGroupName = "" + email + "/" + rawGroupName;
    margs = [['hmset', "group:" + fqGroupName, 'owner', email, 'initialOwner', email, 'createdAt', changeTime, 'changedAt', changeTime], ['sadd', "members:" + fqGroupName, email], ['sadd', "memberof:" + email, fqGroupName]];
    return redis_client.multi(margs).exec(callback);
  };
  createGroup = function(_arg, req, res, next) {
    var rawGroupName;
    rawGroupName = _arg.rawGroupName;
    console.log("In createGroup:");
    return ifHaveEmail(req, res, function(email) {
      return create_group(email, rawGroupName, httpcallbackmaker(req, res, next));
    });
  };
  addInvitationToGroup = function(payload, req, res, next) {
    var changeTime;
    console.log("In addUserToGroup: cookies=" + req.cookies + " payload=" + payload);
    changeTime = new Date().getTime();
    return ifLoggedIn(req, res, function(loginid) {
      var fqGroupName, jsonObj, userNames;
      jsonObj = JSON.parse(payload);
      fqGroupName = jsonObj.fqgroupname;
      userNames = jsonObj.usernames;
      return redis_client.get("email:" + loginid, function(err, email) {
        return redis_client.hget(fqGroupName, 'owner', function(err2, owner) {
          var margs, margs1, margs2, user;
          if (owner === email) {
            margs1 = [['sadd', "invitations:" + fqGroupName].concat(__slice.call(userNames))];
            margs2 = (function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = userNames.length; _i < _len; _i++) {
                user = userNames[_i];
                _results.push(['sadd', "invitationsto:" + user, fqGroupName]);
              }
              return _results;
            })();
            margs = margs1.concat(margs2);
            return redis_client.multi(margs).exec(function(err3, reply) {
              return successfulRequest(res);
            });
          }
        });
      });
    });
  };
  removeInvitationFromGroup = function(payload, req, res, next) {
    var changeTime;
    console.log("In removeUserFromGroup: cookies=" + req.cookies + " payload=" + payload);
    changeTime = new Date().getTime();
    return ifLoggedIn(req, res, function(loginid) {
      var fqGroupName, jsonObj, userNames;
      jsonObj = JSON.parse(payload);
      fqGroupName = jsonObj.fqgroupname;
      userNames = jsonObj.usernames;
      return redis_client.get("email:" + loginid, function(err, email) {
        return redis_client.hget(fqGroupName, 'owner', function(err2, owner) {
          var margs, margs1, margs2, user;
          if (owner === email) {
            margs1 = [['srem', "invitations:" + fqGroupName].concat(__slice.call(userNames))];
            margs2 = (function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = userNames.length; _i < _len; _i++) {
                user = userNames[_i];
                _results.push(['srem', "invitationto:" + user, fqGroupName]);
              }
              return _results;
            })();
            margs = margs1.concat(margs2);
            return redis_client.multi(margs).exec(function(err3, reply) {
              return successfulRequest(res);
            });
          }
        });
      });
    });
  };
  acceptInvitationToGroup = function(payload, req, res, next) {
    var changeTime;
    console.log("In acceptInvitationToGroup: cookies=" + req.cookies + " payload=" + payload);
    changeTime = new Date().getTime();
    return ifLoggedIn(req, res, function(loginid) {
      var fqGroupName, jsonObj;
      jsonObj = JSON.parse(payload);
      fqGroupName = jsonObj.fqgroupname;
      return redis_client.get("email:" + loginid, function(err, email) {
        return redis.client.sismember("invitations:" + fqGroupName, email, function(err2, member_p) {
          var margs;
          if (member_p) {
            margs = [['sadd', "members:" + fqGroupName, email], ['srem', "invitations:" + fqGroupName, email], ['sadd', "memberof:" + email, fqGroupName], ['srem', "invitationsto:" + email, fqGroupName]];
            return redis_client.multi(margs).exec(function(err3, reply) {
              return successfulRequest(res);
            });
          }
        });
      });
    });
  };
  pendingInvitationToGroups = function(req, res, next) {
    var changeTime;
    console.log("In acceptInvitationToGroup: cookies=" + req.cookies + " payload=" + payload);
    changeTime = new Date().getTime();
    return ifLoggedIn(req, res, function(loginid) {
      return redis_client.get("email:" + loginid, function(err, email) {
        return redis_client.smembers("invitationto:" + email, function(err3, reply) {
          return successfulRequest(res, {
            message: reply
          });
        });
      });
    });
  };
  memberOfGroups = function(req, res, next) {
    var changeTime;
    console.log("In acceptInvitationToGroup: cookies=" + req.cookies + " payload=" + payload);
    changeTime = new Date().getTime();
    return ifLoggedIn(req, res, function(loginid) {
      return redis_client.get("email:" + loginid, function(err, email) {
        return redis_client.smembers("memberof:" + email, function(err3, reply) {
          return successfulRequest(res, {
            message: reply
          });
        });
      });
    });
  };
  removeUserFromGroup = function(payload, req, res, next) {
    var changeTime;
    console.log("In removeUserFromGroup: cookies=" + req.cookies + " payload=" + payload);
    changeTime = new Date().getTime();
    return ifLoggedIn(req, res, function(loginid) {
      var fqGroupName, jsonObj, userNames;
      jsonObj = JSON.parse(payload);
      fqGroupName = jsonObj.fqgroupname;
      userNames = jsonObj.usernames;
      return redis_client.get("email:" + loginid, function(err, email) {
        return redis_client.hget(fqGroupName, 'owner', function(err2, owner) {
          var margs, margs1, margs2, user;
          if (owner === email) {
            margs1 = [['srem', "members:" + fqGroupName].concat(__slice.call(userNames))];
            margs2 = (function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = userNames.length; _i < _len; _i++) {
                user = userNames[_i];
                _results.push(['srem', "memberof:" + user, fqGroupName]);
              }
              return _results;
            })();
            margs = margs1.concat(margs2);
            return redis_client.multi(margs).exec(function(err3, reply) {
              return successfulRequest(res);
            });
          }
        });
      });
    });
  };
  changeOwnershipOfGroup = function(payload, req, res, next) {
    var changeTime;
    console.log("In changeOwnershipOfGroup: cookies=" + req.cookies + " payload=" + payload);
    changeTime = new Date().getTime();
    return ifLoggedIn(req, res, function(loginid) {
      var cParams, fqGroupName, jsonObj, newOwner;
      jsonObj = JSON.parse(payload);
      fqGroupName = jsonObj.fqgroupname;
      newOwner = jsonObj.newowner;
      cParams = {
        owner: newOwner,
        changedAt: changeTime
      };
      return redis_client.get("email:" + loginid, function(err, email) {
        return redis_client.hget(fqGroupName, 'owner', function(err2, owner) {
          if (owner === email) {
            return redis_client.hmset("group:" + fqGroupName, cParams, function(err3, reply) {
              return successfulRequest(res);
            });
          }
        });
      });
    });
  };
  removeOneselfFromGroup = function(payload, req, res, next) {
    var changeTime;
    console.log("In removeOneselfFromGroup: cookies=" + req.cookies + " payload=" + payload);
    changeTime = new Date().getTime();
    return ifLoggedIn(req, res, function(loginid) {
      var fqGroupName, jsonObj;
      jsonObj = JSON.parse(payload);
      fqGroupName = jsonObj.fqgroupname;
      return redis_client.get("email:" + loginid, function(err, email) {
        return redis.client.sismember("members:" + fqGroupName, email, function(err2, member_p) {
          var margs;
          if (member_p) {
            margs = [['srem', "members:" + fqGroupName, email], ['srem', "memberof:" + email, fqGroupName]];
            return redis_client.multi(margs).exec(function(err3, reply) {
              return successfulRequest(res);
            });
          }
        });
      });
    });
  };
  delete_group = function(email, fqGroupName, callback) {
    return redis_client.hget("group:" + fqGroupName, 'owner', function(err, reply) {
      var margs;
      if (err) {
        return callback(err, reply);
      }
      if (reply === email) {
        margs = [['del', "savedsearch:" + fqGroupName], ['del', "savedpub:" + fqGroupName], ['del', "savedobsv:" + fqGroupName], ['del', "members:" + fqGroupName], ['del', "invitations:" + fqGroupName], ['del', "group:" + fqGroupName], ['srem', "memberof:" + email, fqGroupName]];
        return redis_client.multi(margs).exec(callback);
      } else {
        return callback(err, reply);
      }
    });
  };
  deleteGroup = function(_arg, req, res, next) {
    var fqGroupName;
    fqGroupName = _arg.fqGroupName;
    console.log("In deleteGroup:");
    return ifHaveEmail(req, res, function(email) {
      return delete_group(email, fqGroupName, httpcallbackmaker(req, res, next));
    });
  };
  getMembersOfGroup = function(req, res, next) {
    var changeTime, wantedGroup;
    console.log("In removeOneselfFromGroup: cookies=" + req.cookies + " payload=" + payload);
    changeTime = new Date().getTime();
    wantedGroup = req.query.wantedgroup;
    return ifLoggedIn(req, res, function(loginid) {
      return redis_client.get("email:" + loginid, function(err, email) {
        return redis.client.sismember("members:" + wantedgroup, email, function(err2, member_p) {
          if (member_p) {
            return redis_client.smembers("members:" + wantedgroup, function(err3, reply) {
              return successfulRequest(res, {
                message: reply
              });
            });
          }
        });
      });
    });
  };
  exports.createGroup = createGroup;
  exports.addInvitationToGroup = addInvitationToGroup;
  exports.removeInvitationFromGroup = removeInvitationFromGroup;
  exports.acceptInvitationToGroup = acceptInvitationToGroup;
  exports.removeUserFromGroup = removeUserFromGroup;
  exports.changeOwnershipOfGroup = changeOwnershipOfGroup;
  exports.removeOneselfFromGroup = removeOneselfFromGroup;
  exports.deleteGroup = deleteGroup;
  exports.getMembersOfGroup = getMembersOfGroup;
  exports.memberOfGroups = memberOfGroups;
  exports.pendingInvitationToGroups = pendingInvitationToGroups;
  exports.create_group = create_group;
  exports.delete_group = delete_group;
}).call(this);
