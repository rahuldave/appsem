# Common code for AstroExplorer

root = exports ? this
$ = jQuery

root.SITEPREFIX = '/semantic2/alpha'
root.SOLRURL = "#{root.SITEPREFIX}/solr/"


# Taken from http://addyosmani.com/largescalejavascript/
makeConsole = () ->
   if typeof console is "undefined" or typeof console.log is "undefined"
    console = 
        log: () ->   

makeConsole()

makeMediator = () ->
  subscribe = (channel, fn) ->
    if not mediator.channels[channel]
      mediator.channels[channel] = []

    mediator.channels[channel].push
      context: this
      callback: fn

    return this

  publish = (channel, args...) ->
    if not mediator.channels[channel]
      return false

    for subscription in mediator.channels[channel]
      subscription.callback.apply subscription.context, args

    return this

  channels: {}
  publish: publish
  subscribe: subscribe
  installTo: (obj) ->
    obj.subscribe = subscribe
    obj.publish = publish

root.mediator = makeMediator()

# Given a facet name, return a human-readable version using the supplied
# namemap; if there is no mapping for this field, or the namemap
# is not suppleid then the input name is returned.
#
# It may be better to make some form of mapping object
# or hide the map within this routine, so you only end up
# sending the routine around.

root.cleanFacetName = (name, namemap) -> namemap[name] ? name

# Given a facet constraint remove Solr-specific features:
#    "..."    -> ...
#    [a TO a] -> a
#    [a TO b] -> a to b

root.cleanFacetValue = (label) ->
  if label is ""
    return label

  l = label.length
  firstChar = label[0]
  lastChar = label[l-1]

  if firstChar is '"' and lastChar is '"'
    return label.substr 1, l-2

  else if firstChar is '[' and lastChar is ']'
    idx = label.indexOf ' TO '
    if idx isnt -1
      label = label.substr 1, l-2
      return label
      #l = label.substr 0, idx-1
      #r = label.substr idx+3
      #if l == r
      #  return l
      #else
      #  return label

  return label

# Given a saved search, which looks something like
# "fq=keywords_s%3A%22stars%20luminosity%20function%3Bmass%20function%22&fq=author_s%3A%22Stahl%2C%20O%22&fq=instruments_s%3AMAST%2FIUE%2FLWR&q=*%3A*"
# return a (hopefully) human-readable version as an array of strings.
#
# We split up into name,value pairs for each constriant,
# then replace decoded characters in the value, and then
# try to clean up so that
#     name is human readable
#     Solr-specific punctation in the value is removed
# and combine constraints from the same field/name.
#
# namemap is the name mapping needed by cleanFacetName;
# it can be undefined.

root.searchToText = (searchTerm, namemap) ->
  # lazy way to remove the trailing search term
  s = "&#{searchTerm}".replace '&q=*%3A*', ''

  # only decode after the initial split to protect against the
  # unlikely event that &fq= appears as part of a search term.
  terms = s.split /fq=/
  console.log 'TERMS', terms
  terms.shift() # ignore the first entry as '' by construction
  out = {}
  for term in terms
    [name, value] = decodeURIComponent(term).split ':', 2
    value = cleanFacetValue value
    if name of out
      out[name].push value
    else
      out[name] = [value]

  ("#{cleanFacetName n, namemap}=#{v.join ','}" for n,v of out)


# Mapping between field name as used by Solr and the text we
# use to display to the user.
#
# Uses include cleanFacetName() and CurrentSearchWidget()
root.fieldname_map =
  keywords_s: 'Keyword'
  author_s: 'Author'
  objecttypes_s: 'Object Type'
  objectnames_s: 'Object Name'
  obsvtypes_s: 'Observation Type'
  obsids_s: 'Observation ID'
  instruments_s: 'Instrument'
  obsv_mission_s: 'Mission'
  missions_s: 'Mission'  # is missions_s still valid?
  emdomains_s: 'Wavelength'
  targets_s: 'Target Name'
  datatypes_s: 'Data Type'
  propids_s: 'Proposal ID'
  proposaltype_s: 'Proposal Type'
  proposalpi_s: 'Proposal PI'
  pubyear_i: 'Publication Year'
  ra_f: 'RA'
  dec_f: 'Dec'
  fov_f: 'Field of View'
  obsvtime_d: 'Observation Date'
  exptime_f: 'Exposure Time'
  data_collection_s: 'Data Collection'
  resolution_f: 'Spatial resolution'
  t_resolution_f: 'Temporal resolution'

setLoggedIn = (email) ->
  $('a#logouthref').text "logout #{email}"
  for elem in $('.userloggedin')
    $(elem).show()
  for elem in $('.userloggedout')
    $(elem).hide()

  mediator.publish 'user/login', email

setLoggedOut = () ->
  for elem in $('.userloggedout')
    $(elem).show()
  for elem in $('.userloggedin')
    $(elem).hide()

  mediator.publish 'user/logout'

myjsonp = (data) -> data

loginHandler = () ->
  #console.log '@@ in login handler'
  $.ajax
    url: "http://labs.adsabs.harvard.edu#{SITEPREFIX}/adsjsonp?callback=?"
    # url: "#{SITEPREFIX}/adsjsonp?callback=?"
    dataType: 'jsonp'
    jsonpcallback: myjsonp
    success: (data) ->
      #console.log "@@ loginHandler: data=#{JSON.stringify data}"
      if data.email? and data.email isnt ''
        #console.log "@@ add to redis: #{data.email}"
        $.post "#{SITEPREFIX}/addtoredis", JSON.stringify(data), () -> window.location.reload()

      else
        $('a#loginhref').click () ->
          page = window.location
          prefix = "#{page.protocol}//#{page.host}"
          loc = encodeURIComponent "#{prefix}#{SITEPREFIX}/login?redirect=#{window.location}"
          window.location.href = "http://adsabs.harvard.edu/cgi-bin/nph-manage_account?man_cmd=login&man_url=#{loc}"

        #console.log "@@ re-setting location for loginhref"
        $('a#loginhref').trigger 'click'

$ ->
  $('#gosearch').click () -> alert 'The search box is not implemented'

  # We allow multiple login links
  for elem in $('a.userlogin')
    $(elem).click loginHandler

  $('a#logouthref').click () ->
    loc = encodeURIComponent window.location
    window.location.href = "#{SITEPREFIX}/logout?redirect=#{loc}"

  $.getJSON "#{SITEPREFIX}/getuser", (data) ->
    #console.log "getuser call returned: #{JSON.stringify data}"
    if data.email? and data.email isnt '' and data.email isnt 'undefined'
      #console.log "Yeehah; we are logged in"
      setLoggedIn data.email

    else
      # User is not logged in according to our database, so check ADS.
      #
      if data.startup? and data.startup isnt 'undefined'
        #console.log "about to proxy to ADS"
        $.ajax
          url: "http://labs.adsabs.harvard.edu#{SITEPREFIX}/adsjsonp?callback=?"
          # url: "#{SITEPREFIX}/adsjsonp?callback=?"
          dataType: 'jsonp'
          jsonpcallback: myjsonp
          success: (adata) ->
            if adata.email? and adata.email isnt ''
              setLoggedIn adata.email
              # do we really need to add this back to Redis?
              $.post "#{SITEPREFIX}/addtoredis", JSON.stringify(adata)

            else
              setLoggedOut()

      else
        #console.log "Flat-out not logged in"
        setLoggedOut()
