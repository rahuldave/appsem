#!/usr/bin/env coffee
#groups=require('../groups')
#requests=require('../requests')
config=require('../config').config
request = require('request')

testGlobal={}
#this will need to change
logincookie='logincookie=GJnUa6yclX8Z5ko1; path=/; expires=Sat, 08 Dec 2012 22:26:43 GMT'
makeCookieJar = () ->
    j=request.jar()
    c=request.cookie logincookie
    j.add c
    testGlobal.jar=j
    return j
#groups.create_group 'rahuldave@gmail.com', 'huns', requests.consolecallbackmaker()
#groups.delete_group 'rahuldave@gmail.com', 'rahuldave@gmail.com/huns', requests.consolecallbackmaker()
j = makeCookieJar()
requestdict=
    url:"http://localhost:3010#{config.SITEPREFIX}/deletegroup"
    jar:j
    body: JSON.stringify {fqGroupName:'rahuldave@gmail.com/huns'}
    
request.post requestdict, (error, response, body) ->
  #console.log error, response, body
  if error
    console.log error
  if not error and response.statusCode is 200 
    console.log(body) 
