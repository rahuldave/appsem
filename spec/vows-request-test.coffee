request = require('request')
vows = require('vows')
assert = require('assert')

s1=vows.describe("test a call to google")

s1.addBatch
    "GET from google" :
        topic : () -> 
            request "http://www.google.com", @callback
            
        '200 OK comes back': (error, res, body) ->
            console.log res.statusCode
            assert.equal(res.statusCode, 200)


s1.export(module)
#s1.run()

