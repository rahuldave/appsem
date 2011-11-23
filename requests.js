(function() {
  /*
  Break out the request-handling code from server.js as
  we rewrite in CoffeeScript. It is turning into a bit of
  a grab bag of functionality.
  */
  var completeRequest, failedRequest, ifLoggedIn, postHandler, successfulRequest;
  completeRequest = function(res, options, defoptions) {
    var defval, key, omsg, opts, out;
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
  exports.completeRequest = completeRequest;
  exports.failedRequest = failedRequest;
  exports.successfulRequest = successfulRequest;
  exports.ifLoggedIn = ifLoggedIn;
  exports.postHandler = postHandler;
}).call(this);
