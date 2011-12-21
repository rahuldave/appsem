(function() {
  var acceptInvitationToGroup, accept_invitation_to_group, addInvitationToGroup, add_invitation_to_group, changeOwnershipOfGroup, change_ownership_of_group, connectutils, createGroup, create_group, declineInvitationToGroup, decline_invitation_to_group, deleteGroup, delete_group, elt, failedRequest, getGroupInfo, getMembersOfGroup, httpcallbackmaker, ifHaveEmail, ifLoggedIn, memberOfGroups, ownerOfGroups, pendingInvitationToGroups, redis_client, removeInvitationFromGroup, removeOneselfFromGroup, removeUserFromGroup, remove_invitation_from_group, remove_oneself_from_group, remove_user_from_group, requests, successfulRequest, url;
  requests = require("./requests");
  failedRequest = requests.failedRequest;
  successfulRequest = requests.successfulRequest;
  ifLoggedIn = requests.ifLoggedIn;
  httpcallbackmaker = requests.httpcallbackmaker;
  connectutils = require('connect').utils;
  url = require('url');
  redis_client = require("redis").createClient();
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
  create_group = function(email, rawGroupName, callback) {
    var changeTime, fqGroupName, margs;
    changeTime = new Date().getTime();
    fqGroupName = "" + email + "/" + rawGroupName;
    margs = [['hmset', "group:" + fqGroupName, 'owner', email, 'initialOwner', email, 'createdAt', changeTime, 'changedAt', changeTime], ['sadd', "members:" + fqGroupName, email], ['sadd', "memberof:" + email, fqGroupName], ['sadd', "ownerof:" + email, fqGroupName]];
    return redis_client.multi(margs).exec(callback);
  };
  createGroup = function(_arg, req, res, next) {
    var rawGroupName, __fname;
    rawGroupName = _arg.rawGroupName;
    console.log(__fname = "createGroup:");
    return ifHaveEmail(__fname, req, res, function(email) {
      return create_group(email, rawGroupName, httpcallbackmaker(__fname, req, res, next));
    });
  };
  add_invitation_to_group = function(email, fqGroupName, userNames, callback) {
    var changeTime;
    changeTime = new Date().getTime();
    return redis_client.hget("group:" + fqGroupName, 'owner', function(err, reply) {
      var margs, margs1, margs2, user;
      console.log(":::::::::::", err, reply, fqGroupName);
      if (err) {
        return callback(err, reply);
      }
      if (reply === email) {
        margs1 = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = userNames.length; _i < _len; _i++) {
            user = userNames[_i];
            _results.push(['sadd', "invitations:" + fqGroupName, user]);
          }
          return _results;
        })();
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
        return redis_client.multi(margs).exec(callback);
      } else {
        return callback(err, reply);
      }
    });
  };
  addInvitationToGroup = function(_arg, req, res, next) {
    var fqGroupName, userNames, __fname;
    fqGroupName = _arg.fqGroupName, userNames = _arg.userNames;
    console.log(__fname = "addInvitationToGroup");
    return ifHaveEmail(__fname, req, res, function(email) {
      return add_invitation_to_group(email, fqGroupName, userNames, httpcallbackmaker(__fname, req, res, next));
    });
  };
  remove_invitation_from_group = function(email, fqGroupName, userNames, callback) {
    var changeTime;
    changeTime = new Date().getTime();
    return redis_client.hget("group:" + fqGroupName, 'owner', function(err, reply) {
      var margs, margs1, margs2, user;
      console.log(":::::::::::", err, reply, fqGroupName);
      if (err) {
        return callback(err, reply);
      }
      if (reply === email) {
        margs1 = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = userNames.length; _i < _len; _i++) {
            user = userNames[_i];
            _results.push(['srem', "invitations:" + fqGroupName, user]);
          }
          return _results;
        })();
        margs2 = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = userNames.length; _i < _len; _i++) {
            user = userNames[_i];
            _results.push(['srem', "invitationsto:" + user, fqGroupName]);
          }
          return _results;
        })();
        margs = margs1.concat(margs2);
        return redis_client.multi(margs).exec(callback);
      } else {
        return callback(err, reply);
      }
    });
  };
  removeInvitationFromGroup = function(_arg, req, res, next) {
    var fqGroupName, userNames, __fname;
    fqGroupName = _arg.fqGroupName, userNames = _arg.userNames;
    console.log(__fname = "removeUserFromGroup");
    return ifHaveEmail(__fname, req, res, function(email) {
      return remove_invitation_from_group(email, fqGroupName, userNames, httpcallbackmaker(__fname, req, res, next));
    });
  };
  accept_invitation_to_group = function(email, fqGroupName, callback) {
    var changeTime;
    changeTime = new Date().getTime();
    return redis_client.sismember("invitations:" + fqGroupName, email, function(err, reply) {
      var margs;
      if (err) {
        return callback(err, reply);
      }
      if (reply) {
        margs = [['sadd', "members:" + fqGroupName, email], ['srem', "invitations:" + fqGroupName, email], ['sadd', "memberof:" + email, fqGroupName], ['srem', "invitationsto:" + email, fqGroupName]];
        return redis_client.multi(margs).exec(callback);
      } else {
        return callback(err, reply);
      }
    });
  };
  acceptInvitationToGroup = function(_arg, req, res, next) {
    var fqGroupName, __fname;
    fqGroupName = _arg.fqGroupName;
    console.log(__fname = "acceptInvitationToGroup");
    return ifHaveEmail(__fname, req, res, function(email) {
      return accept_invitation_to_group(email, fqGroupName, httpcallbackmaker(__fname, req, res, next));
    });
  };
  decline_invitation_to_group = function(email, fqGroupName, callback) {
    var changeTime;
    changeTime = new Date().getTime();
    return redis_client.sismember("invitations:" + fqGroupName, email, function(err, reply) {
      var margs;
      if (err) {
        return callback(err, reply);
      }
      if (reply) {
        margs = [['srem', "invitations:" + fqGroupName, email], ['srem', "invitationsto:" + email, fqGroupName]];
        return redis_client.multi(margs).exec(callback);
      } else {
        return callback(err, reply);
      }
    });
  };
  declineInvitationToGroup = function(_arg, req, res, next) {
    var fqGroupName, __fname;
    fqGroupName = _arg.fqGroupName;
    console.log(__fname = "declineInvitationToGroup");
    return ifHaveEmail(__fname, req, res, function(email) {
      return decline_invitation_to_group(email, fqGroupName, httpcallbackmaker(__fname, req, res, next));
    });
  };
  pendingInvitationToGroups = function(req, res, next) {
    var changeTime, __fname;
    console.log(__fname = "pendingInvitationToGroups");
    changeTime = new Date().getTime();
    return ifHaveEmail(__fname, req, res, function(email) {
      return redis_client.smembers("invitationsto:" + email, httpcallbackmaker(__fname, req, res, next));
    });
  };
  memberOfGroups = function(req, res, next) {
    var changeTime, __fname;
    console.log(__fname = "memberOfGroups");
    changeTime = new Date().getTime();
    return ifHaveEmail(__fname, req, res, function(email) {
      return redis_client.smembers("memberof:" + email, httpcallbackmaker(__fname, req, res, next));
    });
  };
  ownerOfGroups = function(req, res, next) {
    var changeTime, __fname;
    console.log(__fname = "ownerOfGroups");
    changeTime = new Date().getTime();
    return ifHaveEmail(__fname, req, res, function(email) {
      return redis_client.smembers("ownerof:" + email, httpcallbackmaker(__fname, req, res, next));
    });
  };
  remove_user_from_group = function(email, fqGroupName, userNames, callback) {
    return redis_client.hget("group:" + fqGroupName, 'owner', function(err, reply) {
      var margs, margs1, margs2, user;
      if (err) {
        return callback(err, reply);
      }
      if (reply === email) {
        margs1 = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = userNames.length; _i < _len; _i++) {
            user = userNames[_i];
            _results.push(['srem', "members:" + fqGroupName, user]);
          }
          return _results;
        })();
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
        return redis_client.multi(margs).exec(callback);
      } else {
        return callback(err, reply);
      }
    });
  };
  removeUserFromGroup = function(_arg, req, res, next) {
    var changeTime, fqGroupName, userNames, __fname;
    fqGroupName = _arg.fqGroupName, userNames = _arg.userNames;
    console.log(__fname = "removeUserFromGroup");
    changeTime = new Date().getTime();
    return ifHaveEmail(__fname, req, res, function(email) {
      return remove_user_from_group(email, fqGroupName, userNames, httpcallbackmaker(__fname, req, res, next));
    });
  };
  change_ownership_of_group = function(email, fqGroupName, newOwner, callback) {
    var changeTime;
    changeTime = new Date().getTime();
    return redis_client.hget("group:" + fqGroupName, 'owner', function(err, reply) {
      var cParams, margs;
      if (err) {
        return callback(err, reply);
      }
      if (reply === email) {
        cParams = {
          owner: newOwner,
          changedAt: changeTime
        };
        margs = [['hset', "group:" + fqGroupName, 'owner', newOwner], ['hset', "group:" + fqGroupName, 'changedAt', changeTime], ['srem', "owner:" + email, fqGroupName], ['sadd', "owner:" + newOwner, fqGroupName]];
        return redis_client.multi(margs).exec(callback);
      } else {
        return callback(err, reply);
      }
    });
  };
  changeOwnershipOfGroup = function(_arg, req, res, next) {
    var fqGroupName, newOwner, __fname;
    fqGroupName = _arg.fqGroupName, newOwner = _arg.newOwner;
    console.log(__fname = "changeOwnershipOfGroup");
    return ifHaveEmail(__fname, req, res, function(email) {
      return change_ownership_of_group(email, fqGroupName, newOwner, httpcallbackmaker(__fname, req, res, next));
    });
  };
  remove_oneself_from_group = function(email, fqGroupName, callback) {
    var changeTime;
    changeTime = new Date().getTime();
    return redis_client.sismember("members:" + fqGroupName, email, function(err, reply) {
      var margs;
      if (err) {
        return callback(err, reply);
      }
      if (reply) {
        margs = [['srem', "members:" + fqGroupName, email], ['srem', "memberof:" + email, fqGroupName]];
        return redis_client.multi(margs).exec(callback);
      } else {
        return callback(err, reply);
      }
    });
  };
  removeOneselfFromGroup = function(_arg, req, res, next) {
    var fqGroupName, __fname;
    fqGroupName = _arg.fqGroupName;
    console.log(__fname = "removeOneselfFromGroup");
    return ifHaveEmail(__fname, req, res, function(email) {
      return remove_oneself_from_group(email, fqGroupName, httpcallbackmaker(__fname, req, res, next));
    });
  };
  delete_group = function(email, fqGroupName, callback) {
    return redis_client.hget("group:" + fqGroupName, 'owner', function(err, reply) {
      var margs;
      if (err) {
        return callback(err, reply);
      }
      if (reply === email) {
        margs = [['del', "savedsearch:" + fqGroupName], ['del', "savedpub:" + fqGroupName], ['del', "savedobsv:" + fqGroupName], ['del', "members:" + fqGroupName], ['del', "invitations:" + fqGroupName], ['del', "savedby:" + fqGroupName], ['del', "group:" + fqGroupName], ['srem', "memberof:" + email, fqGroupName]];
        return redis_client.multi(margs).exec(callback);
      } else {
        return callback(err, reply);
      }
    });
  };
  deleteGroup = function(_arg, req, res, next) {
    var fqGroupName, __fname;
    fqGroupName = _arg.fqGroupName;
    console.log(__fname = "deleteGroup:");
    return ifHaveEmail(__fname, req, res, function(email) {
      return delete_group(email, fqGroupName, httpcallbackmaker(__fname, req, res, next));
    });
  };
  getMembersOfGroup = function(req, res, next) {
    var callback, changeTime, wantedGroup, __fname;
    console.log(__fname = "getMembersOfGroup");
    changeTime = new Date().getTime();
    wantedGroup = req.query.fqGroupName;
    console.log("wantedGroup", wantedGroup);
    callback = httpcallbackmaker(__fname, req, res, next);
    return ifHaveEmail(__fname, req, res, function(email) {
      return redis_client.sismember("members:" + wantedGroup, email, function(err, reply) {
        if (err) {
          return callback(err, reply);
        }
        if (reply) {
          return redis_client.smembers("members:" + wantedGroup, callback);
        } else {
          return callback(err, reply);
        }
      });
    });
  };
  getGroupInfo = function(req, res, next) {
    var callback, changeTime, wantedGroup, __fname;
    console.log(__fname = "getGroupInfo");
    changeTime = new Date().getTime();
    wantedGroup = req.query.fqGroupName;
    console.log("wantedGroup", wantedGroup);
    callback = httpcallbackmaker(__fname, req, res, next);
    return ifHaveEmail(__fname, req, res, function(email) {
      return redis_client.sismember("members:" + wantedGroup, email, function(err, reply) {
        if (err) {
          return callback(err, reply);
        }
        if (reply) {
          return redis_client.hgetall("group:" + wantedGroup, callback);
        } else {
          return redis_client.sismember("invitations:" + wantedGroup, email, function(err, reply) {
            if (err) {
              return callback(err, reply);
            }
            if (reply) {
              return redis_client.hgetall("group:" + wantedGroup, callback);
            } else {
              return callback(err, reply);
            }
          });
        }
      });
    });
  };
  exports.createGroup = createGroup;
  exports.addInvitationToGroup = addInvitationToGroup;
  exports.removeInvitationFromGroup = removeInvitationFromGroup;
  exports.acceptInvitationToGroup = acceptInvitationToGroup;
  exports.declineInvitationToGroup = declineInvitationToGroup;
  exports.removeUserFromGroup = removeUserFromGroup;
  exports.changeOwnershipOfGroup = changeOwnershipOfGroup;
  exports.removeOneselfFromGroup = removeOneselfFromGroup;
  exports.deleteGroup = deleteGroup;
  exports.getMembersOfGroup = getMembersOfGroup;
  exports.getGroupInfo = getGroupInfo;
  exports.memberOfGroups = memberOfGroups;
  exports.ownerOfGroups = ownerOfGroups;
  exports.pendingInvitationToGroups = pendingInvitationToGroups;
  elt = {};
  elt.create_group = create_group;
  elt.delete_group = delete_group;
  elt.add_invitation_to_group = add_invitation_to_group;
  elt.remove_invitation_from_group = remove_invitation_from_group;
}).call(this);
