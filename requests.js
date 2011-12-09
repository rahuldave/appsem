(function() {
  /*
  Break out the request-handling code from server.js as
  we rewrite in CoffeeScript. It is turning into a bit of
  a grab bag of functionality.
  */
  var completeRequest, consolecallbackmaker, failedRequest, httpcallbackmaker, ifLoggedIn, postHandler, postHandlerWithJSON, successfulRequest;
  completeRequest = function(res, options, defoptions) {
    var defval, key, omsg, opts, out;
    console.log("In completeRequest", options);
    opts = {};
    for (key in defoptions) {
      defval = defoptions[key];
      opts[key] = key in options ? options[key] : defval;
    }
    res.writeHead(200, "OK", {
      'Content-Type': 'application/json'
    });
    out = {};
    out[opts.keyword] = opts.message;
    omsg = JSON.stringify(out);
    return res.end(omsg);
  };
  failedRequest = function(res, options) {
    if (options == null) {
      options = {};
    }
    return completeRequest(res, options, {
      keyword: 'success',
      message: 'undefined'
    });
  };
  successfulRequest = function(res, options) {
    if (options == null) {
      options = {};
    }
    return completeRequest(res, options, {
      keyword: 'success',
      message: 'defined'
    });
  };
  ifLoggedIn = function(req, res, cb, failopts) {
    var loginCookie;
    if (failopts == null) {
      failopts = {};
    }
    loginCookie = req.cookies.logincookie;
    if (loginCookie != null) {
      return cb(loginCookie);
    } else {
      return failedRequest(res, failopts);
    }
  };
  httpcallbackmaker = function(req, res, next) {
    return function(err, reply) {
      if (err) {
        return failedRequest(res, err);
      } else {
        if (reply) {
          return successfulRequest(res, {
            keyword: 'SUCCESS',
            message: reply
          });
        } else {
          return failedRequest(res, {
            keyword: 'FAILURE',
            message: 'undefined'
          });
        }
      }
    };
  };
  consolecallbackmaker = function() {
    return function(err, reply) {
      if (err) {
        return console.log('ERROR', err);
      } else {
        if (reply) {
          return console.log('SUCCESS', reply);
        } else {
          return console.log('FAILURE', reply);
        }
      }
    };
  };
  postHandler = function(req, res, cb) {
    var buffer;
    if (req.method !== 'POST') {
      return false;
    }
    buffer = '';
    req.addListener('data', function(chunk) {
      return buffer += chunk;
    });
    req.addListener('end', function() {
      return cb(buffer, req, res);
    });
    return true;
  };
  postHandlerWithJSON = function(req, res, cb) {
    var buffer;
    console.log("oooooooooooooooooooooooooooooooooo");
    if (req.method !== 'POST') {
      return false;
    }
    buffer = '';
    req.addListener('data', function(chunk) {
      return buffer += chunk;
    });
    req.addListener('end', function() {
      console.log("cookies=" + req.cookies + " payload=" + buffer);
      return cb(JSON.parse(buffer), req, res);
    });
    return true;
  };
  exports.completeRequest = completeRequest;
  exports.failedRequest = failedRequest;
  exports.successfulRequest = successfulRequest;
  exports.ifLoggedIn = ifLoggedIn;
  exports.postHandler = postHandler;
  exports.postHandlerWithJSON = postHandlerWithJSON;
  exports.consolecallbackmaker = consolecallbackmaker;
  exports.httpcallbackmaker = httpcallbackmaker;
}).call(this);
