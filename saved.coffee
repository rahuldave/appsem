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

_doSaveSearchToGroup = (savedBy, savedhashlist, searchtype, res) ->
    savedtype="saved#{searchtype}" 
    margs=(['hexists', "savedby:#{savedhash.savedgroup}", savedhash.savedsearch] for savedhash in savedhashlist)
    redis_client.multi(margs).exec (err, replies) ->
        for idx in [0...replies.length] when replies[idx] isnt 1
            savedSearch=savedhashlist[idx][savedtype]
            savedGroup=savedhashlist[idx].savedgroup
            redis_client.hget "savedInGroups:#{searchtype}", savedSearch, (err2, reply) ->
                if reply is 'nil'
                    groupJson=[savedGroup]
                else
                    groupJson = JSON.parse reply
                    groupJson.push(savedGroup) #we dont check for uniqueness
                margs = [
                  ['zadd', "saved#{searchtype}:#{savedBy}:#{savedGroup}", saveTime, savedSearch],
                  ['zadd', "saved#{searchtype}:#{savedGroup}", saveTime, savedSearch],
                  ['hset', "savedby:#{savedGroup}", savedSearch, savedBy],
                  ['hset', "savedInGroups:#{searchtype}", savedSearch, JSON.stringify groupJson]
                ]
                redis_client.multi(margs).exec (err2, reply) -> 
                    successfulRequest res
              
saveSearchesToGroup = (payload, req, res, next) ->
  console.log "In saveSearchtoGroup: cookies=#{req.cookies} payload=#{payload}"
  saveTime = new Date().getTime()

  ifLoggedIn req, res, (loginid) ->
    savedhashlist = JSON.parse payload
    redis_client.get "email:#{loginid}", (err, savedBy) ->
      # keep as a multi even though now a single addition
      _doSaveSearchToGroup(savedBy, savedhashlist, 'search',  res)

      
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
      margs = [['hset', "savedbibcodes", savedPub, bibCode],
               ['hset', "savedtitles", savedPub, title],
               ['zadd', "savedpub:#{email}", saveTime, savedPub]]
      redis_client.multi(margs).exec (err2, reply) -> successfulRequest res

savePubsToGroup = (payload, req, res, next) ->
  console.log "In savePubToGroup: cookies=#{req.cookies} payload=#{payload}"
  saveTime = new Date().getTime()

  ifLoggedIn req, res, (loginid) ->
    savedhashlist = JSON.parse payload

    redis_client.get "email:#{loginid}", (err, savedBy) ->
     _doSaveSearchToGroup(savedBy, savedhashlist, 'pub', res)
      
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
      margs = [['hset', "savedtargets", savedObsv, target],
               ['hset', "savedobsvtitles", savedObsv, title],
               ['zadd', "savedobsv:#{email}", saveTime, savedObsv]]
      redis_client.multi(margs).exec (err2, reply) -> successfulRequest res
      
      
saveObsvsToGroup = (payload, req, res, next) ->
  console.log "In saveObsvToGroup: cookies=#{req.cookies} payload=#{payload}"
  saveTime = new Date().getTime()

  ifLoggedIn req, res, (loginid) ->
    savedhashlist = JSON.parse payload

    redis_client.get "email:#{loginid}", (err, savedBy) ->
      _doSaveSearchToGroup(savedBy, savedhashlist, 'obsv', res)
            
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
createSavedSearchTemplates = (nowDate, searchkeys, searchtimes, searchbys, groupsin) ->
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
        searchby: searchbys[ctr]
        groupsin: groupsin[ctr]
        searchtext: searchToText key
        searchtime: time
        searchtimestr: timeToText nowDate, time
        searchctr: ctr
      return out

    view.savedsearches = (makeTemplate i for i in [0..nsearch-1])

  return view

