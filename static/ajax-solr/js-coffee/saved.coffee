# Code for the saved page
#BUG: even though UI should stop double saving, is there server side code to prevent double saving?
# fancyboxOpts = autoDimensions: false, width: 1024, height: 768

$ = jQuery

Array::unique = ->
  output = {}
  output[@[key]] = @[key] for key in [0...@length]
  value for key, value of output
# Make a POST request to the ADS servers using the given
# URL path and apply the given callback to the response.

savemap=
    obsvs:'obsv'
    searches:'search'
    pubs:'pub'
    
doADSProxy = (urlpath, callback) ->
  $.post "#{SITEPREFIX}/adsproxy",
    JSON.stringify(urlpath: urlpath),
    callback

# Set up the 'Submit a delete' action for the table,
# where recreate is the function to call to recreate the
# section containing the table (including support for
# displaying 'no saved ...').

submitDeleteAction = (path, idname, recreate, groupName='default') ->
  return () ->
    data = (item.value for item in $(this).find('input[type=checkbox][checked|=true]'))
    if data.length is 0
      alert "No items have been selected."
      return false

    map = action: "delete"
    map.group=groupName
    map[idname] = data
    $.post SITEPREFIX+path, JSON.stringify(map), (resp) ->
      recreate()
      return false

    return false

# Given an array of bibcodes, get the BibTex entries from ADS
# and display to the user.

getBibTexFromADS = (bibcodes) ->
  # we wrap up the plain text returned by ADS since it is returned with
  # a content type of text/html
  doADSProxy '/cgi-bin/nph-bib_query?data_type=BIBTEX&' +
    bibcodes.map(encodeURIComponent).join('&'),
    (resp) ->
      $.fancybox "<pre>#{resp}</pre>"
      return false

# Given an array of bibcodes, send to myADS for saving in a library.

saveToMyADS = (bibcodes) ->
  doADSProxy '/cgi-bin/nph-abs_connect?library=Add&' +
    ("bibcode=#{encodeURIComponent(item)}" for item in bibcodes).join('&'),
    (resp) ->
      $.fancybox resp
      return false

# Handle a request for the publication table by getting the
# bibcodes of all selected items and passing them to the handler.

handlePublications = (handler) ->
  () ->
    data = ($(item).text() for item in $(this.form).find('input[type=checkbox][checked|=true]').parent().nextAll('td').find('span.bibcode'))

    if data.length is 0
      alert "No publications have been selected."
      return false

    $.fancybox.showActivity()
    handler data

handleItemsWithPK = (handler, itemstype, recreate) ->
    () ->
        console.log 'in stgh', itemstype, $(this.form)
        items = (item.value for item in $(this.form).find('input[type=checkbox][checked|=true]'))
        if items.length is 0
          alert "No items have been selected."
          return false
        thetype="saved#{savemap[itemstype]}"
        objectsToSave=[]
        for ele in items
            ihash={}
            ihash[thetype]=ele
            objectsToSave.push(ihash)
        console.log items, objectsToSave, $(this.form).find('.groupselect option:selected')
        fqGroupName=$(this.form).find('.groupselect option:selected')[0].text;
        if objectsToSave.length is 0
            alert "No #{itemstype} have been selected."
            return false
        data = {fqGroupName, objectsToSave}
        handler itemstype, data, recreate

saveToGroup = (itemstype, map, recreate) ->
    console.log "inwith", map, "#{SITEPREFIX}/save#{itemstype}togroup"
    $.post "#{SITEPREFIX}/save#{itemstype}togroup", JSON.stringify(map), (data) ->
        console.log "save rets", data
        recreate()
        return false
    return false
        
handleObservations = (handler) ->
  () ->
    data = ($(item).text() for item in $(this.form).find('input[type=checkbox][checked|=true]').parent().nextAll('td').find('span.bibcode'))

    if data.length is 0
      alert "No observations have been selected."
      return false

    $.fancybox.showActivity()
    handler data
# Handle a request for the search table by getting the
# bibcodes of all selected items and passing them to the handler.
#
# At present we restrict to a single search.

