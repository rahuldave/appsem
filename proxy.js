(function() {
  /*
  Simple proxy handling of requests.
  
  TODO:
    - an error during a proxied call to Solr does not result in
      firing the error handler, so we are obviously not
      catching things correctly, and need some indication of
      error to the caller.
  
  */
  var doProxy, doProxyPost, doTransformedProxy, http;
  http = require('http');
  doProxy = function(proxyoptions, req, res) {
    var proxy_request;
    console.log("--- proxy request " + req.method + " " + req.url);
    proxy_request = http.get(proxyoptions, function(proxy_response) {
      proxy_response.addListener('data', function(chunk) {
        return res.write(chunk, 'binary');
      });
      proxy_response.addListener('end', function() {
        return res.end();
      });
      return res.writeHead(proxy_response.statusCode, proxy_response.headers);
    }).on('error', function(e) {
      return console.log("ERROR during proxy: " + e.message);
    });
    req.addListener('data', function(chunk) {
      return proxy_request.write(chunk, 'binary');
    });
    return req.addListener('end', function() {
      return proxy_request.end();
    });
  };
  doProxyPost = function(proxyoptions, data, req, res) {
    var proxy_request;
    console.log("--- proxy request " + req.method + " " + req.url);
    proxy_request = http.request(proxyoptions, function(proxy_response) {
      proxy_response.addListener('data', function(chunk) {
        return res.write(chunk, 'binary');
      });
      proxy_response.addListener('end', function() {
        return res.end();
      });
      return res.writeHead(proxy_response.statusCode, proxy_response.headers);
    }).on('error', function(e) {
      return console.log("ERROR during proxy: " + e.message);
    });
    req.addListener('data', function(chunk) {
      return proxy_request.write(chunk, 'binary');
    });
    req.addListener('end', function() {
      return proxy_request.end();
    });
    req.write(data);
    return req.end();
  };
  doTransformedProxy = function(proxyoptions, req, res, transformcallback) {
    var completebuffer, proxy_request;
    console.log("--- transsformed proxy request " + req.method + " " + req.url);
    completebuffer = '';
    proxy_request = http.get(proxyoptions, function(proxy_response) {
      proxy_response.addListener('data', function(chunk) {
        return completebuffer += chunk;
      });
      proxy_response.addListener('end', function() {
        console.log('response.end');
        return res.end(transformcallback(completebuffer));
      });
      return res.writeHead(proxy_response.statusCode, proxy_response.headers);
    }).on('error', function(e) {
      return console.log("ERROR during transformed proxy: " + e.message);
    });
    req.addListener('data', function(chunk) {
      return proxy_request.write(chunk, 'binary');
    });
    return req.addListener('end', function() {
      return proxy_request.end();
    });
  };
  exports.doProxy = doProxy;
  exports.doProxyPost = doProxyPost;
  exports.doTransformedProxy = doTransformedProxy;
}).call(this);