createSavedPubTemplates = (nowDate, pubkeys, pubtimes, bibcodes, pubtitles, searchbys, groupsin) ->
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
        searchby: searchbys[ctr]
        groupsin: groupsin[ctr]
        linktext: pubtitles[ctr]
        linkuri: linkuri
        pubtime: pubtimes[ctr]
        pubtimestr: timeToText nowDate, pubtimes[ctr]
        bibcode: bibcode
        pubctr: ctr
      return out

    view.savedpubs = (makeTemplate i for i in [0..npub-1])

  return view

createSavedObsvTemplates = (nowDate, obsvkeys, obsvtimes, targets, obsvtitles, searchbys, groupsin) ->
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
        searchby: searchbys[ctr]
        groupsin: groupsin[ctr]
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
          view = createSavedSearchTemplates nowDate, searches.elements, searches.scores, (email for ele in searches.elements), (['default'] for ele in searches.elements)
          successfulRequest res,
            keyword: kword
            message: view

  ifLoggedIn req, res, doIt, keyword: kword

      
_doSearchForGroup = (email, wantedGroup, searchtype, templateCreatorFunc, res, kword, augmenthash=null) ->
    redis_client.sismember wantedGroup, email, (errm, saved_p)->
            #should it be an error is user is not member of group? (thats what it is now)
            if saved_p
              getSortedElementsAndScores false, "saved#{searchtype}:#{wantedGroup}", (err2, searches) ->
                if err2?
                  console.log "*** getSaved#{searchtype}ForGroup2: failed for email=#{email} err=#{err2}"
                  failedRequest res, keyword: kword
                else
                  #searchesjson=(JSON.parse sjson for sjson in searches.elements)
                  #searchelements=(jsonObj.savedSearch for jsonObj in searchesjson)

                  margs=(['hget', "savedby:#{wantedGroup}", ele] for ele in searches.elements)
                  redis_client.multi(margs).exec (err, replies) ->
                    searchbys=(reply for reply in replies)
                    nowDate = new Date().getTime()
                    margs2=(['hget', "savedinGroup:#{searchtype}", ele] for ele in searches.elements)
                    redis_client.multi(margs2).exec (err, replies) ->
                        savedingroups = (JSON.parse ele for ele in replies)
                        if augmenthash is null
                            view = templatecreatorFunc nowDate, searches.elements, searches.scores, searchbys, savedingroups
                            successfulRequest res,
                                keyword: kword
                                message: view
                        else
                            redis_client.hmget "saved#{augmenthash.titlefield}", searches.elements, (err2, titles) ->
                                redis_client.hmget "saved#{augmenthash.namefield}", searches.elements, (err3, names) ->
                                        view = templatecreatorFunc nowDate, searches.elements, searches.scores, names, titles, searchbys, savedingroups
                                        successfulRequest res,
                                            keyword: kword
                                            message: view
            else
              console.log "*** getSaved#{searchtype}ForGroup2: membership failed for email=#{email} err=#{errm}"
              failedRequest res, keyword: kword
      
getSavedSearchesForGroup2 = (req, res, next) ->
  kword = 'savedsearchesforgroup'
  doIt = (loginid) ->
    wantedGroup = req.query.wantedgroup
    redis_client.get "email:#{loginid}", (err, email) ->
        _doSearchForGroup(email, wantedGroup, 'search', createSavedSearchTemplates, res, kword)
        
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
          redis_client.hmget "savedtitles", pubkeys, (err2, pubtitles) ->
            redis_client.hmget "savedbibcodes", pubkeys, (err3, bibcodes) ->
              nowDate = new Date().getTime()
              view = createSavedPubTemplates nowDate, pubkeys, pubtimes, bibcodes, pubtitles,  (email for ele in savedpubs.elements), (['default'] for ele in savedpubs.elements)
              successfulRequest res,
                keyword: kword
                message: view

  ifLoggedIn req, res, doIt, keyword: kword
  
