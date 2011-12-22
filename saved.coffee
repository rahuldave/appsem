###
Handles saved items - e.g. searches and publications - that involves
accessing information from Redis.
###

redis_client = require("redis").createClient()

requests = require("./requests")
failedRequest = requests.failedRequest
successfulRequest = requests.successfulRequest
ifLoggedIn = requests.ifLoggedIn
httpcallbackmaker = requests.httpcallbackmaker

ifHaveEmail = (fname, req, res, cb, failopts = {}) ->
  ecb=httpcallbackmaker(fname, req, res)#no next
  ifLoggedIn req, res, (loginid) ->
    redis_client.get "email:#{loginid}", (err, email) ->
        if err
            return ecb err, email
        if email
            cb email
        else
            return ecb err, email
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

#each searchObject is {savedsearch|savedpub|savedobsv}
#practically i want users to have already saved an object to save it to a group
#in actuality i dont require it. and when i delete i dont check if user has individually
#saved it. we may want to patch that, or just let it be. TODO

_doSaveSearchToGroup = (savedBy, fqGroupName, savedhashlist, searchtype, callback) ->
    saveTime = new Date().getTime()
    savedtype="saved#{searchtype}"
    redis_client.sismember "members:#{fqGroupName}", savedBy, (err, is_member)->
        if err
            return callback err, is_member
        #BUG I do not check if user has saved stuff first. Shouldnt I do that?
        if is_member
            margs=(['hexists', "savedby:#{fqGroupName}", savedhash[savedtype]] for savedhash in savedhashlist)
            redis_client.multi(margs).exec (err2, replies) ->
                if err2
                    return callback err2, replies
                console.log 'REPLIES', replies, savedhashlist
                counter=0
                margs=[]
                savedSearches=[]
                for idx in [0...replies.length] when replies[idx] isnt 1
                    console.log "kkk", idx, replies[idx], savedhashlist[idx][savedtype]
                    counter=counter+1
                    savedSearch=savedhashlist[idx][savedtype]
                    savedSearches.push(savedSearch)
                    margsi = [
                      ['zadd', "saved#{searchtype}:#{savedBy}:#{fqGroupName}", saveTime, savedSearch],
                      ['zadd', "saved#{searchtype}:#{fqGroupName}", saveTime, savedSearch],
                      ['hset', "savedby:#{fqGroupName}", savedSearch, savedBy],
                    ]
                    margs = margs.concat margsi
                #console.log "MARGS", margs
                if counter is 0
                    console.log "These all have already been saved"
                    return callback err2, replies
                redis_client.multi(margs).exec (err3, reply) ->
                    console.log "3space", err3, reply
                    if err3
                        return callback err3, reply
                    margs2=(['hget', "savedInGroups:#{searchtype}", thesearch] for thesearch in savedSearches)
                    console.log "margs2", margs2
                    redis_client.multi(margs2).exec (err4, groupJSONList) ->
                        console.log "groupJSONList", groupJSONList, err4
                        if err4
                            return callback err4, groupJSONList
                        outJSON=[]
                        
                        for groupJSON in groupJSONList
                            if groupJSON is null
                                grouplist=[fqGroupName]
                            else
                                grouplist = JSON.parse groupJSON
                                grouplist.push(fqGroupName) #we dont check for uniqueness, no sets in json 
                            outJSON.push JSON.stringify(grouplist)
                        console.log "outjsom", outJSON, savedSearches
                        margs3 = (['hset', "savedInGroups:#{searchtype}", savedSearches[i], outJSON[i]] for i in [0...savedSearches.length])
                        console.log "margs3", margs3
                        redis_client.multi(margs3).exec  callback             
                
                
        else
            return callback err, is_member
              
saveSearchesToGroup = ({fqGroupName, objectsToSave}, req, res, next) ->
  console.log __fname="saveSearchestoGroup"
  ifHaveEmail __fname, req, res, (savedBy) ->
      # keep as a multi even though now a single addition
      _doSaveSearchToGroup savedBy, fqGroupName, objectsToSave, 'search',  httpcallbackmaker(__fname, req, res, next)

      
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

