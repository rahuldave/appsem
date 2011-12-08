###
A NodeJS server that statically serves javascript out, proxies solr requests,
and handles authentication through the ADS
###

connect = require 'connect'
connectutils = connect.utils
http = require 'http'
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

proxy = require "./proxy"

user = require "./user"
loginUser = user.loginUser
logoutUser = user.logoutUser
getUser = user.getUser

views = require "./views"

saved = require "./saved"
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

doADSProxy = doPost doADSProxyHandler

# This is just temporary code: could add in a timeout and message

quickRedirect = (newloc) ->
  (req, res, next) ->
    res.writeHead 302, 'Redirect', Location: newloc
    res.statusCode = 302
    res.end()

explorouter = connect(connect.router (app) ->
  app.get '/publications', views.doPublications
  app.get '/saved', views.doSaved
  app.get '/objects', quickRedirect 'publications/'
  app.get '/observations', views.doObservations
  app.get '/proposals', quickRedirect 'publications/'
  app.get '/', quickRedirect 'publications/'
  )

server = connect.createServer()
server.use connect.cookieParser()
server.use connect.query()

# Not sure we need to use session middleware, more like login moddleware cookies.
# Especially since we dont seem to know how not to reextend the time for session cookies.
# thats prolly right behavior for session cookies since the more people use the more we wanna keep them on
# server.use(connect.session({ store: new RedisStore, secret: 'keyboard cat', cookie :{maxAge: 31536000000} }));
#
server.use STATICPREFIX+'/', connect.static(__dirname + '/static/ajax-solr/')
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

server.use SITEPREFIX+'/savesearchestogroup', doPost saved.saveSearchesToGroup
server.use SITEPREFIX+'/savepubstogroup', doPost saved.savePubsToGroup
server.use SITEPREFIX+'/saveobsvstogroup', doPost saved.saveObsvsToGroup


server.use SITEPREFIX+'/deletesearch', doPost saved.deleteSearch
server.use SITEPREFIX+'/deletesearches', doPost saved.deleteSearches
server.use SITEPREFIX+'/deletepub', doPost saved.deletePub
server.use SITEPREFIX+'/deletepubs', doPost saved.deletePubs
server.use SITEPREFIX+'/deleteobsv', doPost saved.deleteObsv
server.use SITEPREFIX+'/deleteobsvs', doPost saved.deleteObsvs


server.use SITEPREFIX+'/deletesearchesfromgroup', doPost saved.deleteSearchesFromGroup
server.use SITEPREFIX+'/deletepubsfromgroup', doPost saved.deletePubsFromGroup
server.use SITEPREFIX+'/deleteobsvsfromgroup', doPost saved.deleteObsvsFromGroup
# Used by the saved search page to provide functionality
# to the saved publications list. This is a hack to work
# around the same-origin policy.

server.use SITEPREFIX+'/adsproxy', doADSProxy

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
server.use SITEPREFIX+'/creategroup', doPost groups.createGroup
server.use SITEPREFIX+'/addusertogroup', doPost groups.addUserToGroup
server.use SITEPREFIX+'/acceptinvitationtogroup', doPost groups.acceptInvitationToGroup
server.use SITEPREFIX+'/removeuserfromgroup', doPost groups.removeUserFromGroup
server.use SITEPREFIX+'/changeownershipofgroup', doPost groups.changeOwnershipOfGroup
server.use SITEPREFIX+'/removeoneselffromgroup', doPost groups.removeOneselfFromGroup
server.use SITEPREFIX+'/deletegroup', doPost groups.deleteGroup

#and the gets   
server.use SITEPREFIX+'/saveobsv', groups.getMembersOfGroup
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

