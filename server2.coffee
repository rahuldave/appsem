###
A NodeJS server that statically serves javascript out, proxies solr requests,
and handles authentication through the ADS
###

connect = require 'connect'
connectutils = connect.utils
http = require 'http'
querystring = require 'querystring'
url = require 'url'
mustache = require 'mustache'
fs = require 'fs'
redis_client = require('redis').createClient()
# RedisStore = require('connect-redis')(connect)

requests = require "./requests"
completeRequest = requests.completeRequest
failedRequest = requests.failedRequest
successfulRequest = requests.successfulRequest
ifLoggedIn = requests.ifLoggedIn
postHandler = requests.postHandler
postHandlerWithJSON = requests.postHandlerWithJSON

proxy = require "./proxy"

user = require "./user"
loginUser = user.loginUser
logoutUser = user.logoutUser
getUser = user.getUser

views = require "./views"

saved = require "./saved"
tags = require "./tags"
groups = require "./groups"
migration = require('./migration2')

config = require("./config").config
SITEPREFIX = config.SITEPREFIX
STATICPREFIX = config.STATICPREFIX

solrrouter = connect(
  connect.router (app) ->
    app.get '/select', (req, res) ->
      solroptions =
        host: config.SOLRHOST
        path: config.SOLRURL + req.url
        port: config.SOLRPORT
      proxy.doProxy solroptions, req, res
)

solrrouter2 = connect(
  connect.router (app) ->
    app.get '/select', (req, res) ->
      solroptions =
        host: config.SOLRHOST
        path: config.SOLRURL + req.url
        port: config.SOLRPORT2
      proxy.doProxy solroptions, req, res
)

##Only run on the cookiestealer. Then TODO:test
makeADSJSONPCall = (req, res, next) ->
  #jsonpcback = url.parse(req.url, true).query.callback
  jsonpcback = req.query.callback
  console.log "makeADSJSONPCCall: #{jsonpcback}"

  adsoptions =
    host: config.ADSHOST
    path: config.ADSURL
    headers:
      Cookie: "NASA_ADS_ID=#{req.cookies.nasa_ads_id}"

  proxy.doTransformedProxy adsoptions, req, res, (val) ->
    "#{jsonpcback}(#{val})"

addUser = (req, res, next) ->
  console.log "::addToRedis cookies=#{JSON.stringify req.cookies}"
  postHandler req, res, user.insertUser

doPost = (func) ->
  (req, res, next) -> postHandler req, res, func

doPostWithJSON = (func) ->
  (req, res, next) -> postHandlerWithJSON req, res, func
# Proxy the call to ADS, setting up the NASA_ADS_ID cookie

doADSProxyHandler = (payload, req, res, next) ->
  console.log '>> In doADSProxyHandler'
  console.log ">>    cookies=#{JSON.stringify req.cookies}"
  console.log ">>    payload=#{payload}"

  ifLoggedIn req, res, (loginid) ->
    args = JSON.parse payload
    urlpath = args.urlpath
    console.log ">>   proxying request: #{urlpath}"
    opts =
      host: config.ADSHOST
      port: 80
      path: urlpath
      headers:
        Cookie: "NASA_ADS_ID=#{req.cookies.nasa_ads_id}"

    proxy.doProxy opts, req, res

doADSProxyHandler2 = (payload, req, res, next) ->
  console.log '>> In doADSProxyHandler2'
  console.log ">>    cookies=#{JSON.stringify req.cookies}"
  console.log ">>    payload=#{payload}"

  args = JSON.parse payload
  console.log "ARGS", args
  urlpath = args.urlpath
  method = args.method ? 'GET'
  #below must be json encoded hash?
  data = args.data
  console.log ">>   proxying request: #{urlpath}"
  poststring=querystring.stringify(data)
  opts =
      host: config.ADSHOST
      port: 80
      method: method
      path: urlpath
      headers: {'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': poststring.length}
  console.log opts
  console.log poststring
  proxy.doProxyPost opts, poststring, req, res
  
