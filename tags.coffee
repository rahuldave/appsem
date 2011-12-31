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

#notice that this dosent do all the saving in one transaction. this is a BUG. fix it in groups too.
_doSaveSearchToTag = (taggedBy, tagName, toBeTaggedSearches, searchtype, callback) ->
    saveTime = new Date().getTime()
    taggedtype="tagged#{searchtype}"
    allTagsHash = "tagged:#{taggedBy}:#{searchtype}"
    tagsForUser = "tags:#{taggedBy}"
    taggedAllSet="#{taggedtype}:#{tagName}"
    taggedUserSet="#{taggedtype}:#{taggedBy}:#{tagName}"
    savedUserSet="saved#{searchtype}:#{taggedBy}"
    #Bug: check if user has saved stuff first. Same problem in save to groups.
   
    tobeTaggedSearchesToUse=tobeTaggedSearches
    margs2=(['hget', allTagsHash, thesearch] for thesearch in toBeTaggedSearchesToUse)
    console.log "margs2", margs2
    redis_client.multi(margs2).exec (err4, tagJSONList) ->
        console.log "tagJSONList", tagJSONList, err4
        if err4
            return callback err4, tagJSONList
        #Should there be a condition here?    
        outJSON=[]
        outList=[]
        for tagJSON in tagJSONList
            if tagJSON is null
                taglist=[tagName]
            else
                taglist = JSON.parse tagJSON
                taglist.push(tagName) #we dont check for uniqueness, no sets in json 
            outJSON.push JSON.stringify(taglist)
            outList.push taglist
        console.log "outjsom", outlist, outJSON
        #outJSON is now COMPLETE set of tgs for these searches which I have ostensibly saved.
        redis_client.smembers "memberof:#{taggedBy}", (errb, mygroups) ->
            if errb
                return callback errb, mygroups
            #now we must figure which grouptaglists we must add to CONFUSING 
            mygroupslength=mygroups.length
            margs11=[]
            for ele in tobeTaggedSearchesToUse
                margs11=margs11.concat (['hget', "tagged:#{dagrp}:#{searchtype}", ele] for dagrp in mygroups)
            redis_client.multi(margs11).exec (err11, grouptagJSONList) ->
                console.log "tagJSONList", grouptagJSONList, err11
                if err4
                    return callback err11, grouptagJSONList
                #Should there be a condition here?    
                groupsearchList=({} for i in [0...toBeTaggedSearchesToUse.length])
                for idx in [0...toBeTaggedSearchesToUse.length]
                    #only do it if the search in question is in some groups
                    for jdx in [0...mygroupslength]
                        kdx=idx*mygroupslength+jdx
                        if grouptagJSONList[kdx] is null
                            taglist=[]
                        else
                            taglist = JSON.parse grouptagJSONList[kdx]
                        groupsearchList[idx][mygroups[jdx]]=taglist

                console.log "groupSearchList", groupSearchList    
                margs22=[]
                for ele in tobeTaggedSearchesToUse
                    margs22=margs22.concat (['hget', "savedBy:#{dagrp}", ele] for dagrp in mygroups)        
                console.log "<<<<<", margs22
                
                redis_client.multi(margs22).exec (err22, usergroupjsonlist) ->
                    if err22
                        return callback err22, usergroupjsonlist
                    margsgroupssetcmds=[]
                    for idx in [0...toBeTaggedSearchesToUse.length]
                        #only do it if the search in question is in some groups
                        for jdx in [0...mygroupslength]
                            kdx=idx*mygroupslength+jdx
                            currentGroup=mygroups[jdx]
                            currentSearchAndGroupList=groupSearchList[idx][currentGroup]
                            currentSearchAndUserList=outList[idx]
                            #Add user tags to group tags for this search and group combo..note only added if (a) this search was saved in this group and (b) u did it 
                            #non null here means this search was saved in that group but not necessarily by us
                            if usergroupjsonlist[kdx]
                                #in combination JSON let there be duplicates. We'll eliminate in clients. If more people save with same tag, there is some info there.
                                mergedList=currentSearchAndGroupList.concat currentSearchAndUserList
                                mergedJSON=JSON.stringify mergedList
                                parsedusers=JSON.parse usergroupjsonlist[kdx]
                                cmds=(['sadd', "#{taggedtype}:#{mygroups[jdx]}:#{tagName}", tobeTaggedSearchesToUse[idx]] for user in parsedusers when user is taggedBy)
                                tagscmds=(['sadd', "tags:#{mygroups[jdx]}", tagName] for user in parsedusers when user is taggedBy)
                                hashcmds=(['hset', "tagged:#{mygroups[jdx]}:#{searchtype}", tobeTaggedSearchesToUse[idx], mergedJSON] for user in parsedusers when user is taggedBy)
                                margsgroupssetcmds = margsgoupssetcmds.concat cmds
                                margsgroupssetcmds = margsgoupssetcmds.concat tagscmds
                                margsgroupssetcmds = margsgoupssetcmds.concat hashcmds
                    
                    margs3 = (['hset', allTagsHash, toBeTaggedSearches[i], outJSON[i]] for i in [0...toBeTaggedSearchesToUse.length])
                    console.log "margs3", margs3
                    margsi = (['sadd', taggedAllSet, savedSearch] for savedSearch in toBeTaggedSearchesToUse)
                    margsj = (['sadd', taggedUserSet, savedSearch] for savedSearch in toBeTaggedSearchesToUse)
                    margs = margs3.concat margsi
                    margs = margs.concat margsj
                    margs=margs.concat [['sadd', tagsForUser, tagName]]
                    margs=margs.concat margsgroupssetcmds
                    redis_client.multi(margs).exec  callback             

              
