#!/usr/bin/env coffee

config=require('../config').config
request = require('request')
assert = require('assert')
vows = require('vows')
should = require('should')

#groups.create_group 'rahuldave@gmail.com', 'huns', requests.consolecallbackmaker()
#groups.delete_group 'rahuldave@gmail.com', 'rahuldave@gmail.com/huns', requests.consolecallbackmaker()

testGlobal={}
testGlobal.jar=null
#this will need to change
logincookie='logincookie=GJnUa6yclX8Z5ko1; path=/; expires=Sat, 08 Dec 2012 22:26:43 GMT'
makeCookieJar = () ->
    j=request.jar()
    c=request.cookie logincookie
    j.add c
    testGlobal.jar=j
    return j

getRequestOptions = (requestType, cookieJar, postHash) ->
    requestdict = 
        url:"http://localhost:3010#{config.SITEPREFIX}/#{requestType}group"
        jar: cookieJar
        body: JSON.stringify postHash
        
s1=vows.describe("start and remove a group")

s1.addBatch
    'buildup':
        topic: makeCookieJar()
        'a cookie jar with one cookie': (jar) -> 
            jar? and jar.cookies.should.have.length 1

s1.addBatch
    "add a group" :
        topic : () -> 
            requestdict = getRequestOptions 'create', testGlobal.jar, rawGroupName: 'huns'
            #request.post requestdict, (args...) -> console.log "hello", args
            request.post requestdict, @callback
            
        'group was created': (error, res, body) ->
            assert.equal(res.statusCode, 200)
            console.log res.statusCode

s1.export(module)

