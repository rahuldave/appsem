#!/usr/bin/env coffee
#groups=require('../groups')
#requests=require('../requests')
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
logincookie='logincookie=GJnUa6yclX8Z5ko1; path=/; expires=Sat, 08 Dec 2012 22:26:43 GMT'
makeCookieJar = (cookie) ->
    j=request.jar()
    c=request.cookie cookie
    j.add c
    return j
#groups.create_group 'rahuldave@gmail.com', 'huns', requests.consolecallbackmaker()
#groups.delete_group 'rahuldave@gmail.com', 'rahuldave@gmail.com/huns', requests.consolecallbackmaker()
j = makeCookieJar(logincookie)
REQHEAD="http://localhost:3010#{config.SITEPREFIX}/"
logincookie2 = "logincookie=pgVFxRzAO3g3ls9X; path=/; expires=Thu, 13 Dec 2012 00:52:39 GMT"
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
                userNames: ['a@b.com', 'rdave@cfa.harvard.edu']
            , (e,r,b) -> 
                cbH(e,r,b)
                request.post
                    jar: j
                    url: REQHEAD+'removeinvitationfromgroup'
                    body: JSON.stringify
                            fqGroupName: 'rahuldave@gmail.com/huns'
                            userNames: ['a@b.com']
                    , (e,r,b) ->
                        cbH(e,r,b)
                        request.get
                            jar:j2
                            url: REQHEAD+'pendinginvitationtogroups'
                            , (e,r,b) ->
                                cbH(e,r,b)
                                request.post
                                    jar: j2
                                    url: REQHEAD+'acceptinvitationtogroup'
                                    body: JSON.stringify
                                            fqGroupName: 'rahuldave@gmail.com/huns'
                                    , (e,r,b) ->
                                        cbH(e,r,b)
                                        request.get
                                            jar:j2
                                            url: REQHEAD+'memberofgroups'
                                            , (e,r,b) ->
                                                cbH(e,r,b)
                                                request.get
                                                    jar:j2
                                                    url: REQHEAD+'getmembersofgroup?group=rahuldave@gmail.com/huns'
                                                    , (e,r,b) ->
                                                        cbH(e,r,b)
                                                        request.post
                                                            jar: j
                                                            url: REQHEAD+'changeownershipofgroup'
                                                            body: JSON.stringify
                                                                fqGroupName: 'rahuldave@gmail.com/huns'
                                                                newOwner: 'rdave@cfa.harvard.edu'
                                                            , (e,r,b) ->
                                                                cbH(e,r,b)
                                                                request.post
                                                                    jar: j2
                                                                    url: REQHEAD+'changeownershipofgroup'
                                                                    body: JSON.stringify
                                                                        fqGroupName: 'rahuldave@gmail.com/huns'
                                                                        newOwner: 'rahuldave@gmail.com'
                                                                    , (e,r,b) ->
                                                                        cbH(e,r,b)
                                                                        request.post
                                                                            jar: j
                                                                            url: REQHEAD+'removeuserfromgroup'
                                                                            body: JSON.stringify
                                                                                fqGroupName: 'rahuldave@gmail.com/huns'
                                                                                userNames: ['rdave@cfa.harvard.edu']
                                                                            , (e,r,b) ->
                                                                                cbH(e,r,b)
                                                                                request.post
                                                                                    jar: j
                                                                                    url: REQHEAD+'removeoneselffromgroup'
                                                                                    body: JSON.stringify
                                                                                        fqGroupName: 'rahuldave@gmail.com/huns'
                                                                                    , (e,r,b) ->
                                                                                        cbH(e,r,b)
                                                                                
                                                                            