doADSProxy = doPost doADSProxyHandler
doADSProxy2 = doPost doADSProxyHandler2

# This is just temporary code: could add in a timeout and message

quickRedirect = (newloc) ->
  (req, res, next) ->
    res.writeHead 302, 'Redirect', Location: newloc
    res.statusCode = 302
    res.end()

explorouter = connect(connect.router (app) ->
  app.get '/publications', views.doPublications
  app.get '/saved', views.doSaved
  app.get '/help', views.doHelp
  app.get '/group', views.doGroup
  app.get '/user', views.doUser
  app.get '/objects', quickRedirect 'publications/'
  app.get '/observations', views.doObservations
  app.get '/proposals', quickRedirect 'publications/'
  app.get '/catalogs', quickRedirect 'publications/'
  app.get '/', quickRedirect 'user/'
  )

server = connect.createServer()
#server.use connect.logger()
server.use connect.cookieParser()
server.use connect.query()

# Not sure we need to use session middleware, more like login moddleware cookies.
# Especially since we dont seem to know how not to reextend the time for session cookies.
# thats prolly right behavior for session cookies since the more people use the more we wanna keep them on
# server.use(connect.session({ store: new RedisStore, secret: 'keyboard cat', cookie :{maxAge: 31536000000} }));
#
server.use STATICPREFIX+'/', connect.static(__dirname + '/static/ajax-solr/')
#server.use SITEPREFIX+'/', quickRedirect 'explorer/user'
server.use SITEPREFIX+'/solr/', solrrouter
server.use SITEPREFIX+'/solr2/', solrrouter2
server.use SITEPREFIX+'/explorer/', explorouter
server.use SITEPREFIX+'/adsjsonp', makeADSJSONPCall

# Using get to put into redis:BAD but just for testing
# QUS: Is this comment still accurate?
server.use SITEPREFIX+'/addtoredis', addUser
server.use SITEPREFIX+'/getuser', getUser
server.use SITEPREFIX+'/logout', logoutUser
server.use SITEPREFIX+'/login', loginUser


server.use SITEPREFIX+'/savesearch', doPost saved.saveSearch
server.use SITEPREFIX+'/savepub', doPost saved.savePub
server.use SITEPREFIX+'/saveobsv', doPost saved.saveObsv

server.use SITEPREFIX+'/savesearchestogroup', doPostWithJSON saved.saveSearchesToGroup
server.use SITEPREFIX+'/savepubstogroup', doPostWithJSON saved.savePubsToGroup
server.use SITEPREFIX+'/saveobsvstogroup', doPostWithJSON saved.saveObsvsToGroup


server.use SITEPREFIX+'/deletesearch', doPost saved.deleteSearch
server.use SITEPREFIX+'/deletesearches', doPost saved.deleteSearches
server.use SITEPREFIX+'/deletepub', doPost saved.deletePub
server.use SITEPREFIX+'/deletepubs', doPost saved.deletePubs
server.use SITEPREFIX+'/deleteobsv', doPost saved.deleteObsv
server.use SITEPREFIX+'/deleteobsvs', doPost saved.deleteObsvs


server.use SITEPREFIX+'/deletesearchesfromgroup', doPostWithJSON saved.deleteSearchesFromGroup
server.use SITEPREFIX+'/deletepubsfromgroup', doPostWithJSON saved.deletePubsFromGroup
server.use SITEPREFIX+'/deleteobsvsfromgroup', doPostWithJSON saved.deleteObsvsFromGroup


server.use SITEPREFIX+'/deletesearchesfromtag', doPostWithJSON tags.deleteSearchesFromTag
server.use SITEPREFIX+'/deletepubsfromtag', doPostWithJSON tags.deletePubsFromTag
server.use SITEPREFIX+'/deleteobsvsfromtag', doPostWithJSON tags.deleteObsvsFromTag
server.use SITEPREFIX+'/savedsearchesfortag', tags.getSavedSearchesForTag
server.use SITEPREFIX+'/savedpubsfortag', tags.getSavedPubsForTag
server.use SITEPREFIX+'/savedobsvsfortag', tags.getSavedObsvsForTag

