#!/usr/bin/env coffee
config=require('../config').config
request = require('request')

cbH = (error, response, body) ->   
    if error
        console.log error
    if not error and response.statusCode is 200 
        console.log body
#groups.create_group 'rahuldave@gmail.com', 'huns', requests.consolecallbackmaker()
#groups.delete_group 'rahuldave@gmail.com', 'rahuldave@gmail.com/huns', requests.consolecallbackmaker()

#this will need to change
logincookie='logincookie=GJnUa6yclX8Z5ko1; path=/; expires=Sat, 08 Dec 2012 22:26:43 GMT'


j=request.jar()
c=request.cookie logincookie
j.add c

REQHEAD="http://localhost:3010#{config.SITEPREFIX}/"
request.get
    jar:j
    url: REQHEAD+'getuser'
    , (e,r,b) ->
        cbH(e,r,b)