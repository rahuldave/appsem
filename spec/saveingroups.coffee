#server
logincookie='logincookie=GJnUa6yclX8Z5ko1; path=/; expires=Sat, 08 Dec 2012 22:26:43 GMT'
logincookie2 = "logincookie=M8LYoxFzGgUuy102; path=/; expires=Tue, 18 Dec 2012 21:36:08 GMT"

#laptop rahuldave
#logincookie="logincookie=UZvAydg61ejMlcf7; path=/; expires=Sat, 08 Dec 2012 14:12:33 GMT"
#logincookie2="logincookie=wa0ja5Kjj8mn5bDI; path=/; expires=Fri, 14 Dec 2012 15:42:20 GMT"
config=require('../config').config
request = require('request')
_=require('underscore')

extObj = (source, propdict) ->
    _.extend propdict, source
    return propdict

cbH = (error, response, body) ->   
    if error
        console.log error
    if not error and response.statusCode is 200 
        console.log body

       
testGlobal={}
#this will need to change
makeCookieJar = (cookie) ->
    j=request.jar()
    c=request.cookie cookie
    j.add c
    return j
#groups.create_group 'rahuldave@gmail.com', 'huns', requests.consolecallbackmaker()
#groups.delete_group 'rahuldave@gmail.com', 'rahuldave@gmail.com/huns', requests.consolecallbackmaker()
j = makeCookieJar(logincookie)
REQHEAD="http://localhost:3010#{config.SITEPREFIX}/"
j2= makeCookieJar(logincookie2)
    #body: JSON.stringify {rawGroupName:'huns'}
guard=1

fixtures={}
fixtures.searches=["publications#fq=keywords_s%3Aabsorption&q=*%3A*", "observations#fq=obsvtypes_s%3ACHANDRA%2FDDT&q=*%3A*"]
fixtures.savedsearches=({savedsearch:s} for s in fixtures.searches)
fixtures.pubs=["fd094ab3-0ac3-43dd-8657-59783c047072", "4f7f9768-c169-4448-ab3f-4d1b0f3831a7"]
fixtures.savedpubs=({savedpub:p} for p in fixtures.pubs)
fixtures.obsvs=["CHANDRA/13008", "CHANDRA/12502"]
fixtures.savedobsvs=({savedobsv:o} for o in fixtures.obsvs)
console.log fixtures

thingstype='obsvs'
things=fixtures[thingstype]
savedthings=fixtures["saved#{thingstype}"]

request.post 
    jar: j
    url: REQHEAD+'creategroup'
    body: JSON.stringify(rawGroupName:'huns')
    , (e,r,b)->
        cbH(e,r,b)
        request.post
            jar:j
            url: REQHEAD+'addinvitationtogroup'
            body: JSON.stringify
                fqGroupName: 'rahuldave@gmail.com/huns'
                userNames: ['rdave@cfa.harvard.edu']
            , (e,r,b) -> 
                cbH(e,r,b)
                request.post
                    jar: j2
                    url: REQHEAD+'acceptinvitationtogroup'
                    body: JSON.stringify
                            fqGroupName: 'rahuldave@gmail.com/huns'
                    , (e,r,b) ->
                        cbH(e,r,b)
                        request.post
                            jar: j2
                            url: REQHEAD+"save#{thingstype}togroup"
                            body: JSON.stringify
                                    fqGroupName: 'rahuldave@gmail.com/huns'
                                    objectsToSave: savedthings
                            , (e,r,b) ->
                                cbH(e,r,b)
                                request.get
                                    jar:j2
                                    url: REQHEAD+"saved#{thingstype}forgroup2?fqGroupName=rahuldave@gmail.com/huns"
                                    , (e,r,b) ->
                                        cbH(e,r,b)
"""                                        
                                        request.post
                                            jar: j2
                                            url: REQHEAD+"delete#{thingstype}fromgroup"
                                            body: JSON.stringify
                                                    fqGroupName: 'rahuldave@gmail.com/huns'
                                                    deltype: "#{thingstype}"
                                                    items: things
                                                    action:'delete'
                                            , (e,r,b) ->
                                                cbH(e,r,b)
"""
                                        
