
$ = jQuery

submitDeleteAction = (path, idname, recreate) ->
  return () ->
    data = (item.value for item in $(this).find('input[type=checkbox][checked|=true]'))
    if data.length is 0
      alert "No items have been selected."
      return false

    datamap= ({idname:ele} for ele in data)
    for map in datamap
        $.post SITEPREFIX+path, JSON.stringify(map), (resp) ->
          recreate()
          return false

    return false

createMemberOfGroups = () ->
  $('div#member_groups').empty()
  $.getJSON SITEPREFIX + '/memberofgroups', (data) ->
    status = data.status is 'SUCCESS'
    if status
      createMemberOfGroupsSection data.memberOfGroups
    else
      noMemberOfGroups()
      
      
makeMemberOfGroupsSectionRow = (s) ->
  frag=s.replace(/\//g, '-').replace('@', '_at_').replace(/\./g, '_dot_')
  [$('<input type="checkbox" name="groupid"/>').attr('value', s),
   $('<a/>').attr('href', "#{SITEPREFIX}/explorer/group?fqGroupName=#{s}").text(s),
   $("<span id=\"mg_"+frag+"\">")]

#makeSearchText s.searchuri]

createMemberOfGroupsSection = (groups) ->
  ngroup = groups.length

  rows = (makeMemberOfGroupsSectionRow s for s in groups)
  $div = $('div#member_groups')
  $div.append AjaxSolr.theme('section_title', 'Groups you are a member of:')
  $div.append AjaxSolr.theme('section_items', 'member_groups',
    ['Group Name', 'Members'], rows)
    #handleSearches(getBibTexFromADS),
    #handleSearches(saveToMyADS))

  $('#member_groups-form').submit submitDeleteAction('/removeoneselffromgroup', 'fqGroupName', createMemberOfGroups)
  for idx in [0...groups.length]
    $.getJSON SITEPREFIX+"/getmembersofgroup?fqGroupName=#{groups[idx]}", do (idx) =>
        (data)->
            frag=groups[idx].replace(/\//g, '-').replace('@', '_at_').replace(/\./g, '_dot_')
            grouptext=data.getMembersOfGroup.join ', '
            $("#mg_#{frag}").text grouptext
            $('#member_groups-table').tablesorter() if idx is (groups.length-1)


noMemberOfGroups = () ->
  $('div#member_groups').append AjaxSolr.theme('saved_title', 'No Groups you are a member of')
  return true      
  

submitDeleteActionInvitations = (path, idname, recreate) ->
  return () ->
    data = (item.value for item in $(this).find('input[type=checkbox][checked|=true]'))
    if data.length is 0
      alert "No items have been selected."
      return false

    datamap= ({idname:ele} for ele in data)
    for map in datamap
        $.post SITEPREFIX+path, JSON.stringify(map), (resp) ->
          recreate()
          return false

    return false

createPendingInvitations = () ->
  $('div#member_groups').empty()
  $.getJSON SITEPREFIX + '/pendinginvitationtogroups', (data) ->
    console.log data
    status = data.status is 'SUCCESS'
    if status
      createPendingInvitationsSection data.pendingInvitationToGroups
    else
      noPendingInvitations()
      
      
makePendingInvitationsSectionRow = (s) ->
  frag=s.replace(/\//g, '-').replace('@', '_at_').replace(/\./g, '_dot_')
  [$('<input type="checkbox" name="groupid"/>').attr('value', s),
   $('<a/>').attr('href', "#{SITEPREFIX}/explorer/group?fqGroupName=#{s}").text(s),
   $("<span id=\"pi_"+frag+"\">")]

#makeSearchText s.searchuri]

createPendingInvitationsSection = (groups) ->
  console.log groups
  ngroup = groups.length
  rows = (makePendingInvitationsSectionRow s for s in groups)
  $div = $('div#pending_invitations')
  $div.append AjaxSolr.theme('section_title', 'Groups you are invited to:')
  $div.append AjaxSolr.theme('section_items', 'pending_invitations',
    ['Group Name', 'Creator'], rows)
    #handleSearches(getBibTexFromADS),
    #handleSearches(saveToMyADS))
  $('#pending_invitations-form').submit submitDeleteActionInvitations('/declineinvitationtogroup', 'fqGroupName', createPendingInvitations)
  for idx in [0...groups.length]
      $.getJSON SITEPREFIX+"/getgroupinfo?fqGroupName=#{groups[idx]}", do (idx) =>
            (data)->
                frag=groups[idx].replace(/\//g, '-').replace('@', '_at_').replace(/\./g, '_dot_')
                grouptext=data.getGroupInfo.owner
                console.log "pi_#{frag}", $("#pi_#{frag}"), grouptext, $div
                $("#pi_#{frag}").text grouptext
                $('#pending_invitations-table').tablesorter() if idx is (groups.length-1)

 


noPendingInvitations = () ->
  $('div#pending_invitations').append AjaxSolr.theme('saved_title', 'No Pending Invitations To Groups')
  return true  
  
mediator.subscribe 'user/login', (email) ->
  createPendingInvitations()
  createMemberOfGroups()

  