saveSearchesToTag = ({tagName, toBeTaggedSearches}, req, res, next) ->
  console.log __fname="saveSearchestoTag"
  ifHaveEmail __fname, req, res, (savedBy) ->
      # keep as a multi even though now a single addition
      _doSaveSearchToGroup savedBy, tagName, tobeTaggedSearches, 'search',  httpcallbackmaker(__fname, req, res, next)

      


savePubsToTag = ({tagName, toBeTaggedSearches}, req, res, next) ->
  console.log __fname="savePubsToTag"
  ifHaveEmail __fname, req, res, (savedBy) ->
     _doSaveSearchToGroup savedBy, tagName, toBeTaggedSearches, 'pub', httpcallbackmaker(__fname, req, res, next)
      

      
saveObsvsToTag = ({tagName, toBeTaggedSearches}, req, res, next) ->
  console.log __fname="saveObsvToTag"
  ifHaveEmail __fname, req, res, (savedBy) ->
      _doSaveSearchToGroup savedBy, tagName, tobeTaggedSearches, 'obsv', httpcallbackmaker(__fname, req, res, next)
            
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
createSavedSearchTemplates = (nowDate, searchkeys, searchtimes, searchbys, groupsin, tagsin) ->
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
        tagsin: tagsin[ctr]
        searchtext: searchToText key
        searchtime: time
        searchtimestr: timeToText nowDate, time
        searchctr: ctr
      return out

    view.savedsearches = (makeTemplate i for i in [0..nsearch-1])

  return view

createSavedPubTemplates = (nowDate, pubkeys, pubtimes, bibcodes, pubtitles, searchbys, groupsin, tagsin) ->
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
        tagsin: tagsin[ctr]
        linktext: pubtitles[ctr]
        linkuri: linkuri
        pubtime: pubtimes[ctr]
        pubtimestr: timeToText nowDate, pubtimes[ctr]
        bibcode: bibcode
        pubctr: ctr
      return out

    view.savedpubs = (makeTemplate i for i in [0..npub-1])

  return view

