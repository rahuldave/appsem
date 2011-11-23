(function() {
  /*
  Handle versioning and migration of the Redis database;
  a bit over-engineered for out current needs.
  */
  var currentVersion, finishedUpdate, schemaName, updateRedis, updater, validateRedis;
  schemaName = "dbversion";
  currentVersion = 1;
  /*
  
  Validate that the database is up to date. It will
  automatically update the contents of the Redis database
  (for which client is the output of createClient()
  from the redis module) to the latest version.
  
  A warning is logged if the version of the database
  is newer than supported.
  */
  validateRedis = function(client, cb) {
    return client.get(schemaName, function(err, reply) {
      var version;
      version = reply != null ? reply : 0;
      return updateRedis(client, version, cb);
    });
  };
  finishedUpdate = function(client, cb) {
    console.log("Finished updating Redis");
    return cb();
  };
  /*
  Simple way: delete everything!
  More complex, on a per user basis:
  
    for each saved search
      does it have a saved time
        yes: get time
        no:  create a time value and store it
    delete the saved search set
    create a sorted set for the saved searches,
    using the time values as the sort value
  
    for each saved publication
      does it have a saved time
        yes: get time
        no:  create a time value and store it
      hsetnx on the title to "Unknown title" (could query solr)
      Leave the bibcode as not going to query solr for it
    delete the saved publication set
    create a sorted set for the saved publications,
    using the time values as the sort value
  */
  updater = {};
  updater[0] = function(client, cb) {
    console.log("*** Updating to version 1: deleting everything.");
    return client.keys("*", function(err, reply) {
      var delkeys, margs;
      console.log("Deleting keys: " + reply);
      delkeys = reply.length === 0 ? [schemaName] : reply;
      margs = [["del", delkeys], ["set", schemaName, "1"]];
      return client.multi(margs).exec(function(err, reply) {
        return finishedUpdate(client, cb);
      });
    });
  };
  updateRedis = function(client, version, cb) {
    var now;
    now = new Date();
    console.log("" + (now.toUTCString()) + " - Redis database schema at version " + version);
    if (version < currentVersion) {
      return updater[version](client, cb);
    } else {
      if (version > currentVersion) {
        console.log("WARNING: Redis schema at version " + version + " but expected version " + currentVersion);
      }
      return cb();
    }
  };
  exports.validateRedis = validateRedis;
}).call(this);
