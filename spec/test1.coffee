#!/usr/bin/env coffee
groups=require('../groups')
requests=require('../requests')
config=require('../config').config
request = require('request')
vows = require('vows')
should = require('should')

#groups.create_group 'rahuldave@gmail.com', 'huns', requests.consolecallbackmaker()
#groups.delete_group 'rahuldave@gmail.com', 'rahuldave@gmail.com/huns', requests.consolecallbackmaker()

#this will need to change
logincookie='logincookie=GJnUa6yclX8Z5ko1; path=/; expires=Sat, 08 Dec 2012 22:26:43 GMT'

startup = 
    topic: () -> 
        j=request.jar()
        c=request.cookie logincookie
        j.add c
        return j
    'should have one cookie': (topic)->
        topic.cookies.should.have.length 1

vows.describe("start and remove a group").addBatch
    'Adding Cookies to the cookie jar' : startup
    'A usual 42test':
        topic: 42
        'must be 42': (topic) -> topic.should.equal 42
.export(module)