getSavedPubsForGroup2 = (req, res, next) ->
  kword = 'savedpubsforgroup'
  doIt = (loginid) ->
    wantedGroup = req.query.wantedgroup
    redis_client.get "email:#{loginid}", (err, email) ->
        _doSearchForGroup(email, wantedGroup, 'pub', createSavedPubTemplates, res, kword, {titlefield:'titles', namefield:'bibcodes'})


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
          redis_client.hmget "savedobsvtitles", obsvkeys, (err2, obsvtitles) ->
            redis_client.hmget "savedtargets", obsvkeys, (err3, targets) ->
              nowDate = new Date().getTime()
              view = createSavedObsvTemplates nowDate, obsvkeys, obsvtimes, targets, obsvtitles,  (email for ele in savedobsvs.elements), (['default'] for ele in savedobsvs.elements)
              successfulRequest res,
                keyword: kword
                message: view

  ifLoggedIn req, res, doIt, keyword: kword
  
  
getSavedObsvsForGroup2 = (req, res, next) ->
  kword = 'savedobsvsforgroup'
  doIt = (loginid) ->
    wantedGroup = req.query.wantedgroup
    redis_client.get "email:#{loginid}", (err, email) ->
        _doSearchForGroup(email, wantedGroup, 'obsv', createSavedObsvTemplates, res, kword, {titlefield:'obsvtitles', namefield:'targets'})

  ifLoggedIn req, res, doIt, keyword: kword
# Remove the list of searchids, associated with the given
# user cookie, from Redis.
#
# At present we require that searchids not be empty; this may
# be changed.

removeSearches = (res, loginid, group, searchids) ->
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

_doRemoveSearchesFromGroup = (email, group, searchtype, searchids, res) ->
    keyemail = "saved#{searchtype}:#{email}"
    keygroup = "saved#{searchtype}:#{group}"
    keyemailgroup = "saved#{searchtype}:#{email}:#{group}"
    key4savedbyhash = "savedby:#{group}"

    margs=(['zrank', keyemailgroup, sid] for sid in searchids)

    # What about the nested multis..how does this affect atomicity?
    hashkeystodelete=[]

    redis_client.multi(margs).exec (err, replies) ->
        #Get those added by user to group from the given sids
        ranks=(rank for rank in replies when rank isnt 'nil')
        sididxs=(sididx for sididx in [0...replies.length] when replies[sididx] isnt 'nil')
        mysidstodelete=(searchids[idx] for idx in sididxs)
        margsgroup = (['zremrangebyrank', keygroup, rid, rid] for rid in ranks)
        margsemailgroup = (['zremrangebyrank', keyemailgroup, rid, rid] for rid in ranks)
        margs2=margsgroup.concat margsemailgroup
        redis_client.multi(margs2).exec (err2, reply) ->
            console.log "Removed #{ranks.length} #{searchtype}s from group #{group}"
            #following dosent need to be here. but having it here: does it guarantee atomicity.
            #it would seem it dosent per se, except if upper delete errors, this wont be run
            hashkeystodelete = (['hdel', keys4savedbyhash, ele] for ele in mysidstodelete)
            redis_client.multi(hashkeystodelete).exec (err3, reply) ->
                console.log "Hash has been cleaned for #{searchtype}"
                successfulRequest res
                    
removeSearchesFromGroup = (res, loginid, group, searchids) ->
  if searchids.length is 0
    console.log "ERROR: removeSearches called with empty searchids list; loginid=#{loginid}"
    failedRequest res
    return
  
  redis_client.get "email:#{loginid}", (err, email) ->
    _doRemoveSearchesFromGroup(email, group, 'search', searchids, res)
    #if savedBy is you, you must be a menber of the group so dont test membership of group
    #shortcircuit by getting those searchids which the user herself has saved
    
# Similar to removeSearches but removes publications.

removePubs = (res, loginid, group, docids) ->
  if docids.length is 0
    console.log "ERROR: removePubs called with empty docids list; loginid=#{loginid}"
    failedRequest res
    return

  redis_client.get "email:#{loginid}", (err, email) ->
    console.log ">> removePubs docids=#{docids}"
    pubkey = "savedpub:#{email}"
    #titlekey = "savedtitles:#{email}"
    #bibkey = "savedbibcodes:#{email}"

    # In Redis 2.4 zrem and hdel can be sent multiple keys
    margs1 = (['zrem', pubkey, docid] for docid in docids)
    #margs2 = (['hdel', titlekey, docid] for docid in docids)
    #margs3 = (['hdel', bibkey, docid] for docid in docids)
    #margs = margs1.concat margs2, margs3
    margs=margs1
    redis_client.multi(margs).exec (err2, reply) ->
      console.log "Removed #{docids.length} pubs"
      successfulRequest res

