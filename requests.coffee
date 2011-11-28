###
Break out the request-handling code from server.js as
we rewrite in CoffeeScript. It is turning into a bit of
a grab bag of functionality.
###

# Actually create and finish the request. The options argument
# controls the choice of arguments and defoptions gives the default
# values. The current approach is probably too flexible for its
# needs but not flexible enough for expanded use.
#
# The return message is sent using the keyword value set
# to the message value.

completeRequest = (res, options, defoptions) ->
  console.log "In completeRequest", options
  opts = {}
  for key, defval of defoptions
    opts[key] = if key of options then options[key] else defval

  res.writeHead 200, "OK", 'Content-Type': 'application/json'
  out = {}
  out[opts.keyword] = opts.message
  omsg = JSON.stringify out
  res.end omsg


# The request failed so send back our generic "you failed" JSON
# payload.
#
# The options argument is used to set the name and value
# of the value returned;
#      keyword, defaults to 'success'
#      message, defaults to 'undefined'

failedRequest = (res, options = {}) ->
  completeRequest res, options,
    keyword: 'success'
    message: 'undefined'

# The request succeeded.
#
# The options argument is used to set the name and value
# of the value returned;
#      keyword, defaults to 'success'
#      message, defaults to 'defined'

successfulRequest = (res, options = {}) ->
  completeRequest res, options,
    keyword: 'success'
    message: 'defined'

# Call cb with the login cookie otherwise return
# a failed request with failopts.

ifLoggedIn = (req, res, cb, failopts = {}) ->
  loginCookie = req.cookies.logincookie
  if loginCookie?
    cb loginCookie
  else
    failedRequest res, failopts

# Handle a POST request by collecting all the
# data and then sending it to the callback
# as  cb(buffer, req, res)

postHandler = (req, res, cb) ->
  if req.method isnt 'POST'
    return false

  buffer = ''
  req.addListener 'data', (chunk) ->
    buffer += chunk
  req.addListener 'end', () ->
    cb buffer, req, res

  return true

exports.completeRequest = completeRequest
exports.failedRequest = failedRequest
exports.successfulRequest = successfulRequest
exports.ifLoggedIn = ifLoggedIn
exports.postHandler = postHandler