server.use SITEPREFIX+'/gettagsforuser', tags.getTagsForUser
server.use SITEPREFIX+'/gettagsforgroup', tags.getTagsForGroup

server.use SITEPREFIX+'/savesearchestotag', doPostWithJSON tags.saveSearchesToTag
server.use SITEPREFIX+'/savepubstotag', doPostWithJSON tags.savePubsToTag
server.use SITEPREFIX+'/saveobsvstotag', doPostWithJSON tags.saveObsvsToTag

# Used by the saved search page to provide functionality
# to the saved publications list. This is a hack to work
# around the same-origin policy.

server.use SITEPREFIX+'/adsproxy', doADSProxy
server.use SITEPREFIX+'/adsproxy2', doADSProxy2

server.use SITEPREFIX+'/savedsearches', saved.getSavedSearches
server.use SITEPREFIX+'/savedsearches2', saved.getSavedSearches2
server.use SITEPREFIX+'/savedsearchesforgroup2', saved.getSavedSearchesForGroup2
server.use SITEPREFIX+'/savedpubs', saved.getSavedPubs
server.use SITEPREFIX+'/savedpubs2', saved.getSavedPubs2
server.use SITEPREFIX+'/savedpubsforgroup2', saved.getSavedPubsForGroup2
server.use SITEPREFIX+'/savedobsvs', saved.getSavedObsvs
server.use SITEPREFIX+'/savedobsvs2', saved.getSavedObsvs2
server.use SITEPREFIX+'/savedobsvsforgroup2', saved.getSavedObsvsForGroup2

#Groupfunctions
server.use SITEPREFIX+'/creategroup', doPostWithJSON groups.createGroup
server.use SITEPREFIX+'/addinvitationtogroup', doPostWithJSON groups.addInvitationToGroup
server.use SITEPREFIX+'/removeinvitationfromgroup', doPostWithJSON groups.removeInvitationFromGroup
server.use SITEPREFIX+'/acceptinvitationtogroup', doPostWithJSON groups.acceptInvitationToGroup
server.use SITEPREFIX+'/declineinvitationtogroup', doPostWithJSON groups.declineInvitationToGroup
server.use SITEPREFIX+'/removeuserfromgroup', doPostWithJSON groups.removeUserFromGroup
server.use SITEPREFIX+'/changeownershipofgroup', doPostWithJSON groups.changeOwnershipOfGroup
server.use SITEPREFIX+'/removeoneselffromgroup', doPostWithJSON groups.removeOneselfFromGroup
server.use SITEPREFIX+'/deletegroup', doPostWithJSON groups.deleteGroup

#and the gets   
server.use SITEPREFIX+'/getmembersofgroup', groups.getMembersOfGroup
server.use SITEPREFIX+'/getinvitationstogroup', groups.getInvitationsToGroup
server.use SITEPREFIX+'/getgroupinfo', groups.getGroupInfo
server.use SITEPREFIX+'/memberofgroups', groups.memberOfGroups
server.use SITEPREFIX+'/ownerofgroups', groups.ownerOfGroups
server.use SITEPREFIX+'/pendinginvitationtogroups', groups.pendingInvitationToGroups
# not sure of the best way to do this, but want to privide access to
# ajax-loader.gif and this way avoids hacking ResultWidget.2.0.js

server.use '/images', connect.static(__dirname + '/static/ajax-solr/images/')
server.use '/bootstrap', connect.static(__dirname + '/static/ajax-solr/images/')
server.use '/backbone', connect.static(__dirname + '/static/ajax-solr/images/')

runServer = (svr, port) ->
  now = new Date()
  hosturl = "http://localhost:#{port}#{SITEPREFIX}/explorer/publications/"
  console.log "#{now.toUTCString()} - Starting server on #{hosturl}"
  svr.listen port

migration.validateRedis redis_client, () -> runServer server, 3010

