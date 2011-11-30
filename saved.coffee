###
Handles saved items - e.g. searches and publications - that involves
accessing information from Redis.
###

redis_client = require("redis").createClient()

requests = require("./requests")
failedRequest = requests.failedRequest
successfulRequest = requests.successfulRequest
ifLoggedIn = requests.ifLoggedIn

# A comment on saved times, used in both savePub and saveSearch.
#
# Approximate the save time as the time we process the request
# on the server, rather than when it was made (in case the user's
# clock is not set sensibly and it allows us to associate a time
# zone, even if it is our time zone and not the user's).
#
# For now we save the UTC version of the time and provide no
# way to change this to something meaningful to the user.
#
# Alternatives include:
#
# *  the client could send the time as a string, including the
#    time zone, but this relies on their clock being okay
#
# *  the client can send in the local timezone info which can
#    then be used to format the server-side derived time
#    Not sure if can trust the time zone offset from the client
#    if can not trust the time itself. Calculating a useful display
#    string from the timezone offset is fiddly.
#

saveSearch = (payload, req, res, next) ->
  console.log "In saveSearch: cookies=#{req.cookies} payload=#{payload}"
  saveTime = new Date().getTime()

  ifLoggedIn req, res, (loginid) ->
    jsonObj = JSON.parse payload
    savedSearch = jsonObj.savedsearch

    redis_client.get "email:#{loginid}", (err, email) ->
      # keep as a multi even though now a single addition
      margs = [['zadd', "savedsearch:#{email}", saveTime, savedSearch]]
      redis_client.multi(margs).exec (err2, reply) -> successfulRequest res

savePub = (payload, req, res, next) ->
  console.log "In savePub: cookies=#{req.cookies} payload=#{payload}"
  saveTime = new Date().getTime()

  ifLoggedIn req, res, (loginid) ->
    jsonObj = JSON.parse payload
    savedPub = jsonObj.savedpub
    bibCode = jsonObj.pubbibcode
    title = jsonObj.pubtitle

    redis_client.get "email:#{loginid}", (err, email) ->

      # Moved to a per-user database for titles and bibcodes so that
      # we can delete this information. I am thinking that this could
      # just be asked via AJAX requests of Solr by the client in the
      # pubsub branch so could be removed.
      #
      margs = [['hset', "savedbibcodes:#{email}", savedPub, bibCode],
               ['hset', "savedtitles:#{email}", savedPub, title],
               ['zadd', "savedpub:#{email}", saveTime, savedPub]]
      redis_client.multi(margs).exec (err2, reply) -> successfulRequest res


saveObsv = (payload, req, res, next) ->
  console.log "In saveObsv: cookies=#{req.cookies} payload=#{payload}"
  saveTime = new Date().getTime()

  ifLoggedIn req, res, (loginid) ->
    jsonObj = JSON.parse payload
    savedObsv = jsonObj.savedobsv
    target = jsonObj.obsvtarget
    title = jsonObj.obsvtitle

    redis_client.get "email:#{loginid}", (err, email) ->

      # Moved to a per-user database for titles and bibcodes so that
      # we can delete this information. I am thinking that this could
      # just be asked via AJAX requests of Solr by the client in the
      # pubsub branch so could be removed.
      #
      margs = [['hset', "savedtargets:#{email}", savedObsv, target],
               ['hset', "savedobsvtitles:#{email}", savedObsv, title],
               ['zadd', "savedobsv:#{email}", saveTime, savedObsv]]
      redis_client.multi(margs).exec (err2, reply) -> successfulRequest res
      
      
      
searchToText = (searchTerm) ->
    # lazy way to remove the trailing search term

    splits=searchTerm.split '#'
    s = "&#{splits[1]}"
    s = s.replace '&q=*%3A*', ''

    # only decode after the initial split to protect against the
    # unlikely event that &fq= appears as part of a search term.
    terms = s.split /&fq=/
    terms.shift()
    # ignore the first entry as '' by construction
    out = ''
    for term in terms 
        [name, value] = decodeURIComponent(term).split ':', 2
        out += "#{name}=#{value} "
    

    return out

# Returns a string representation of timeString, which
# should be a string containing the time in milliseconds,
# nowDate is the "current" date in milliseconds.
#
timeToText = (nowDate, timeString) ->
  t = parseInt timeString, 10
  delta = nowDate - t
  if delta < 1000
    return "Now"

  else if delta < 60000
    return "#{Math.floor(delta/1000)}s ago"

  else if delta < 60000 * 60
    m = Math.floor(delta / 60000)
    s = Math.floor((delta - m * 60000) /1000)
    out = "#{m}m"
    if s isnt 0
      out += " #{s}s"
    return "#{out} ago"

  else if delta < 60000 * 60 * 24
    h = Math.floor(delta / (60000 * 60))
    delta = delta - h * 60000 * 60
    m = Math.floor(delta / 60000)
    out = "#{h}h"
    if m isnt 0
      out += " #{m}m"
    return "#{out} ago"

  d = new Date(t)
  return d.toUTCString()