savePubsToGroup = ({fqGroupName, objectsToSave}, req, res, next) ->
  console.log __fname="savePubsToGroup"
  ifHaveEmail __fname, req, res, (savedBy) ->
     _doSaveSearchToGroup savedBy, fqGroupName, objectsToSave, 'pub', httpcallbackmaker(__fname, req, res, next)
      
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
      
      
saveObsvsToGroup = ({fqGroupName, objectsToSave}, req, res, next) ->
  console.log __fname="saveObsvToGroup"
  ifHaveEmail __fname, req, res, (savedBy) ->
      _doSaveSearchToGroup savedBy, fqGroupName, objectsToSave, 'obsv', httpcallbackmaker(__fname, req, res, next)
            
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
  #console.log "VIEW", view
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

getSavedSearches22 = (req, res, next) ->
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

#Current BUG: security issue--leaks all groups the item has been saved in, not just mine
_doSearch = (email, searchtype, templateCreatorFunc, res, kword, callback, augmenthash=null) ->
    nowDate = new Date().getTime()
    redis_client.smembers "memberof:#{email}", (err, groups) ->
        if err
            return callback err, groups
        getSortedElementsAndScores false, "saved#{searchtype}:#{email}", (err2, searches) ->
            if err2
                return callback err2, searches
            margs2=(['hget', "savedInGroups:#{searchtype}", ele] for ele in searches.elements)
            console.log "<<<<<", margs2
            redis_client.multi(margs2).exec (errg, groupjsonlist) ->
                if errg
                    return callback err, groupjsonlist
                savedingroups=[]
                for ele in groupjsonlist
                    if not ele
                        savedingroups.push([])
                    else
                        parsedgroups=JSON.parse ele
                        groupstoadd = (ele for ele in parsedgroups when ele in groups)
                        savedingroups.push(groupstoadd)
                        
                #savedingroups = (JSON.parse (ele ? '[]') for ele in groupjsonlist)
                console.log "<<<<<<<<<<<<<<<<>", savedingroups
                savedBys=(email for ele in searches.elements)
                if augmenthash is null
                    view = templateCreatorFunc nowDate, searches.elements, searches.scores, savedBys, savedingroups
                    callback err, view
                else
                    if searches.elements.length == 0
                        titles=[]
                        names=[]
                        view = templateCreatorFunc nowDate, searches.elements, searches.scores, names, titles, savedBys, savedingroups
                        return callback err, view
                    redis_client.hmget "saved#{augmenthash.titlefield}", searches.elements..., (err3, titles) ->
                        if err3
                            console.log "titlefield error"
                            return callback err3, titles
                        redis_client.hmget "saved#{augmenthash.namefield}", searches.elements..., (err4, names) ->
                            if err4
                                console.log "namefield error"
                                return callback err4, names
                            view = templateCreatorFunc nowDate, searches.elements, searches.scores, names, titles, savedBys, savedingroups
                            callback err4, view

getSavedPubs2 = (req, res, next) ->
  kword = 'savedpubs'
  __fname=kword
  ifHaveEmail __fname, req, res, (email) ->
      _doSearch email, 'pub', createSavedPubTemplates, res, kword, httpcallbackmaker(__fname, req, res, next), {titlefield:'titles', namefield:'bibcodes'}  
      
getSavedSearches2 = (req, res, next) ->
  kword = 'savedsearches'
  __fname=kword
  ifHaveEmail __fname, req, res, (email) ->
      _doSearch email, 'search', createSavedSearchTemplates, res, kword, httpcallbackmaker(__fname, req, res, next)
      
getSavedObsvs2 = (req, res, next) ->
  kword = 'savedobsvs'
  __fname=kword
  ifHaveEmail __fname, req, res, (email) ->
      _doSearch email, 'obsv', createSavedObsvTemplates, res, kword, httpcallbackmaker(__fname, req, res, next), {titlefield:'obsvtitles', namefield:'targets'}          
   
