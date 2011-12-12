should = require('should')
vows = require('vows')
assert = require('assert')

vows.describe("a test").addBatch 
    "test1" : 
        topic:42
        'should equal 42': (topic) -> topic.should.equal 42
.export(module)