# Modify the object view to add in the needed values
# given the search results. This was originally used with Mustache
# views - hence the terminology - but the data is now passed
# back to the client as JSON.
#
createSavedSearchTemplates = (nowDate, searchkeys, searchtimes) ->
  view = {}
  console.log "VIEW", view
  nsearch = searchkeys.length

  if nsearch is 0
    view.hassearches = false
    view.savedsearches = []

  else
    view.hassearches = true

    makeTemplate = (ctr) ->
      key = searchkeys[ctr]
      time = searchtimes[ctr]
      out =
        searchuri: key
        searchtext: searchToText key
        searchtime: time
        searchtimestr: timeToText nowDate, time
        searchctr: ctr
      return out

    view.savedsearches = (makeTemplate i for i in [0..nsearch-1])

  return view

createSavedPubTemplates = (nowDate, pubkeys, bibcodes, pubtitles, pubtimes) ->
  view = {}
  npub = pubkeys.length

  if npub is 0
    view.haspubs = false
    view.savedpubs = []

  else
    view.haspubs = true

    makeTemplate = (ctr) ->
      bibcode = bibcodes[ctr]
      linkuri = "bibcode%3A#{ bibcode.replace(/&/g, '%26') }"
      out =
        pubid: pubkeys[ctr]
        linktext: pubtitles[ctr]
        linkuri: linkuri
        pubtime: pubtimes[ctr]
        pubtimestr: timeToText nowDate, pubtimes[ctr]
        bibcode: bibcode
        pubctr: ctr
      return out

    view.savedpubs = (makeTemplate i for i in [0..npub-1])

  return view

createSavedObsvTemplates = (nowDate, obsvkeys, targets, obsvtitles, obsvtimes) ->
  view = {}
  nobsv = obsvkeys.length

  if nobsv is 0
    view.hasobsvs = false
    view.savedobsvs = []

  else
    view.hasobsvs = true

    makeTemplate = (ctr) ->
      target = targets[ctr]
      #linkuri = "bibcode%3A#{ bibcode.replace(/&/g, '%26') }"
      linkuri=obsvkeys[ctr]
      out =
        obsvid: obsvkeys[ctr]
        linktext: obsvkeys[ctr]
        linkuri: linkuri
        obsvtime: obsvtimes[ctr]
        obsvtimestr: timeToText nowDate, obsvtimes[ctr]
        target: target
        obsvctr: ctr
      return out

    view.savedobsvs = (makeTemplate i for i in [0..nobsv-1])

  return view
# Get all the elements for the given key, stored
# in a sorted list, and sent it to callback
# as cb(err,values). If flag is true then the list is sorted in
# ascending order of score (ie zrange rather than zrevrange)
# otherwise descending order.
#
getSortedElements = (flag, key, cb) ->
  redis_client.zcard key, (err, nelem) ->
    # Could ask for nelem-1 but Redis seems to ignore
    # overflow here
    if flag
      redis_client.zrange key, 0, nelem, cb
    else
      redis_client.zrevrange key, 0, nelem, cb

# As getSortedElements but the values sent to the callback is
# a hash with two elements:
#    elements  - the elements
#    scores    - the scores
#
getSortedElementsAndScores = (flag, key, cb) ->
  redis_client.zcard key, (e1, nelem) ->
    if nelem is 0
      cb e1, elements: [], scores: []

    else
      splitIt = (err, values) ->
        # in case nelem has changed
        nval = values.length - 1
        response =
          elements: (values[i] for i in [0..nval] by 2)
          scores:   (values[i] for i in [1..nval] by 2)

        cb err, response

      if flag
        redis_client.zrange key, 0, nelem, "withscores", splitIt
      else
        redis_client.zrevrange key, 0, nelem, "withscores", splitIt

getSavedSearches = (req, res, next) ->
  console.log "in getSavedSearches"
  kword = 'savedsearches'
  doIt = (loginid) ->
    redis_client.get "email:#{loginid}", (err, email) ->
      getSortedElements true, "savedsearch:#{email}", (err2, searches) ->
        console.log "getSavedSearches reply=#{searches} err=#{err2}"
        successfulRequest res,
          keyword: kword
          message: searches

  ifLoggedIn req, res, doIt, keyword: kword

