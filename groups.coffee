requests = require("./requests")
failedRequest = requests.failedRequest
successfulRequest = requests.successfulRequest
ifLoggedIn = requests.ifLoggedIn

httpcallbackmaker = requests.httpcallbackmaker
#consolecallbackmaker=requests.consolecallbackmaker
connectutils = require('connect').utils
url = require 'url'
redis_client = require("redis").createClient()

ifHaveEmail = (req, res, cb, failopts = {}) ->
  ifLoggedIn req, res, (loginid) ->
    redis_client.get "email:#{loginid}", (err, email) ->
        if email
            cb email
        else
            failedRequest res, failopts
#the current user creates a group, with himself in it
#sets up a group hash and a group set and an invitations set param=groupname
#sets it to email/groupname

create_group = (email, rawGroupName, callback) ->
    changeTime = new Date().getTime()
    fqGroupName="#{email}/#{rawGroupName}"
    margs = [
        ['hmset', "group:#{fqGroupName}", 'owner', email, 'initialOwner', email, 'createdAt', changeTime, 'changedAt', changeTime],
        ['sadd', "members:#{fqGroupName}", email],
        ['sadd', "memberof:#{email}", fqGroupName]
    ]
    redis_client.multi(margs).exec callback
        

createGroup = ({rawGroupName}, req, res, next) ->
  console.log "In createGroup:"
  ifHaveEmail req, res, (email) ->
    create_group email, rawGroupName, httpcallbackmaker(req, res, next)
                     
#you have to be added by somebody else to a group    
#add another users comma seperated emails to the invitation set param=emails
#TODO: no retraction of invitation as yet

add_invitation_to_group = (email, fqGroupName, userNames, callback)->
    changeTime = new Date().getTime()
    redis_client.hget "group:#{fqGroupName}", 'owner', (err, reply) -> 
        console.log ":::::::::::", err, reply, fqGroupName
        if err
            return callback err, reply
        if reply is email
            margs1=( ['sadd', "invitations:#{fqGroupName}", user] for user in userNames)
            #bit loose and fast here as users may not exist
            margs2=(['sadd', "invitationsto:#{user}", fqGroupName] for user in userNames)
            margs=margs1.concat margs2
            redis_client.multi(margs).exec callback
        else
            return callback err, reply
            
addInvitationToGroup = ({fqGroupName, userNames}, req, res, next) ->
    console.log "In addInvitationToGroup"
    ifHaveEmail req, res, (email) ->
        add_invitation_to_group email, fqGroupName, userNames, httpcallbackmaker(req, res, next)

remove_invitation_from_group = (email, fqGroupName, userNames, callback) ->
    changeTime = new Date().getTime()
    redis_client.hget "group:#{fqGroupName}", 'owner', (err, reply) -> 
        console.log ":::::::::::", err, reply, fqGroupName
        if err
            return callback err, reply
        if reply is email
            margs1=( ['srem', "invitations:#{fqGroupName}", user] for user in userNames)
            #bit loose and fast here as users may not exist
            margs2=(['srem', "invitationsto:#{user}", fqGroupName] for user in userNames)
            margs=margs1.concat margs2
            redis_client.multi(margs).exec callback
        else
            return callback err, reply
        
removeInvitationFromGroup = ({fqGroupName, userNames}, req, res, next) ->
    console.log "In removeUserFromGroup"
    ifHaveEmail req, res, (email) ->
        remove_invitation_from_group email, fqGroupName, userNames, httpcallbackmaker(req, res, next)
        

accept_invitation_to_group = (email, fqGroupName, callback) ->
    changeTime = new Date().getTime()
    redis_client.sismember "invitations:#{fqGroupName}", email, (err, reply)->
        if err
            return callback err, reply
        if reply
            margs = [
                ['sadd', "members:#{fqGroupName}", email],
                ['srem', "invitations:#{fqGroupName}", email],
                ['sadd', "memberof:#{email}", fqGroupName],
                ['srem', "invitationsto:#{email}", fqGroupName]
            ]
            redis_client.multi(margs).exec callback
        else
            return callback err, reply
#move the currently logged in user from invitations set to groups set. param=group    
acceptInvitationToGroup = ({fqGroupName}, req, res, next) -> 
    console.log "In acceptInvitationToGroup"
    ifHaveEmail req, res, (email) -> 
        accept_invitation_to_group email, fqGroupName, httpcallbackmaker(req, res, next)

#GET
pendingInvitationToGroups = (req, res, next) -> 
  console.log "In pendingInvitationToGroups"
  changeTime = new Date().getTime()
  
  ifHaveEmail req, res, (email) ->
    redis_client.smembers "invitationsto:#{email}", httpcallbackmaker(req, res, next)

#GET                    
memberOfGroups = (req, res, next) -> 
  console.log "In memberOfGroups"
  changeTime = new Date().getTime()
  
  ifHaveEmail req, res, (email) ->
    redis_client.smembers "memberof:#{email}", httpcallbackmaker(req, res, next)
#only owner of group can do this   params=groupname, username
#BUG: currently not checking if any random people are being tried to be removed
#will silently fail

#Also we wont remove anything the user added to group

