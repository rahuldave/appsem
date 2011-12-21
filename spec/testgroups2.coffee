
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
logincookie2 = "logincookie=M8LYoxFzGgUuy102; path=/; expires=Tue, 18 Dec 2012 21:36:08 GMT"
#laptop
logincookie="logincookie=UZvAydg61ejMlcf7; path=/; expires=Sat, 08 Dec 2012 14:12:33 GMT"
logincookie2="logincookie=wa0ja5Kjj8mn5bDI; path=/; expires=Fri, 14 Dec 2012 15:42:20 GMT"
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
    
request.get 
    jar: j
    url: REQHEAD+'memberofgroups'
    , (e,r,b)->
        cbH(e,r,b)
                
request.post 
    jar: j
    url: REQHEAD+'creategroup'
    body: JSON.stringify(rawGroupName:'mongols')
    , (e,r,b)->
        cbH(e,r,b)
        
request.post 
    jar: j2
    url: REQHEAD+'creategroup'
    body: JSON.stringify(rawGroupName:'islanders')
    , (e,r,b)->
        cbH(e,r,b)
        request.post
            jar:j2
            url: REQHEAD+'addinvitationtogroup'
            body: JSON.stringify
                fqGroupName: 'rdave@cfa.harvard.edu/islanders'
                userNames: ['a@b.com', 'rahuldave@gmail.com']
            , (e,r,b) -> 
                cbH(e,r,b)
