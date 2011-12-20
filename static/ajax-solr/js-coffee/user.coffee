
$ = jQuery

submitDeleteAction = (path, idname, recreate, fqGroupName='default') ->
  return () ->
    data = (item.value for item in $(this).find('input[type=checkbox][checked|=true]'))
    if data.length is 0
      alert "No items have been selected."
      return false

    map = {}
    map.fqGroupName=fqGroupName
    $.post SITEPREFIX+path, JSON.stringify(map), (resp) ->
      recreate()
      return false

    return false

createMemberOfGroups = () ->
  $('div#member-groups').empty()
  $.getJSON SITEPREFIX + '/memberofgroups', (data) ->
    status = data.status is 'SUCCESS'
    if status
      createMemberOfGroupsSection data.memberOfGroups
    else
      noMemberOfGroups()
      
      
makeSectionRow = (s) ->
  [$('<input type="checkbox" name="groupid"/>').attr('value', s),
   $('<a/>').attr('href', "#{SITEPREFIX}/explorer/group?fqGroupName=#{s}").text(s),
   'Members']

#makeSearchText s.searchuri]

createMemberOfGroupsSection = (groups) ->
  ngroup = groups.length

  rows = (makeSectionRow s for s in groups)
  $div = $('div#member-groups')
  $div.append AjaxSolr.theme('section_title', 'Groups you are a member of:')
  $div.append AjaxSolr.theme('section_items', 'groups',
    ['Group Name', 'Members'], rows)
    #handleSearches(getBibTexFromADS),
    #handleSearches(saveToMyADS))

  $('#member-groups-form').submit submitDeleteAction('/removeoneselffromgroup', 'fqGroupName', createMemberOfGroups)
  $('#member-groups-table').tablesorter()


noMemberOfGroups = () ->
  $('div#member-groups').append AjaxSolr.theme('saved_title', 'No Groups you are a member of')
  return true      
  
  
mediator.subscribe 'user/login', (email) ->
  createMemberOfGroups()

  
