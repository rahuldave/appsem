(function() {
  var acceptInvitationToGroup, addUserToGroup, changeOwnershipOfGroup, connectutils, createGroup, deleteGroup, failedRequest, getMembersOfGroup, ifLoggedIn, redis_client, removeOneselfFromGroup, removeUserFromGroup, requests, successfulRequest, url;
  requests = require("./requests");
  failedRequest = requests.failedRequest;
  successfulRequest = requests.successfulRequest;
  ifLoggedIn = requests.ifLoggedIn;
  connectutils = require('connect').utils;
  url = require('url');
  redis_client = require("redis").createClient();
  createGroup = function(payload, req, res, next) {
    return 1;
  };
  addUserToGroup = function(payload, req, res, next) {
    return 1;
  };
  acceptInvitationToGroup = function(payload, req, res, next) {};
  removeUserFromGroup = function(payload, req, res, next) {
    return 1;
  };
  changeOwnershipOfGroup = function(payload, req, res, next) {
    return 1;
  };
  removeOneselfFromGroup = function(payload, req, res, next) {
    return 1;
  };
  deleteGroup = function(payload, req, res, next) {
    return 1;
  };
  getMembersOfGroup = function(req, res, next) {
    return 1;
  };
  exports.createGroup = createGroup;
  exports.addUserToGroup = addUserToGroup;
  exports.acceptInvitationToGroup = acceptInvitationToGroup;
  exports.removeUserFromGroup = removeUserFromGroup;
  exports.changeOwnershipOfGroup = changeOwnershipOfGroup;
  exports.removeOneselfFromGroup = removeOneselfFromGroup;
  exports.deleteGroup = deleteGroup;
  exports.getMembersOfGroup = getMembersOfGroup;
}).call(this);