createSavedObsvTemplates = (nowDate, obsvkeys, obsvtimes, targets, obsvtitles, searchbys, groupsin, tagsin) ->
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
        tagsin: tagsin[ctr]
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
#seems the only thing that currently changes here is the initial set of searches.
_doSearchForTag = (email, tagName, searchtype, templateCreatorFunc, res, kword, callback, augmenthash=null) ->
    nowDate = new Date().getTime()
    taggedtype="tagged#{searchtype}"
    allTagsHash = "tagged:#{email}:#{searchtype}"
    taggedAllSet="#{taggedtype}:#{tagName}"
    taggedUserSet="#{taggedtype}:#{email}:#{tagName}"
    redis_client.smembers "memberof:#{email}", (err, groups) ->
        if err
            return callback err, groups
        #get this to work with normal sets o use sorted sets for tags 
        #out approach of intersecting all searches with searches by tag is not the best for large sets
        #optimize later.   
        redis_client.smembers taggedUserSet, (err2, searchreplies) ->
            if err2
                return callback err2, searchreplies
            getSortedElementsAndScores false, "saved#{searchtype}:#{email}", (err22, allsearches) ->
                if err22
                    return callback err22, allsearches
                searches={}
                searches.scores=[]
                searches.elements=[]
                for idx in [0...allsearches.elements]
                    if allsearches.elements[idx] in searchreplies
                        searches.elements.push(allsearches.elements[idx])
                        searches.scores.push(allsearches.scores[idx])
                #At this point searches reflects the tag but has all the scores from the sorted set    
                margs2=(['hget', "savedInGroups:#{searchtype}", ele] for ele in searches.elements)
                console.log "<<<<<", margs2
                redis_client.multi(margs2).exec (errg, groupjsonlist) ->
                    if errg
                        return callback errg, groupjsonlist
                    savedingroups=[]
                    for ele in groupjsonlist
                        if not ele
                            savedingroups.push([])
                        else
                            parsedgroups=JSON.parse ele
                            groupstoadd = (ele for ele in parsedgroups when ele in groups)
                            savedingroups.push(groupstoadd)
                    margs22=(['hget', allTagsHash, ele] for ele in searches.elements)
                    console.log "<<<<<", margs22
                    redis_client.multi(margs22).exec (errg22, tagjsonlist) ->
                        if errg22
                            return callback errg22, tagjsonlist
                        savedintags=[]
                        for ele in tagjsonlist
                            if not ele
                                savedintags.push([])
                            else
                                parsedtags=JSON.parse ele
                                tagstoadd = (ele for ele in parsedtags)
                                savedintags.push(tagstoadd)
                        #savedingroups = (JSON.parse (ele ? '[]') for ele in groupjsonlist)
                        console.log "<<<<<<<<<<<<<<<<>", savedingroups, savedintags
                        savedBys=(email for ele in searches.elements)
                        if augmenthash is null
                            view = templateCreatorFunc nowDate, searches.elements, searches.scores, savedBys, savedingroups, savedintags
                            callback err, view
                        else
                            if searches.elements.length == 0
                                titles=[]
                                names=[]
                                view = templateCreatorFunc nowDate, searches.elements, searches.scores, names, titles, savedBys, savedingroups, savedintags
                                return callback err, view
                            redis_client.hmget "saved#{augmenthash.titlefield}", searches.elements..., (err3, titles) ->
                                if err3
                                    console.log "titlefield error"
                                    return callback err3, titles
                                redis_client.hmget "saved#{augmenthash.namefield}", searches.elements..., (err4, names) ->
                                    if err4
                                        console.log "namefield error"
                                        return callback err4, names
                                    view = templateCreatorFunc nowDate, searches.elements, searches.scores, names, titles, savedBys, savedingroups, savedintags
                                    callback err4, view


_doSearchForTagInGroup = (email, tagName, fqGroupName, searchtype, templateCreatorFunc, res, kword, callback, augmenthash=null) ->
    nowDate = new Date().getTime()
    taggedtype="tagged#{searchtype}"
    allTagsHash = "tagged:#{email}:#{searchtype}"
    allTagsGroupHash = "tagged:#{fqGroupName}:#{searchtype}"
    taggedAllSet="#{taggedtype}:#{tagName}"
    taggedUserSet="#{taggedtype}:#{email}:#{tagName}"
    taggedGroupSet="#{taggedtype}:#{fqGroupName}:#{tagName}"
    redis_client.sismember "members:#{fqGroupName}", email, (erra, saved_p)->
            #should it be an error is user is not member of group? (thats what it is now)
            if erra
                return callback erra, saved_p
            if saved_p
                redis_client.smembers "memberof:#{email}", (errb, groups) ->
                    if errb
                        return callback errb, groups
                    redis_client.smembers "members:#{fqGroupName}", (errc, users) ->
                        if errc
                            return callback errc, users
                        redis_client.smembers taggedGroupSet  (err2, searchreplies) ->
                            if err2
                                return callback err2, searchreplies
                            getSortedElementsAndScores false, "saved#{searchtype}:#{fqGroupName}", (err22, allsearches) ->
                                if err22
                                    return callback err22, allsearches
                                searches={}
                                searches.scores=[]
                                searches.elements=[]
                                for idx in [0...allsearches.elements]
                                    if allsearches.elements[idx] in searchreplies
                                        searches.elements.push(allsearches.elements[idx])
                                        searches.scores.push(allsearches.scores[idx])
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
                                        margs22=(['hget', allTagsGroupHash, ele] for ele in searches.elements)
                                        console.log "<<<<<", margs22
                                        redis_client.multi(margs22).exec (errg22, tagjsonlist) ->
                                            if errg22
                                                return callback errg22, tagjsonlist
                                            savedintags=[]
                                            for ele in tagjsonlist
                                                if not ele
                                                    savedintags.push([])
                                                else
                                                    parsedtags=JSON.parse ele
                                                    tagstoadd = (ele for ele in parsedtags)
                                                    savedintags.push(tagstoadd)
                                            #savedingroups = (JSON.parse (ele ? '[]') for ele in groupjsonlist)
                                            console.log "<<<<<<<<<<<<<<<<>", savedingroups, savedintags
                                            if augmenthash is null
                                                view = templateCreatorFunc nowDate, searches.elements, searches.scores, savedBys, savedingroups, savedintags
                                                callback err, view
                                            else
                                                if searches.elements.length == 0
                                                    titles=[]
                                                    names=[]
                                                    view = templateCreatorFunc nowDate, searches.elements, searches.scores, names, titles, savedBys, savedingroups, savedintags
                                                    return callback err, view
                                                redis_client.hmget "saved#{augmenthash.titlefield}", searches.elements..., (err3, titles) ->
                                                    if err3
                                                        console.log "titlefield error"
                                                        return callback err3, titles
                                                    redis_client.hmget "saved#{augmenthash.namefield}", searches.elements..., (err4, names) ->
                                                        if err4
                                                            console.log "namefield error"
                                                            return callback err4, names
                                                        view = templateCreatorFunc nowDate, searches.elements, searches.scores, names, titles, savedBys, savedingroups, savedintags
                                                        callback err4, view
            else
              console.log "*** getSaved#{searchtype}ForGroup2: membership failed for email=#{email} err=#{erra}"
              return callback erra, saved_p
      