# Unlike getSavedSearches we return the template values for
# use by the client to create the page

#This would also be a place to type the search, pub, vs observation, vs thrown, if
#needed

getSavedSearches2 = (req, res, next) ->
  kword = 'savedsearches'
  doIt = (loginid) ->
    redis_client.get "email:#{loginid}", (err, email) ->
      getSortedElementsAndScores false, "savedsearch:#{email}", (err2, searches) ->
        if err2?
          console.log "*** getSavedSearches2: failed for loginid=#{loginid} email=#{email} err=#{err2}"
          failedRequest res, keyword: kword
        else
          nowDate = new Date().getTime()
          view = createSavedSearchTemplates nowDate, searches.elements, searches.scores
          successfulRequest res,
            keyword: kword
            message: view

  ifLoggedIn req, res, doIt, keyword: kword

# We only return the document ids here; for the full document info
# see doSaved.

getSavedPubs = (req, res, next) ->
  kword = 'savedpubs'
  doIt = (loginid) ->
    redis_client.get "email:#{loginid}", (err, email) ->
      getSortedElements true, "savedpub:#{email}", (err2, searches) ->
        console.log "getSavedPubs reply=#{searches} err=#{err2}"
        successfulRequest res,
          keyword: kword
          message: searches

  ifLoggedIn req, res, doIt, keyword: kword

# Unlike getSavedPubs we return the template values for
# use by the client to create the page

getSavedPubs2 = (req, res, next) ->
  kword = 'savedpubs'
  doIt = (loginid) ->
    redis_client.get "email:#{loginid}", (err, email) ->
      getSortedElementsAndScores false, "savedpub:#{email}", (err2, savedpubs) ->
        if err2?
          console.log "*** getSavedPubs2: failed for loginid=#{loginid} email=#{email} err=#{err2}"
          failedRequest res, keyword: kword

        else
          pubkeys = savedpubs.elements
          pubtimes = savedpubs.scores
          redis_client.hmget "savedtitles:#{email}", pubkeys, (err2, pubtitles) ->
            redis_client.hmget "savedbibcodes:#{email}", pubkeys, (err3, bibcodes) ->
              nowDate = new Date().getTime()
              view = createSavedPubTemplates nowDate, pubkeys, bibcodes, pubtitles, pubtimes
              successfulRequest res,
                keyword: kword
                message: view

  ifLoggedIn req, res, doIt, keyword: kword

#Now do it for Observations
getSavedObsvs = (req, res, next) ->
  kword = 'savedobsvs'
  doIt = (loginid) ->
    redis_client.get "email:#{loginid}", (err, email) ->
      getSortedElements true, "savedobsv:#{email}", (err2, searches) ->
        console.log "getSavedObsvs reply=#{searches} err=#{err2}"
        successfulRequest res,
          keyword: kword
          message: searches

  ifLoggedIn req, res, doIt, keyword: kword

# Unlike getSavedPubs we return the template values for
# use by the client to create the page

getSavedObsvs2 = (req, res, next) ->
  kword = 'savedobsvs'
  doIt = (loginid) ->
    redis_client.get "email:#{loginid}", (err, email) ->
      getSortedElementsAndScores false, "savedobsv:#{email}", (err2, savedobsvs) ->
        if err2?
          console.log "*** getSavedObsvs2: failed for loginid=#{loginid} email=#{email} err=#{err2}"
          failedRequest res, keyword: kword

        else
          obsvkeys = savedobsvs.elements
          obsvtimes = savedobsvs.scores
          redis_client.hmget "savedobsvtitles:#{email}", obsvkeys, (err2, obsvtitles) ->
            redis_client.hmget "savedtargets:#{email}", obsvkeys, (err3, targets) ->
              nowDate = new Date().getTime()
              view = createSavedObsvTemplates nowDate, obsvkeys, targets, obsvtitles, obsvtimes
              successfulRequest res,
                keyword: kword
                message: view

  ifLoggedIn req, res, doIt, keyword: kword
# Remove the list of searchids, associated with the given
# user cookie, from Redis.
#
# At present we require that searchids not be empty; this may
# be changed.

removeSearches = (res, loginid, searchids) ->
  if searchids.length is 0
    console.log "ERROR: removeSearches called with empty searchids list; loginid=#{loginid}"
    failedRequest res
    return

  redis_client.get "email:#{loginid}", (err, email) ->
    key = "savedsearch:#{email}"
    # with Redis v2.4 we will be able to delete multiple keys with
    # a single zrem call
    margs = (['zrem', key, sid] for sid in searchids)
    redis_client.multi(margs).exec (err2, reply) ->
      console.log "Removed #{searchids.length} searches"
      successfulRequest res

