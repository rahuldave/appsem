/*
 * Handle versioning and migration of the Redis database;
 * a bit over-engineered for out current needs.
 */

var schemeName = "dbversion"; // key storing the database scheme value
var currentVersion = 1; // the latest version of the database

/*
 * Validate that the database is up to date. It will
 * automatically update the contents of the Redis database
 * (for which client is the output of createClient()
 * from the redis module) to the latest version.
 *
 * A warning is logged if the version of the database
 * is newer than supported.
 */

function validateRedis(client, cb) {

    client.get(schemeName, function(err,reply) {
	var version;
	if (reply === null) { version = 0; } else { version = reply; }

	updateRedis(client, version, cb);
    });
    
}

var updater = {};

function finishedUpdate(client, cb) {
    console.log("Finished updating Redis");
    cb();
}

/*
 * Simple way: delete everything!
 * More complex, on a per user basis:
 *
 *   for each saved search
 *     does it have a saved time
 *       yes: get time
 *       no:  create a time value and store it
 *   delete the saved search set
 *   create a sorted set for the saved searches,
 *   using the time values as the sort value
 *
 *   for each saved publication
 *     does it have a saved time
 *       yes: get time
 *       no:  create a time value and store it
 *     hsetnx on the title to "Unknown title" (could query solr)
 *     Leave the bibcode as not going to query solr for it
 *   delete the saved publication set
 *   create a sorted set for the saved publications,
 *   using the time values as the sort value
 */  
updater[0] = function(client, cb) {
    
    console.log("*** Updating to version 1: deleting everything.");
    client.keys("*", function(err,reply){
	console.log("Deleting: ", reply);
	// since del does not like an empty array we fake up something
	// we do not mind getting deleted
	var delkeys;
	if (reply.length === 0) {
	    delkeys = [schemeName];
	} else {
	    delkeys = reply;
	}
	client.multi([["del", delkeys],
		      ["set", schemeName, "1"]
		     ]).exec(function(err,reply){
			 // callback to updater[1] once written.
			 finishedUpdate(client, cb);
		     });
    });

}

function updateRedis(client, version, cb) {
    console.log("Redis database scheme at version ", version);
    if (version < currentVersion) {
	updater[version](client, cb);
    } else {
	if (version > currentVersion) {
	    console.log("WARNING: Redis scheme at version ", version, " but expected version ", currentVersion);
	}
	cb();
    }
}

exports.validateRedis = validateRedis;

