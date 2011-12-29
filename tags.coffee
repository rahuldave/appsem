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


_doSaveSearchToTag = (taggedBy, tagName, taggedhashlist, searchtype, callback) ->
    saveTime = new Date().getTime()
    taggedtype="saved#{searchtype}"
    margs=(['hexists', "savedby:#{fqGroupName}", savedhash[taggedtype]] for savedhash in taggedhashlist)
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
              ['zadd', "tagged#{searchtype}:#{taggedBy}:#{tagName}", saveTime, savedSearch],
              ['zadd', "tagged#{searchtype}:#{tagName}", saveTime, savedSearch],
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

              
saveSearchesToTag = ({fqGroupName, objectsToSave}, req, res, next) ->
  console.log __fname="saveSearchestoGroup"
  ifHaveEmail __fname, req, res, (savedBy) ->
      # keep as a multi even though now a single addition
      _doSaveSearchToGroup savedBy, fqGroupName, objectsToSave, 'search',  httpcallbackmaker(__fname, req, res, next)

      


savePubsToTag = ({fqGroupName, objectsToSave}, req, res, next) ->
  console.log __fname="savePubsToGroup"
  ifHaveEmail __fname, req, res, (savedBy) ->
     _doSaveSearchToGroup savedBy, fqGroupName, objectsToSave, 'pub', httpcallbackmaker(__fname, req, res, next)
      

      
saveObsvsToTag = ({fqGroupName, objectsToSave}, req, res, next) ->
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
  
  


  
getSavedPubsForGroup2 = (req, res, next) ->
  kword = 'savedpubsforgroup'
  __fname=kword
  fqGroupName = req.query.fqGroupName
  ifHaveEmail __fname, req, res, (email) ->
        _doSearchForGroup email, fqGroupName, 'pub', createSavedPubTemplates, res, kword, 
                httpcallbackmaker(__fname, req, res, next), {titlefield:'titles', namefield:'bibcodes'}




  
  
getSavedObsvsForGroup2 = (req, res, next) ->
  kword = 'savedobsvsforgroup'
  fqGroupName = req.query.fqGroupName
  __fname=kword
  ifHaveEmail __fname, req, res, (email) ->
        _doSearchForGroup email, fqGroupName, 'obsv', createSavedObsvTemplates, res, kword, httpcallbackmaker(__fname, req, res, next),
                    {titlefield:'obsvtitles', namefield:'targets'}

#BUG How about deletion from savedInGroups hash
_doRemoveSearchesFromTag = (email, group, searchtype, searchids, callback) ->
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
                newgrouplist.push(ele) for ele in grouplist when ele isnt group
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
                    
removeSearchesTag = (email, group, searchids, callback) ->
    _doRemoveSearchesFromGroup(email, group, 'search', searchids, callback)
    #if savedBy is you, you must be a menber of the group so dont test membership of group
    #shortcircuit by getting those searchids which the user herself has saved
    

removePubsFromTag = (email, group, docids, callback) ->
    _doRemoveSearchesFromGroup(email, group, 'pub', docids, callback)

      
removeObsvsFromTag = (email, group, obsids, callback) ->
   _doRemoveSearchesFromGroup(email, group, 'obsv', obsids, callback)


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





exports.deleteSearchesFromGroup = deleteItemsWithJSON "deleteSearchesFromGroup", "searches", removeSearchesFromGroup
exports.deletePubsFromGroup     = deleteItemsWithJSON "deletePubsFromGroup",     "pubs",    removePubsFromGroup
exports.deleteObsvsFromGroup     = deleteItemsWithJSON "deleteObsvsFromGroup",     "obsvs",    removeObsvsFromGroup


exports.saveSearchesToGroup = saveSearchesToGroup
exports.savePubsToGroup = savePubsToGroup
exports.saveObsvsToGroup = saveObsvsToGroup


exports.getSavedSearches2 = getSavedSearches2
exports.getSavedSearchesForGroup2 = getSavedSearchesForGroup2

exports.getSavedPubs2 = getSavedPubs2
exports.getSavedPubsForGroup2 = getSavedPubsForGroup2

exports.getSavedObsvs2 = getSavedObsvs2
exports.getSavedObsvsForGroup2 = getSavedObsvsForGroup2