_doSearchForGroup = (email, fqGroupName, searchtype, templateCreatorFunc, res, kword, callback, augmenthash=null) ->
    nowDate = new Date().getTime()
    redis_client.sismember "members:#{fqGroupName}", email, (erra, saved_p)->
            #should it be an error is user is not member of group? (thats what it is now)
            if erra
                return callback erra, saved_p
            if saved_p
                redis_client.smembers "memberof:#{email}", (errb, groups) ->
                    if errb
                        return callback errb, groups
                    getSortedElementsAndScores false, "saved#{searchtype}:#{fqGroupName}", (err2, searches) ->
                        if err2
                            console.log "*** getSaved#{searchtype}ForGroup2: failed for email=#{email} err=#{err2}"
                            return callback err2, searches
                        console.log searchtype, 'searches.elements', searches.elements
                        margs=(['hget', "savedby:#{fqGroupName}", ele] for ele in searches.elements)
                        redis_client.multi(margs).exec (errm, savedBys) ->
                            if errm
                                return callback errm, savedBys
                            #searchbys=(reply for reply in replies)
                            margs2=(['hget', "savedInGroups:#{searchtype}", ele] for ele in searches.elements)
                            console.log "<<<<<#{searchtype}", margs2
                            redis_client.multi(margs2).exec (err, groupjsonlist) ->
                                if err
                                    return callback err, groupjsonlist
                                console.log ">>>>>>>#{searchtype}", searches.elements, groupjsonlist
                                savedingroups=[]
                                for ele in groupjsonlist
                                    if not ele
                                        savedingroups.push([])
                                    else
                                        parsedgroups=JSON.parse ele
                                        groupstoadd = (ele for ele in parsedgroups when ele in groups)
                                        savedingroups.push(groupstoadd)
                                #savedingroups = (JSON.parse ele for ele in groupjsonlist)
                                console.log "<<<<<<<<<<<<<<<<>", savedingroups
                                if augmenthash is null
                                    view = templateCreatorFunc nowDate, searches.elements, searches.scores, savedBys, savedingroups
                                    callback err, view
                                else
                                    if searches.elements.length == 0
                                        titles=[]
                                        names=[]
                                        view = templateCreatorFunc nowDate, searches.elements, searches.scores, names, titles, savedBys, savedingroups
                                        return callback err, view
                                    redis_client.hmget "saved#{augmenthash.titlefield}", searches.elements..., (err3, titles) ->
                                        if err3
                                            console.log "titlefield error"
                                            return callback err3, titles
                                        redis_client.hmget "saved#{augmenthash.namefield}", searches.elements..., (err4, names) ->
                                            if err4
                                                console.log "namefield error"
                                                return callback err4, names
                                            view = templateCreatorFunc nowDate, searches.elements, searches.scores, names, titles, savedBys, savedingroups
                                            callback err4, view
            else
              console.log "*** getSaved#{searchtype}ForGroup2: membership failed for email=#{email} err=#{erra}"
              return callback erra, saved_p
      
getSavedSearchesForGroup2 = (req, res, next) ->
  kword = 'savedsearchesforgroup'
  __fname=kword
  fqGroupName = req.query.fqGroupName
  ifHaveEmail __fname, req, res, (email) ->
      _doSearchForGroup email, fqGroupName, 'search', createSavedSearchTemplates, res, kword, httpcallbackmaker(__fname, req, res, next)
  
  

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

getSavedPubs22 = (req, res, next) ->
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
              view = createSavedPubTemplates nowDate, pubkeys, pubtimes, bibcodes, pubtitles, (email for ele in savedpubs.elements), (['default'] for ele in savedpubs.elements)
              successfulRequest res,
                keyword: kword
                message: view

  ifLoggedIn req, res, doIt, keyword: kword
  
getSavedPubsForGroup2 = (req, res, next) ->
  kword = 'savedpubsforgroup'
  __fname=kword
  fqGroupName = req.query.fqGroupName
  ifHaveEmail __fname, req, res, (email) ->
        _doSearchForGroup email, fqGroupName, 'pub', createSavedPubTemplates, res, kword, 
                httpcallbackmaker(__fname, req, res, next), {titlefield:'titles', namefield:'bibcodes'}



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

getSavedObsvs22 = (req, res, next) ->
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
  fqGroupName = req.query.fqGroupName
  __fname=kword
  ifHaveEmail __fname, req, res, (email) ->
        _doSearchForGroup email, fqGroupName, 'obsv', createSavedObsvTemplates, res, kword, httpcallbackmaker(__fname, req, res, next),
                    {titlefield:'obsvtitles', namefield:'targets'}

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

