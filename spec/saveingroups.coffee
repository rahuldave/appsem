#server
#logincookie='logincookie=GJnUa6yclX8Z5ko1; path=/; expires=Sat, 08 Dec 2012 22:26:43 GMT'
#logincookie2 = "logincookie=pgVFxRzAO3g3ls9X; path=/; expires=Thu, 13 Dec 2012 00:52:39 GMT"

#laptop rahuldave
logincookie="logincookie=UZvAydg61ejMlcf7; path=/; expires=Sat, 08 Dec 2012 14:12:33 GMT"
logincookie2="logincookie=wa0ja5Kjj8mn5bDI; path=/; expires=Fri, 14 Dec 2012 15:42:20 GMT"
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
                            url: REQHEAD+'savesearchestogroup'
                            body: JSON.stringify
                                    fqGroupName: 'rahuldave@gmail.com/huns'
                                    objectsToSave:[{savedsearch:"publications#fq=keywords_s%3Aabsorption&q=*%3A*"}, {savedsearch:"observations#fq=obsvtypes_s%3ACHANDRA%2FDDT&q=*%3A*"}]
                            , (e,r,b) ->
                                cbH(e,r,b)
                                request.get
                                    jar:j2
                                    url: REQHEAD+'savedsearchesforgroup2?fqGroupName=rahuldave@gmail.com/huns'
                                    , (e,r,b) ->
                                        cbH(e,r,b)
                                        request.post
                                            jar: j2
                                            url: REQHEAD+'deletesearchesfromgroup'
                                            body: JSON.stringify
                                                    fqGroupName: 'rahuldave@gmail.com/huns'
                                                    search:["publications#fq=keywords_s%3Aabsorption&q=*%3A*", "observations#fq=obsvtypes_s%3ACHANDRA%2FDDT&q=*%3A*"]
                                                    action:'delete'
                                            , (e,r,b) ->
                                                cbH(e,r,b)
                                        