handleSearches = (handler) ->
  () ->
    data = (item.value for item in $(this.form).find('input[type=checkbox][checked|=true]'))

    ndata = data.length
    if ndata is 0
      alert "Please select one search."
      return false

    else if ndata > 1
      alert "Only one search can be retrieved at a time (you have selected #{ndata})"
      return false

    $.fancybox.showActivity()

    # TODO: We limit the search for now; really should page through the results.
    nrows = 100
    query = "#{SOLRURL}select?#{data[0]}&fl=bibcode&rows=#{nrows}&wt=json&json.wrf=?"

    $.getJSON query, (response) ->
      resp = response.response
      nf = resp.numFound
      if nf is 0
        $.fancybox.hideActivity()
        alert 'No publications found for this search.'
        return false

      else if nf > nrows
        alert "Warning: results restricted to #{nrows} of #{nf} publications."

      bibcodes = (doc.bibcode for doc in resp.docs)
      handler bibcodes

# Use the actual time value to sort the time column rather than
# the text, and the text for the other columns. A bit ugly.

tsortopts =
  headers:
    0:
      sorter: false

  textExtraction: (node) ->
    val = $(node).find('span').attr('value')
    val ? $(node).text()

# Get the list of saved searches (if any) and create the
# appropriate elements in the page.

createSavedSearches = () ->
  $('div#saved-searches').empty()
  $.getJSON SITEPREFIX + '/savedsearches2', (data) ->
    searches = data.savedsearches
    if searches.hassearches
      createSavedSearchSection searches.savedsearches
    else
      noSavedSearches()

# Get the list of saved publications (if any) and create the
# appropriate elements in the page.


# Create the saved searches table where searches is an array
# of objects with fields:
#   searchuri:      "fq=missions_s%3AMAST%2Feuve&q=*%3A*",
#   searchtime:     1314367771876
#   searchtimestr:  "Fri, 26 Aug 2011 14:09:31 GMT"
#   searchctr:      0

makeSearchText = (urifrag) ->
  scpts = searchToText urifrag, fieldname_map
  $search = $('<a/>').attr 'href', "#{SITEPREFIX}/explorer/publications##{urifrag}"
  dummy = ($search.append($('<div/>').text(scpt)) for scpt in scpts)
  return $search

makeSearchRow = (s) ->
  groupsintext = ('<a href="'+"#{SITEPREFIX}/explorer/group?fqGroupName=#{ele}"+'">'+ele.split('/').pop()+'</a>' for ele in s.groupsin.unique())
  scpts=searchToText s.searchuri, fieldname_map
  console.log s.searchtext, s.searchuri, scpts
  [$('<input type="checkbox" name="searchid"/>').attr('value', s.searchuri),
   $('<span/>').attr('value', s.searchtime).text(s.searchtimestr),
   $('<a/>').attr('href', "#{SITEPREFIX}/explorer/#{s.searchuri}")
     .text(scpts.join " | "),
   $('<span/>').html(groupsintext.join(', '))]

#makeSearchText s.searchuri]

createSavedSearchSection = (searches) ->
  nsearch = searches.length
  rows = (makeSearchRow s for s in searches)
  $div = $('div#saved-searches')
  $div.append AjaxSolr.theme('saved_title', 'Saved Searches')
  $div.append AjaxSolr.theme('saved_items', 'searches',
    ['Date saved', 'Search terms', 'Groups'], rows, handleItemsWithPK(saveToGroup, 'searches', createSavedSearches),
    null,
    null)
    #handleSearches(getBibTexFromADS),
    #handleSearches(saveToMyADS))

  $('#saved-searches-form').submit submitDeleteAction('/deletesearches', 'searchid', createSavedSearches)
  $('#saved-searches-table').tablesorter tsortopts

# Create the saved publications table where pubs is an array
# of objects with fields:
#   pubid:       "f779d03a-4865-4b45-80fc-344d51388ea5"
#   pubtime:     1314367771876
#   pubtimestr:  "Fri, 26 Aug 2011 14:09:31 GMT"
#   linkuri:     "bibcode%3A2004ApJ...606.1174B"
#   linktext:    "The O VI and C III Lines at 1032 and 977 Å in Hyades F Stars"
#   bibcode:     "2004ApJ...606.1174B"
#   pubctr:      22