getSavedSearchesForTag = (req, res, next) ->
  kword = 'savedsearchesfortag'
  __fname=kword
  tagName = req.query.tagName
  fqGroupName = req.query.fqGroupName ? 'default'
  ifHaveEmail __fname, req, res, (email) ->
      if fqGroupName is 'default'
          _doSearchForTag email, tagName, 'search', createSavedSearchTemplates, res, kword, httpcallbackmaker(__fname, req, res, next)
      else
          _doSearchForTagInGroup email, tagName, fqGroupName, 'search', createSavedSearchTemplates, res, kword, httpcallbackmaker(__fname, req, res, next)
        
  


  
getSavedPubsForTag = (req, res, next) ->
  kword = 'savedpubsfortag'
  __fname=kword
  tagName = req.query.tagName
  fqGroupName = req.query.fqGroupName ? 'default'
  ifHaveEmail __fname, req, res, (email) ->
      if fqGroupName is 'default'
            _doSearchForTag email, tagName, 'pub', createSavedPubTemplates, res, kword, 
                httpcallbackmaker(__fname, req, res, next), {titlefield:'titles', namefield:'bibcodes'}
      else
            _doSearchForTagInGroup email, tagName, fqGroupName, 'pub', createSavedPubTemplates, res, kword, 
                httpcallbackmaker(__fname, req, res, next), {titlefield:'titles', namefield:'bibcodes'}



  
  
getSavedObsvsForTag = (req, res, next) ->
  kword = 'savedobsvsfortag'
  tagName = req.query.tagName
  fqGroupName = req.query.fqGroupName ? 'default'
  __fname=kword
  ifHaveEmail __fname, req, res, (email) ->
      if fqGroupName is 'default'
            _doSearchForTag email, tagName, 'obsv', createSavedObsvTemplates, res, kword, httpcallbackmaker(__fname, req, res, next),
                    {titlefield:'obsvtitles', namefield:'targets'}
      else
            _doSearchForTagInGroup email, tagName, fqGroupName, 'obsv', createSavedObsvTemplates, res, kword, httpcallbackmaker(__fname, req, res, next),
                    {titlefield:'obsvtitles', namefield:'targets'}

#GET
getTagsForUser = (req, res, next) ->
    kword='gettagsforuser'
    __fname=kword
    callback =  httpcallbackmaker(__fname, req, res, next)
    ifHaveEmail __fname, req, res, (email) ->
        redis_client.smembers "tags:#{email}", callback
        
getTagsForGroup = (req, res, next) ->
    kword='gettagsforgroup'
    __fname=kword
    wantedGroup=req.query.fqGroupName
    callback =  httpcallbackmaker(__fname, req, res, next)
    ifHaveEmail __fname, req, res, (email) ->
        redis_client.sismember "members:#{wantedGroup}", email, (err, reply) ->
            if err
                return callback err, reply
            if reply    
                redis_client.smembers "tags:#{wantedGroup}", callback
            else
                return callback err, reply
            
