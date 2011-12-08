requests = require("./requests")
failedRequest = requests.failedRequest
successfulRequest = requests.successfulRequest
ifLoggedIn = requests.ifLoggedIn
connectutils = require('connect').utils
url = require 'url'
redis_client = require("redis").createClient()

#the current user creates a group, with himself in it
#sets up a group hash and a group set and an invitations set param=groupname
#sets it to email/groupname
createGroup = (payload, req, res, next) ->
    1
#you have to be added by somebody else to a group    
#add another users comma seperated emails to the invitation set param=emails
addUserToGroup = (payload, req, res, next) ->
    1

#move the currently logged in user from invitations set to groups set. param=group    
acceptInvitationToGroup = (payload, req, res, next) -> 

#only owner of group can do this   params=groupname, username
removeUserFromGroup = (payload, req, res, next) ->
    1

#current owner if logged on can set someone else as owner param=newOwner, group
changeOwnershipOfGroup = (payload, req, res, next) ->
    1
#remove currently logged in user from group. param=group
#this will not affext one's existing assets in group

removeOneselfFromGroup = (payload, req, res, next) ->
    1    

#remove a group owned by currently logged in user param=group
#this will remove everything from anyone associated with group
deleteGroup = (payload, req, res, next) ->
    1

getMembersOfGroup = (req, res, next) ->
    1
        
exports.createGroup=createGroup
exports.addUserToGroup=addUserToGroup
exports.acceptInvitationToGroup=acceptInvitationToGroup
exports.removeUserFromGroup=removeUserFromGroup
exports.changeOwnershipOfGroup=changeOwnershipOfGroup
exports.removeOneselfFromGroup=removeOneselfFromGroup
exports.deleteGroup=deleteGroup

#and the gets   
exports.getMembersOfGroup=getMembersOfGroup
