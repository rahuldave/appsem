###
Simple proxy handling of requests.

TODO:
  - an error during a proxied call to Solr does not result in
    firing the error handler, so we are obviously not
    catching things correctly, and need some indication of
    error to the caller.

###

http = require 'http'

doProxy = (proxyoptions, req, res) ->
  console.log "--- proxy request #{req.method} #{req.url}"

  proxy_request = http.get(proxyoptions, (proxy_response) ->
    proxy_response.addListener 'data', (chunk) -> res.write chunk, 'binary'
    proxy_response.addListener 'end', () -> res.end()
    res.writeHead proxy_response.statusCode, proxy_response.headers
  ).on 'error', (e) -> console.log "ERROR during proxy: #{e.message}"

  # Is this needed? Original comment said "BELOW is not needed. presumably helps in POST"
  req.addListener 'data', (chunk) -> proxy_request.write chunk, 'binary'
  req.addListener 'end', () -> proxy_request.end()

    
doTransformedProxy = (proxyoptions, req, res, transformcallback) ->
  console.log "--- transsformed proxy request #{req.method} #{req.url}"

  completebuffer = ''

  proxy_request = http.get(proxyoptions, (proxy_response) ->
    proxy_response.addListener 'data', (chunk) -> completebuffer += chunk
    proxy_response.addListener 'end', () ->
      console.log 'response.end'
      res.end transformcallback(completebuffer)
    res.writeHead proxy_response.statusCode, proxy_response.headers
  ).on 'error', (e) -> console.log "ERROR during transformed proxy: #{e.message}"

  # Is the following still needed?
  req.addListener 'data', (chunk) -> proxy_request.write chunk, 'binary'
  req.addListener 'end', () -> proxy_request.end()

exports.doProxy = doProxy
exports.doTransformedProxy = doTransformedProxy