removePubsFromGroup = (res, loginid, group, docids) ->
  if docids.length is 0
    console.log "ERROR: removePubsFromGroup called with empty docids list; loginid=#{loginid}"
    failedRequest res
    return

  redis_client.get "email:#{loginid}", (err, email) ->
    console.log ">> removePubsFromGroup docids=#{docids}"
    _doRemoveSearchesFromGroup(email, group, 'pub', docids, res)


removeObsvs = (res, loginid, group, docids) ->
  if docids.length is 0
    console.log "ERROR: removeObsvs called with empty docids list; loginid=#{loginid}"
    failedRequest res
    return

  redis_client.get "email:#{loginid}", (err, email) ->
    console.log ">> removeObsvs docids=#{docids}"
    obsvkey = "savedobsv:#{email}"
    # In Redis 2.4 zrem and hdel can be sent multiple keys: fix sometime
    margs1 = (['zrem', obsvkey, docid] for docid in docids)
    margs=margs1
    redis_client.multi(margs).exec (err2, reply) ->
      console.log "Removed #{docids.length} obsvs"
      successfulRequest res
      
removeObsvsFromGroup = (res, loginid, group, docids) ->
  if docids.length is 0
    console.log "ERROR: removeObsvsFromGroup called with empty docids list; loginid=#{loginid}"
    failedRequest res
    return

  redis_client.get "email:#{loginid}", (err, email) ->
   _doRemoveSearchesFromGroup(email, group, 'obsv', docids, res)
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
      group='default'
      console.log "deleteItem: logincookie=#{loginid} item=#{delid}"
      if delid?
        delItems res, loginid, group, [delid]
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
      group=terms.group ? 'default'
      delids = if isArray terms[idname] then terms[idname] else [terms[idname]]

      if action is "delete" and delids.length > 0
        delItems res, loginid, group, delids
      else
        failedRequest res

exports.deleteSearch   = deleteItem "deleteSearch", "searchid", removeSearches
exports.deletePub      = deleteItem "deletePub",    "pubid",    removePubs
exports.deleteObsv      = deleteItem "deleteObsv",    "obsvid",    removeObsvs

exports.deleteSearches = deleteItems "deleteSearches", "searchid", removeSearches
exports.deletePubs     = deleteItems "deletePubs",     "pubid",    removePubs
exports.deleteObsvs     = deleteItems "deleteObsvs",     "obsvid",    removeObsvs

exports.deleteSearchesFromGroup = deleteItems "deleteSearches", "searchid", removeSearchesFromGroup
exports.deletePubsFromGroup     = deleteItems "deletePubs",     "pubid",    removePubsFromGroup
exports.deleteObsvsFromGroup     = deleteItems "deleteObsvs",     "obsvid",    removeObsvsFromGroup

exports.saveSearch = saveSearch
exports.savePub = savePub
exports.saveObsv = saveObsv

exports.saveSearchesToGroup = saveSearchesToGroup
exports.savePubsToGroup = savePubsToGroup
exports.saveObsvsToGroup = saveObsvsToGroup

exports.getSavedSearches = getSavedSearches
exports.getSavedSearches2 = getSavedSearches2
exports.getSavedSearchesForGroup2 = getSavedSearchesForGroup2
exports.getSavedPubs = getSavedPubs
exports.getSavedPubs2 = getSavedPubs2
exports.getSavedPubsForGroup2 = getSavedPubsForGroup2
exports.getSavedObsvs = getSavedObsvs
exports.getSavedObsvs2 = getSavedObsvs2
exports.getSavedObsvsForGroup2 = getSavedObsvsForGroup2

