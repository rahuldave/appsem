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

#Use this if you are logged in and we found an email for you
    

            
  
httpcallbackmaker = (req, res, next)->
    return (err, reply)->
        if err
            failedRequest res, err
        else
            if reply
                successfulRequest res, keyword: 'SUCCESS', message: reply
            else
                failedRequest res, keyword: 'FAILURE', message: 'undefined'
            
consolecallbackmaker = () ->
    return (err, reply) ->
        if err
            console.log 'ERROR', err
        else
            if reply
                console.log 'SUCCESS', reply
            else
                console.log 'FAILURE', reply
        
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
  
postHandlerWithJSON = (req, res, cb) ->
  console.log "oooooooooooooooooooooooooooooooooo"
  if req.method isnt 'POST'
    return false

  buffer = ''
  req.addListener 'data', (chunk) ->
    buffer += chunk
  req.addListener 'end', () ->
    console.log "cookies=#{req.cookies} payload=#{buffer}"
    cb JSON.parse(buffer), req, res

  return true

exports.completeRequest = completeRequest
exports.failedRequest = failedRequest
exports.successfulRequest = successfulRequest
exports.ifLoggedIn = ifLoggedIn

exports.postHandler = postHandler
exports.postHandlerWithJSON = postHandlerWithJSON
exports.consolecallbackmaker=consolecallbackmaker
exports.httpcallbackmaker=httpcallbackmaker