createSavedPublications = () ->
  $('div#saved-pubs').empty()
  $.getJSON SITEPREFIX + '/savedpubs2', (data) ->
    console.log "DATA", data
    pubs = data.savedpubs
    if pubs.haspubs
      createSavedPublicationSection pubs.savedpubs
    else
      noSavedPublications()

makePubRow = (p) ->
  groupsintext = ('<a href="'+"#{SITEPREFIX}/explorer/group?fqGroupName=#{ele}"+'">'+ele.split('/').pop()+'</a>' for ele in p.groupsin.unique())
  [$('<input type="checkbox" name="pubid"/>').attr('value', p.pubid),
   $('<span/>').attr('value', p.pubtime).text(p.pubtimestr),
   $('<a/>').attr('href', "#{SITEPREFIX}/explorer/publications#fq=#{p.linkuri}&q=*%3A*")
     .text(p.linktext),
   $('<span class="bibcode"/>').text(p.bibcode),
   $('<span/>').html(groupsintext.join(', '))]

createSavedPublicationSection = (pubs) ->
  npubs = pubs.length

  rows = (makePubRow pub for pub in pubs)
  $div = $('div#saved-pubs')
  $div.append AjaxSolr.theme('saved_title', 'Saved Publications')
  $div.append AjaxSolr.theme('saved_items', 'pubs',
    ['Date saved', 'Title', 'Bibcode', 'Groups'], rows, handleItemsWithPK(saveToGroup, 'pubs', createSavedPublications),
    handlePublications(getBibTexFromADS),
    handlePublications(saveToMyADS))

  $('#saved-pubs-form').submit submitDeleteAction('/deletepubs', 'pubid', createSavedPublications)
  $('#saved-pubs-table').tablesorter tsortopts


createSavedObservations = () ->
  $('div#saved-obsvs').empty()
  $.getJSON SITEPREFIX + '/savedobsvs2', (data) ->
    obsvs = data.savedobsvs
    if obsvs.hasobsvs
      createSavedObservationSection obsvs.savedobsvs
    else
      noSavedObservations()

makeObsvRow = (o) ->
  groupsintext = ('<a href="'+"#{SITEPREFIX}/explorer/group?fqGroupName=#{ele}"+'">'+ele.split('/').pop()+'</a>' for ele in o.groupsin.unique())
  [$('<input type="checkbox" name="obsvid"/>').attr('value', o.obsvid),
   $('<span/>').attr('value', o.obsvtime).text(o.obsvtimestr),
   $('<a/>').attr('href', "#{SITEPREFIX}/explorer/observations#fq=#{o.linkuri}&q=*%3A*")
     .text(o.linktext),
   $('<span class="bibcode"/>').text(o.target),
   $('<span/>').html(groupsintext.join(', '))]

createSavedObservationSection = (obsvs) ->
  nobsvs = obsvs.length

  rows = (makeObsvRow obsv for obsv in obsvs)
  $div = $('div#saved-obsvs')
  $div.append AjaxSolr.theme('saved_title', 'Saved Observations')
  $div.append AjaxSolr.theme('saved_items', 'obsvs',
    ['Date Observed', 'Obsid', 'Target', 'Groups'], rows, handleItemsWithPK(saveToGroup, 'obsvs', createSavedObservations),
    null,
    null)

  $('#saved-obsvs-form').submit submitDeleteAction('/deleteobsvs', 'obsvid', createSavedObservations)
  $('#saved-obsvs-table').tablesorter tsortopts
# The user has no saved searches.

noSavedSearches = () ->
  $('div#saved-searches').append AjaxSolr.theme('saved_title', 'No saved searches')
  return true

# The user has no saved publications.

noSavedPublications = () ->
  $('div#saved-pubs').append AjaxSolr.theme('saved_title', 'No saved publications')
  return true

noSavedObservations = () ->
  $('div#saved-obsvs').append AjaxSolr.theme('saved_title', 'No saved observations')
  return true
# When a user logs in we need to create the saved search and publication
# tables.
#
#  TODO: synchronization on the showing of the tables?

mediator.subscribe 'user/login', (email) ->
  createSavedSearches()
  createSavedPublications()
  createSavedObservations()

# We do not need to hide/display things since this is handled by
#	the generic userloggedin/out classes, although we may decide that
#	that is not a good idea in the long term.

#mediator.subscribe 'user/logout', () -> alert("SAVE: User logout/no user.")

