###
Handle user login/out and checks.
###

connectutils = require('connect').utils
url = require 'url'
redis_client = require("redis").createClient()


makeLoginCookie = (cookiename,  cookievalue, days) ->
  secs = days * 24 * 60 * 60
  milisecs = secs * 1000

  # I've seen some funny behaviour with Date.now() so switching
  # to a more explicit method which has worked elsewhere, but is probably
  # not an issue here.
  # expdate = new Date(Date.now() + milisecs)
  #
  expdate = new Date(new Date().getTime() + milisecs)
  cookie = connectutils.serializeCookie cookiename, cookievalue, expires: expdate, path: '/'
  return unique: cookievalue, cookie: cookie, expdateinsecs: secs

loginUser = (req, res, next) ->
  redirect = url.parse(req.url, true).query.redirect
  currentToken = connectutils.uid 16
  adsurl = "http://adsabs.harvard.edu/cgi-bin/nph-manage_account?man_cmd=login&man_url=#{redirect}"
  startupCookie = makeLoginCookie 'startupcookie', currentToken, 0.005
  console.log "loginUser: REDIRECT=#{redirect}"

  # inline the responsedo closure that was in the original JavaScript
  res.writeHead 302, 'Redirect',
    'Set-Cookie': startupCookie.cookie
    Location: redirect

  res.statusCode = 302
  res.end()

logoutUser = (req, res, next) ->
  console.log "::: logoutCookies #{JSON.stringify req.cookies}"
  loginCookie = req.cookies.logincookie
  newLoginCookie = makeLoginCookie 'logincookie', loginCookie, -1
  redirect = url.parse(req.url, true).query.redirect
  redis_client.expire "email:#{loginCookie}", 0, (err, reply) ->
    res.writeHead 302, 'Redirect',
      'Set-Cookie': newLoginCookie.cookie
      Location: redirect
    res.statusCode = 302
    res.end()

insertUser = (jsonpayload, req, res, next) ->
  currentToken = connectutils.uid 16
  loginCookie = makeLoginCookie 'logincookie', currentToken, 365
  cookie = loginCookie.cookie

  # Seeing some errors here in CoffeeScript conversion that take
  # down the server, so add some defensive code.
  #
  console.log "insertUser payload=#{jsonpayload}"
  if "#{jsonpayload}" is "undefined" or not jsonpayload? or jsonpayload is ""
    console.log "@@ payload is undefined or empty!"
    res.writeHead 200, "OK",
      'Content-Type': 'application/json'
      'Set-Cookie': cookie
    res.end()
    return

  jsonObj = JSON.parse jsonpayload
  if not jsonObj.email?
    console.log "@@ payload has no email field!"
    res.writeHead 200, "OK",
      'Content-Type': 'application/json'
      'Set-Cookie': cookie
    res.end()
    return

  email = jsonObj.email

  mkeys = [['hset', email, 'dajson', jsonpayload]
           ['hset', email, 'cookieval', cookie]
          ]
  margs = (['hset', email, key, value] for key, value of jsonObj)
  redis_client.multi(margs.concat(mkeys)).exec()

  # Store the user details (the unique value and email) in sets to make it
  # easier to identify them later. This may not be needed. Also, should the
  # unique value have a time-to-live associated with it (and can this be done
  # within a set)?
  #
  # Since thenext set will be the last one the others will have completed.Not that it matters as we dont error handle right now.
  # redis_client.setex('auth:' + logincookie['unique'], logincookie['expdateinsecs'], logincookie['cookie']);
  # on the fly we will have savedsearches:email and savedpubs:email
  #
  #  redis_client.setex('email:' + logincookie['unique'], logincookie['expdateinsecs'], email, responsedo);
  #
  efunc = (err, reply) ->
    res.writeHead 200, "OK",
      'Content-Type': 'application/json'
      'Set-Cookie': cookie
    res.end()

  redis_client.multi([['sadd', 'useremails', email],
                      ['sadd', 'userids', loginCookie.unique],
			                ['setex', "email:#{loginCookie.unique}", loginCookie.expdateinsecs, email]
		       ]).exec(efunc)

getUser = (req, res, next) ->
  loginCookie = req.cookies.logincookie
  startupCookie = req.cookies.startupcookie
  sendback =
    startup: if startupCookie? then startupCookie else 'undefined'
    email: 'undefined'

  if not loginCookie?
    headerDict = 'Content-Type': 'application/json'
    if startupCookie?
      headerDict['Set-Cookie'] = makeLoginCookie('startupcookie', startupCookie, -1).cookie

    res.writeHead 200, 'OK', headerDict
    stashMail = JSON.stringify sendback
    console.log "getUser: no loginCookie, returning #{stashMail}"
    res.end stashMail
    return

  res.writeHead 200, 'OK', 'Content-Type': 'application/json'
  console.log "getUser: loginCookie=#{loginCookie}"
  redis_client.get "email:#{loginCookie}", (err, reply) ->
    if (err)
      # no user
      console.log "@@ getUser get email:#{loginCookie} failed with #{err}"
      next err
    else
      sendback.email = String reply
      stashMail = JSON.stringify sendback
      console.log "getUser: reply #{stashMail}"
      res.end stashMail


            
exports.loginUser = loginUser
exports.logoutUser = logoutUser
exports.insertUser = insertUser
exports.getUser = getUser

