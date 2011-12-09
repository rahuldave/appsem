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

addInvitationToGroup = (payload, req, res, next) ->
  console.log "In addUserToGroup: cookies=#{req.cookies} payload=#{payload}"
  changeTime = new Date().getTime()

  ifLoggedIn req, res, (loginid) ->
    jsonObj = JSON.parse payload
    fqGroupName=jsonObj.fqgroupname
    userNames=jsonObj.usernames
    redis_client.get "email:#{loginid}", (err, email) ->
        redis_client.hget fqGroupName, 'owner', (err2, owner) -> 
            if owner is email
                margs1=[
                    ['sadd', "invitations:#{fqGroupName}", userNames...]
                ]
                #bit loose and fast here as users may not exist
                margs2=(['sadd', "invitationsto:#{user}", fqGroupName] for user in userNames)
                margs=margs1.concat margs2
                redis_client.multi(margs).exec (err3, reply) ->
                    successfulRequest res

removeInvitationFromGroup = (payload, req, res, next) ->
  console.log "In removeUserFromGroup: cookies=#{req.cookies} payload=#{payload}"
  changeTime = new Date().getTime()

  ifLoggedIn req, res, (loginid) ->
    jsonObj = JSON.parse payload
    fqGroupName=jsonObj.fqgroupname
    userNames=jsonObj.usernames
    redis_client.get "email:#{loginid}", (err, email) ->
        redis_client.hget fqGroupName, 'owner', (err2, owner) -> 
            if owner is email
                margs1 = [
                    ['srem', "invitations:#{fqGroupName}", userNames...]
                ]
                margs2=(['srem', "invitationto:#{user}", fqGroupName] for user in userNames)
                margs=margs1.concat margs2
                redis_client.multi(margs).exec (err3, reply) ->
                    successfulRequest res
                                
#move the currently logged in user from invitations set to groups set. param=group    
acceptInvitationToGroup = (payload, req, res, next) -> 
  console.log "In acceptInvitationToGroup: cookies=#{req.cookies} payload=#{payload}"
  changeTime = new Date().getTime()

  ifLoggedIn req, res, (loginid) ->
    jsonObj = JSON.parse payload
    fqGroupName=jsonObj.fqgroupname
    redis_client.get "email:#{loginid}", (err, email) ->
        #fqGroupName="#{email}/#{rawGroupName}"
        redis.client.sismember "invitations:#{fqGroupName}", email, (err2, member_p)->
            if member_p
                margs = [
                    ['sadd', "members:#{fqGroupName}", email],
                    ['srem', "invitations:#{fqGroupName}", email],
                    ['sadd', "memberof:#{email}", fqGroupName],
                    ['srem', "invitationsto:#{email}", fqGroupName]
                ]
                redis_client.multi(margs).exec (err3, reply) ->
                    successfulRequest res

pendingInvitationToGroups = (req, res, next) -> 
  console.log "In acceptInvitationToGroup: cookies=#{req.cookies} payload=#{payload}"
  changeTime = new Date().getTime()
  
  ifLoggedIn req, res, (loginid) ->
    redis_client.get "email:#{loginid}", (err, email) ->
        #fqGroupName="#{email}/#{rawGroupName}"
        redis_client.smembers "invitationto:#{email}",  (err3, reply) ->
                    successfulRequest res, message:reply
                    
memberOfGroups = (req, res, next) -> 
  console.log "In acceptInvitationToGroup: cookies=#{req.cookies} payload=#{payload}"
  changeTime = new Date().getTime()
  
  ifLoggedIn req, res, (loginid) ->
    redis_client.get "email:#{loginid}", (err, email) ->
        #fqGroupName="#{email}/#{rawGroupName}"
        redis_client.smembers "memberof:#{email}",  (err3, reply) ->
                    successfulRequest res, message:reply