#BUG How about deletion from savedInGroups hash
_doRemoveSearchesFromGroup = (email, group, searchtype, searchids, callback) ->
    keyemail = "saved#{searchtype}:#{email}"
    keygroup = "saved#{searchtype}:#{group}"
    keyemailgroup = "saved#{searchtype}:#{email}:#{group}"
    keys4savedbyhash = "savedby:#{group}"
    savedingroupshash = "savedInGroups:#{searchtype}"

    margs=(['zrank', keyemailgroup, sid] for sid in searchids)

    # What about the nested multis..how does this affect atomicity?
    hashkeystodelete=[]

    redis_client.multi(margs).exec (err, replies) ->
        if err
            return callback err, replies
        ranks=(rank for rank in replies when rank isnt null)
        sididxs=(sididx for sididx in [0...replies.length] when replies[sididx] isnt null)
        console.log "sididxs", sididxs
        mysidstodelete=(searchids[idx] for idx in sididxs)
        #Should error out here if null so that we can use that in UI to say you are not owner, or should we?
        margs2=(['hget', savedingroupshash, searchids[idx]] for idx in sididxs)
        redis_client.multi(margs2).exec (errj, groupjsonlist) ->
            if errj
                return callback errj, groupjsonlist
            console.log "o>>>>>>>", searchids, groupjsonlist
            savedingroups = (JSON.parse ele for ele in groupjsonlist)
            console.log "savedingroups", savedingroups
            newsavedgroups=[]
            for grouplist in savedingroups
                console.log 'grouplist', grouplist
                newgrouplist=[]
                newgrouplist.push(ele) for ele in grouplist when ele is not group
                console.log 'newgrouplist', newgrouplist
                newsavedgroups.push(newgrouplist)
            
            newgroupjsonlist = (JSON.stringify glist for glist in newsavedgroups)
            #BUG if empty json array should we delete key in hash? (above and below this line)
            savedingroupshashcmds=(['hset', savedingroupshash, searchids[i], newgroupjsonlist[i]] for i in sididxs)
            #Get those added by user to group from the given sids. I have substituted null for nil
            console.log "savedingroupshashcmds", savedingroupshashcmds
            
            
            margsgroup = (['zremrangebyrank', keygroup, rid, rid] for rid in ranks)
            margsemailgroup = (['zremrangebyrank', keyemailgroup, rid, rid] for rid in ranks)
            hashkeystodelete = (['hdel', keys4savedbyhash, ele] for ele in mysidstodelete)
            margsi=margsgroup.concat margsemailgroup
            margs3=margsi.concat hashkeystodelete
            margs4=margs3.concat savedingroupshashcmds
            #Doing all the multis here together preserves atomicity since these are destructive
            #they should all be done or not at all
            console.log 'margs4',margs4
            redis_client.multi(margs4).exec callback
                    
removeSearchesFromGroup = (email, group, searchids, callback) ->
    _doRemoveSearchesFromGroup(email, group, 'search', searchids, callback)
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

removePubsFromGroup = (email, group, docids, callback) ->
    _doRemoveSearchesFromGroup(email, group, 'pub', docids, callback)


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
      
removeObsvsFromGroup = (email, group, obsids, callback) ->
   _doRemoveSearchesFromGroup(email, group, 'obsv', obsids, callback)
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

#terms = {action, fqGroupName?, [search|pub|obsv]}        
deleteItemsWithJSON = (funcname, idname, delItems) ->
  return (terms, req, res, next) ->
    console.log ">> In #{funcname}"
    ifHaveEmail funcname, req, res, (email) ->
      action = terms.action
      group=terms.fqGroupName ? 'default'
      delids = if isArray terms.items then terms.items else [terms.items]

      if action is "delete" and delids.length > 0
        delItems email, group, delids, httpcallbackmaker(funcname, req, res, next)
      else
        failedRequest res



    
exports.deleteSearch   = deleteItem "deleteSearch", "searchid", removeSearches
exports.deletePub      = deleteItem "deletePub",    "pubid",    removePubs
exports.deleteObsv      = deleteItem "deleteObsv",    "obsvid",    removeObsvs

exports.deleteSearches = deleteItems "deleteSearches", "searchid", removeSearches
exports.deletePubs     = deleteItems "deletePubs",     "pubid",    removePubs
exports.deleteObsvs     = deleteItems "deleteObsvs",     "obsvid",    removeObsvs

exports.deleteSearchesFromGroup = deleteItemsWithJSON "deleteSearchesFromGroup", "searches", removeSearchesFromGroup
exports.deletePubsFromGroup     = deleteItemsWithJSON "deletePubsFromGroup",     "pubs",    removePubsFromGroup
exports.deleteObsvsFromGroup     = deleteItemsWithJSON "deleteObsvsFromGroup",     "obsvs",    removeObsvsFromGroup

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