remove_user_from_group = (email, fqGroupName, userNames, callback) ->
    redis_client.hget "group:#{fqGroupName}", 'owner', (err, reply) -> 
        if err
            return callback err, reply
        if reply is email
            margs1=(['srem', "members:#{fqGroupName}", user] for user in userNames)
            margs2=(['srem', "memberof:#{user}", fqGroupName] for user in userNames)
            margs=margs1.concat margs2
            redis_client.multi(margs).exec callback
        else
            return callback err, reply
                
removeUserFromGroup = ({fqGroupName, userNames}, req, res, next) ->
  console.log "In removeUserFromGroup"
  changeTime = new Date().getTime()

  ifHaveEmail req, res, (email) ->
    remove_user_from_group email, fqGroupName, userNames, httpcallbackmaker(req, res, next)



#current owner if logged on can set someone else as owner param=newOwner, group
change_ownership_of_group = (email, fqGroupName, newOwner, callback) ->
    changeTime = new Date().getTime()
    redis_client.hget "group:#{fqGroupName}", 'owner', (err, reply) -> 
        if err
            return callback err, reply
        if reply is email
            cParams = 
                owner:newOwner
                changedAt:changeTime
            redis_client.hmset "group:#{fqGroupName}", cParams, callback
        else
            return callback err, reply
    
changeOwnershipOfGroup = ({fqGroupName, newOwner}, req, res, next) ->
  console.log "In changeOwnershipOfGroup"
  ifHaveEmail req, res, (email) ->
    change_ownership_of_group email, fqGroupName, newOwner, httpcallbackmaker(req, res, next)
        
#remove currently logged in user from group. param=group
#this will not affext one's existing assets in group
#Stuff you saved in group should remain (does now) TODO

#BUG: should stop you from doing this if you are the owner
remove_oneself_from_group = (email, fqGroupName, callback) ->
    changeTime = new Date().getTime()
    redis_client.sismember "members:#{fqGroupName}", email, (err, reply)->
        if err
            return callback err, reply
        if reply
            margs = [
                ['srem', "members:#{fqGroupName}", email],
                ['srem', "memberof:#{email}", fqGroupName]
            ]
            redis_client.multi(margs).exec callback
        else
            return callback err, reply

removeOneselfFromGroup = ({fqGroupName}, req, res, next) ->
    console.log "In removeOneselfFromGroup"
    ifHaveEmail req, res, (email) ->
        remove_oneself_from_group email, fqGroupName, httpcallbackmaker(req, res, next)
        #fqGroupName="#{email}/#{rawGroupName}"
        
#remove a group owned by currently logged in user param=group
#this will remove everything from anyone associated with group
#BUG: this is incomplete and dosent delete saved searches under the user
#specifically dosent hadle saved:user:group and savedInGroup:searchtype  yet.

#Also, BUG: this code has now combined concerns. It should emit a deleting group
#And saved.coffee should add events to the eventhandler loop that do the needful there.

#BUG invitations to non-existent group not deleted yet What else?

#BUG How about deleting in savedInGroups
delete_group=(email, fqGroupName, callback)->
  redis_client.hget "group:#{fqGroupName}", 'owner', (err, reply) -> 
    if err
        return callback err, reply
    if reply is email
        margs = [
            ['del', "savedsearch:#{fqGroupName}"],
            ['del', "savedpub:#{fqGroupName}"],
            ['del', "savedobsv:#{fqGroupName}"],
            ['del', "members:#{fqGroupName}"],
            ['del', "invitations:#{fqGroupName}"],
            ['del', "savedby:#{fqGroupName}"],
            ['del', "group:#{fqGroupName}"],
            ['srem', "memberof:#{email}", fqGroupName]
        ]
        redis_client.multi(margs).exec callback
    else
        return callback err, reply

#  ['del', "savedby:#{fqGroupName}"],  
deleteGroup = ({fqGroupName}, req, res, next) ->
  console.log "In deleteGroup:"
  ifHaveEmail req, res, (email) ->
    delete_group email, fqGroupName, httpcallbackmaker(req, res, next)


#GET
getMembersOfGroup = (req, res, next) ->
    console.log "In getMembersOfGroup"
    changeTime = new Date().getTime()
    wantedGroup=req.query.group
    console.log "wantedGroup", wantedGroup
    callback =  httpcallbackmaker(req, res, next)
    ifHaveEmail req, res, (email) ->
        redis_client.sismember "members:#{wantedGroup}", email, (err, reply)->
            if err
                return callback err, reply
            if reply    
                redis_client.smembers "members:#{wantedGroup}", callback
            else
                return callback err, reply 
        
exports.createGroup=createGroup
exports.addInvitationToGroup=addInvitationToGroup
exports.removeInvitationFromGroup=removeInvitationFromGroup
exports.acceptInvitationToGroup=acceptInvitationToGroup
exports.removeUserFromGroup=removeUserFromGroup
exports.changeOwnershipOfGroup=changeOwnershipOfGroup
exports.removeOneselfFromGroup=removeOneselfFromGroup
exports.deleteGroup=deleteGroup

#and the gets   
exports.getMembersOfGroup=getMembersOfGroup
exports.memberOfGroups=memberOfGroups
exports.pendingInvitationToGroups=pendingInvitationToGroups

elt={}

elt.create_group=create_group
elt.delete_group=delete_group
elt.add_invitation_to_group=add_invitation_to_group
elt.remove_invitation_from_group=remove_invitation_from_group
#exports.consolecallbackmaker=consolecallbackmaker