#only owner of group can do this   params=groupname, username
#BUG: currently not checking if any random people are being tried to be removed
#will silently fail
removeUserFromGroup = (payload, req, res, next) ->
  console.log "In removeUserFromGroup: cookies=#{req.cookies} payload=#{payload}"
  changeTime = new Date().getTime()

  ifLoggedIn req, res, (loginid) ->
    jsonObj = JSON.parse payload
    fqGroupName=jsonObj.fqgroupname
    userNames=jsonObj.usernames
    redis_client.get "email:#{loginid}", (err, email) ->
        redis_client.hget fqGroupName, 'owner', (err2, owner) -> 
            if owner is email
                margs1 = [
                    ['srem', "members:#{fqGroupName}", userNames...]
                ]
                margs2=(['srem', "memberof:#{user}", fqGroupName] for user in userNames)
                margs=margs1.concat margs2
                redis_client.multi(margs).exec (err3, reply) ->
                    successfulRequest res 


#current owner if logged on can set someone else as owner param=newOwner, group
changeOwnershipOfGroup = (payload, req, res, next) ->
  console.log "In changeOwnershipOfGroup: cookies=#{req.cookies} payload=#{payload}"
  changeTime = new Date().getTime()

  ifLoggedIn req, res, (loginid) ->
    jsonObj = JSON.parse payload
    fqGroupName=jsonObj.fqgroupname
    newOwner=jsonObj.newowner
    cParams = 
        owner:newOwner
        changedAt:changeTime
    redis_client.get "email:#{loginid}", (err, email) ->
        redis_client.hget fqGroupName, 'owner', (err2, owner) -> 
            if owner is email
                redis_client.hmset "group:#{fqGroupName}", cParams, (err3, reply) ->
                    successfulRequest res
#remove currently logged in user from group. param=group
#this will not affext one's existing assets in group
#Stuff you saved in group should remain (does now) TODO
removeOneselfFromGroup = (payload, req, res, next) ->
  console.log "In removeOneselfFromGroup: cookies=#{req.cookies} payload=#{payload}"
  changeTime = new Date().getTime()

  ifLoggedIn req, res, (loginid) ->
    jsonObj = JSON.parse payload
    fqGroupName=jsonObj.fqgroupname
    redis_client.get "email:#{loginid}", (err, email) ->
        #fqGroupName="#{email}/#{rawGroupName}"
        redis.client.sismember "members:#{fqGroupName}", email, (err2, member_p)->
            if member_p
                margs = [
                    ['srem', "members:#{fqGroupName}", email],
                    ['srem', "memberof:#{email}", fqGroupName]
                ]
                redis_client.multi(margs).exec (err3, reply) ->
                    successfulRequest res    

#remove a group owned by currently logged in user param=group
#this will remove everything from anyone associated with group
#BUG: this is incomplete and dosent delete saved searches under the user
#specifically dosent hadle saved:user:group and savedInGroup:searchtype  yet.

#Also, BUG: this code has now combined concerns. It should emit a deleting group
#And saved.coffee should add events to the eventhandler loop that do the needful there.
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
            ['del', "group:#{fqGroupName}"],
            ['srem', "memberof:#{email}", fqGroupName]
        ]
        redis_client.multi(margs).exec callback
    else
        return callback err, reply
    
deleteGroup = ({fqGroupName}, req, res, next) ->
  console.log "In deleteGroup:"
  ifHaveEmail req, res, (email) ->
    delete_group email, fqGroupName, httpcallbackmaker(req, res, next)



getMembersOfGroup = (req, res, next) ->
  console.log "In removeOneselfFromGroup: cookies=#{req.cookies} payload=#{payload}"
  changeTime = new Date().getTime()
  wantedGroup=req.query.wantedgroup
  
  ifLoggedIn req, res, (loginid) ->
    redis_client.get "email:#{loginid}", (err, email) ->
        #fqGroupName="#{email}/#{rawGroupName}"
        redis.client.sismember "members:#{wantedgroup}", email, (err2, member_p)->
            if member_p
                redis_client.smembers "members:#{wantedgroup}",  (err3, reply) ->
                    successfulRequest res, message:reply
        
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

exports.create_group=create_group
exports.delete_group=delete_group
#exports.consolecallbackmaker=consolecallbackmaker