#BUG the bug where i can delete things of yours in a group (here in a tag) remains.
_doRemoveSearchesFromTag = (email, tagName, searchtype, searchids, callback) ->
    taggedtype="tagged#{searchtype}"
    allTagsHash = "tagged:#{taggedBy}:#{searchtype}"
    taggedAllSet="#{taggedtype}:#{tagName}"
    taggedUserSet="#{taggedtype}:#{taggedBy}:#{tagName}"

    margs=(['sismember', taggedUserSet, sid] for sid in searchids)

    # What about the nested multis..how does this affect atomicity?
    hashkeystodelete=[]

    redis_client.multi(margs).exec (err, replies) ->
        if err
            return callback err, replies
        #ranks=(rank for rank in replies when rank isnt 0)
        sididxs=(sididx for sididx in [0...replies.length] when replies[sididx] isnt 0)
        console.log "sididxs", sididxs
        mysidstodelete=(searchids[idx] for idx in sididxs)
        #Should error out here if null so that we can use that in UI to say you are not owner, or should we?
        margs2=(['hget', allTagsHash, searchids[idx]] for idx in sididxs)
        redis_client.multi(margs2).exec (errj, tagjsonlist) ->
            if errj
                return callback errj, tagjsonlist
            console.log "o>>>>>>>", searchids, tagjsonlist
            savedintags = (JSON.parse ele for ele in tagjsonlist)
            console.log "savedintags", savedintags
            newsavedtags=[]
            for taglist in savedintags
                console.log 'taglist', taglist
                newtaglist=[]
                newtaglist.push(ele) for ele in taglist when ele isnt tagName
                console.log 'newtaglist', newtaglist
                newsavedtags.push(newtaglist)
            
            newtagjsonlist = (JSON.stringify tlist for tlist in newsavedtags)
            #BUG if empty json array should we delete key in hash? (above and below this line)
            savedintagshashcmds=(['hset', allTagsHash, searchids[i], newtagjsonlist[i]] for i in sididxs)
            #Get those added by user to group from the given sids. I have substituted null for nil
            console.log "savedintagshashcmds", savedintagshashcmds
            
            
            margsuser = (['srem', taggedAllSet, sid] for sid in mysidstodelete)
            margsall = (['srem', taggedUserSet, sid] for sid in mysidstodelete)
            margsi=margsuser.concat margsall
            margs4=margsi.concat savedingroupshashcmds
            #Doing all the multis here together preserves atomicity since these are destructive
            #they should all be done or not at all
            console.log 'margs4',margs4
            redis_client.multi(margs4).exec callback
                    
removeSearchesFromTag = (email, tagName, searchids, callback) ->
    _doRemoveSearchesFromTag(email, tagName, 'search', searchids, callback)
    #if savedBy is you, you must be a menber of the group so dont test membership of group
    #shortcircuit by getting those searchids which the user herself has saved
    

removePubsFromTag = (email, tagName, docids, callback) ->
    _doRemoveSearchesFromGroup(email, tagName, 'pub', docids, callback)

      
removeObsvsFromTag = (email, tagName, obsids, callback) ->
   _doRemoveSearchesFromGroup(email, tagName, 'obsv', obsids, callback)


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
      tag=terms.tagName ? 'default'
      delids = if isArray terms.items then terms.items else [terms.items]

      if action is "delete" and delids.length > 0
        delItems email, tag, delids, httpcallbackmaker(funcname, req, res, next)
      else
        failedRequest res




#Currently, no delete tags from search, but thats another way to do it
exports.deleteSearchesFromTag = deleteItemsWithJSON "deleteSearchesFromTag", "searches", removeSearchesFromTag
exports.deletePubsFromTag     = deleteItemsWithJSON "deletePubsFromTag",     "pubs",    removePubsFromTag
exports.deleteObsvsFromTag     = deleteItemsWithJSON "deleteObsvsFromTag",     "obsvs",    removeObsvsFromTag

#Currently, no saveTagsToSearch, another way to do it, perhaps more intuitive
exports.saveSearchesToTag = saveSearchesToTag
exports.savePubsToTag = savePubsToTag
exports.saveObsvsToGroup = saveObsvsToTag

#For reporting functions, want (a) tags for a search (b) searches for a tag (of different kinds)
#(a) must be insinuated in via saved.coffee, like its done with groups. Later it could be made an api function.
exports.getSavedSearchesForTag = getSavedSearchesForTag

exports.getSavedPubsForTag = getSavedPubsForTag

exports.getSavedObsvsForTag = getSavedObsvsForTag

