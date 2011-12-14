(function() {
  var acceptInvitationToGroup, accept_invitation_to_group, addInvitationToGroup, add_invitation_to_group, changeOwnershipOfGroup, change_ownership_of_group, connectutils, createGroup, create_group, deleteGroup, delete_group, elt, failedRequest, getMembersOfGroup, httpcallbackmaker, ifHaveEmail, ifLoggedIn, memberOfGroups, pendingInvitationToGroups, redis_client, removeInvitationFromGroup, removeOneselfFromGroup, removeUserFromGroup, remove_invitation_from_group, remove_oneself_from_group, remove_user_from_group, requests, successfulRequest, url;
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
    var fqGroupName, userNames;
    fqGroupName = _arg.fqGroupName, userNames = _arg.userNames;
    console.log("In addInvitationToGroup");
    return ifHaveEmail(req, res, function(email) {
      return add_invitation_to_group(email, fqGroupName, userNames, httpcallbackmaker(req, res, next));
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
    var fqGroupName, userNames;
    fqGroupName = _arg.fqGroupName, userNames = _arg.userNames;
    console.log("In removeUserFromGroup");
    return ifHaveEmail(req, res, function(email) {
      return remove_invitation_from_group(email, fqGroupName, userNames, httpcallbackmaker(req, res, next));
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
    var fqGroupName;
    fqGroupName = _arg.fqGroupName;
    console.log("In acceptInvitationToGroup");
    return ifHaveEmail(req, res, function(email) {
      return accept_invitation_to_group(email, fqGroupName, httpcallbackmaker(req, res, next));
    });
  };
  pendingInvitationToGroups = function(req, res, next) {
    var changeTime;
    console.log("In pendingInvitationToGroups");
    changeTime = new Date().getTime();
    return ifHaveEmail(req, res, function(email) {
      return redis_client.smembers("invitationsto:" + email, httpcallbackmaker(req, res, next));
    });
  };
  memberOfGroups = function(req, res, next) {
    var changeTime;
    console.log("In memberOfGroups");
    changeTime = new Date().getTime();
    return ifHaveEmail(req, res, function(email) {
      return redis_client.smembers("memberof:" + email, httpcallbackmaker(req, res, next));
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
    var changeTime, fqGroupName, userNames;
    fqGroupName = _arg.fqGroupName, userNames = _arg.userNames;
    console.log("In removeUserFromGroup");
    changeTime = new Date().getTime();
    return ifHaveEmail(req, res, function(email) {
      return remove_user_from_group(email, fqGroupName, userNames, httpcallbackmaker(req, res, next));
    });
  };
  change_ownership_of_group = function(email, fqGroupName, newOwner, callback) {
    var changeTime;
    changeTime = new Date().getTime();
    return redis_client.hget("group:" + fqGroupName, 'owner', function(err, reply) {
      var cParams;
      if (err) {
        return callback(err, reply);
      }
      if (reply === email) {
        cParams = {
          owner: newOwner,
          changedAt: changeTime
        };
        return redis_client.hmset("group:" + fqGroupName, cParams, callback);
      } else {
        return callback(err, reply);
      }
    });
  };
  changeOwnershipOfGroup = function(_arg, req, res, next) {
    var fqGroupName, newOwner;
    fqGroupName = _arg.fqGroupName, newOwner = _arg.newOwner;
    console.log("In changeOwnershipOfGroup");
    return ifHaveEmail(req, res, function(email) {
      return change_ownership_of_group(email, fqGroupName, newOwner, httpcallbackmaker(req, res, next));
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
    var fqGroupName;
    fqGroupName = _arg.fqGroupName;
    console.log("In removeOneselfFromGroup");
    return ifHaveEmail(req, res, function(email) {
      return remove_oneself_from_group(email, fqGroupName, httpcallbackmaker(req, res, next));
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
    var callback, changeTime, wantedGroup;
    console.log("In getMembersOfGroup");
    changeTime = new Date().getTime();
    wantedGroup = req.query.group;
    console.log("wantedGroup", wantedGroup);
    callback = httpcallbackmaker(req, res, next);
    return ifHaveEmail(req, res, function(email) {
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
  elt = {};
  elt.create_group = create_group;
  elt.delete_group = delete_group;
  elt.add_invitation_to_group = add_invitation_to_group;
  elt.remove_invitation_from_group = remove_invitation_from_group;
}).call(this);