# Similar to removeSearches but removes publications.

removeDocs = (res, loginid, docids) ->
  if docids.length is 0
    console.log "ERROR: removeDocs called with empty docids list; loginid=#{loginid}"
    failedRequest res
    return

  redis_client.get "email:#{loginid}", (err, email) ->
    console.log ">> removeDocs docids=#{docids}"
    pubkey = "savedpub:#{email}"
    titlekey = "savedtitles:#{email}"
    bibkey = "savedbibcodes:#{email}"

    # In Redis 2.4 zrem and hdel can be sent multiple keys
    margs1 = (['zrem', pubkey, docid] for docid in docids)
    margs2 = (['hdel', titlekey, docid] for docid in docids)
    margs3 = (['hdel', bibkey, docid] for docid in docids)
    margs = margs1.concat margs2, margs2
    redis_client.multi(margs).exec (err2, reply) ->
      console.log "Removed #{docids.length} pubs"
      successfulRequest res

removeObsvs = (res, loginid, docids) ->
  if docids.length is 0
    console.log "ERROR: removeDocs called with empty docids list; loginid=#{loginid}"
    failedRequest res
    return

  redis_client.get "email:#{loginid}", (err, email) ->
    console.log ">> removeObsvs docids=#{docids}"
    obsvkey = "savedobsv:#{email}"
    titlekey = "savedobsvtitles:#{email}"
    targetkey = "savedtargets:#{email}"
    # In Redis 2.4 zrem and hdel can be sent multiple keys
    margs1 = (['zrem', obsvkey, docid] for docid in docids)
    margs2 = (['hdel', titlekey, docid] for docid in docids)
    margs3 = (['hdel', targetkey, docid] for docid in docids)
    margs = margs1.concat margs2, margs2
    redis_client.multi(margs).exec (err2, reply) ->
      console.log "Removed #{docids.length} obsvs"
      successfulRequest res
# Create a function to delete a single search or publication
#   funcname is used to create a console log message of 'In ' + funcname
#     on entry to the function
#   idname is the name of the key used to identify the item to delete
#     in the JSON payload
#   delItems is the routine we call to delete multiple elements

deleteItem = (funcname, idname, delItems) ->
  return (payload, req, res, next) ->
    console.log ">> In #{funcname}"
    ifLoggedIn req, res, (loginid) ->
      jsonObj = JSON.parse payload
      delid = jsonObj[idname]
      console.log "deleteItem: logincookie=#{loginid} item=#{delid}"
      if delid?
        delItems res, loginid, [delid]
      else
        failedRequest res

# Needed to check whether we get a string or an array
# of strings. Taken from
# http://stackoverflow.com/questions/1058427/how-to-detect-if-a-variable-is-an-array/1058457#1058457
#
# Is there a more CoffeeScript way of doing this (aside from a basic translation
# to CoffeeScript)

isArray = `function (o) {
    return (o instanceof Array) ||
        (Object.prototype.toString.apply(o) === '[object Array]');
};`

# Create a function to delete multiple search or publication items
#   funcname is used to create a console log message of 'In ' + funcname
#     on entry to the function
#   idname is the name of the key used to identify the items to delete
#     in the JSON payload
#   delItems is the routine we call to delete multiple elements

deleteItems = (funcname, idname, delItems) ->
  return (payload, req, res, next) ->
    console.log ">> In #{funcname}"
    ifLoggedIn req, res, (loginid) ->
      terms = JSON.parse payload
      console.log ">> JSON payload=#{payload}"

      action = terms.action
      delids = if isArray terms[idname] then terms[idname] else [terms[idname]]

      if action is "delete" and delids.length > 0
        delItems res, loginid, delids
      else
        failedRequest res

exports.deleteSearch   = deleteItem "deleteSearch", "searchid", removeSearches
exports.deletePub      = deleteItem "deletePub",    "pubid",    removeDocs
exports.deleteObsv      = deleteItem "deleteObsv",    "obsvid",    removeObsvs

exports.deleteSearches = deleteItems "deleteSearches", "searchid", removeSearches
exports.deletePubs     = deleteItems "deletePubs",     "pubid",    removeDocs
exports.deleteObsvs     = deleteItems "deleteObsvs",     "obsvid",    removeObsvs

exports.saveSearch = saveSearch
exports.savePub = savePub
exports.saveObsv = saveObsv
exports.getSavedSearches = getSavedSearches
exports.getSavedSearches2 = getSavedSearches2
exports.getSavedPubs = getSavedPubs
exports.getSavedPubs2 = getSavedPubs2
exports.getSavedObsvs = getSavedObsvs
exports.getSavedObsvs2 = getSavedObsvs2

