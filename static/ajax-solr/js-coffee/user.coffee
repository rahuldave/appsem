root = exports ? this
$ = jQuery

submitUnsubscribeGroupAction = (path, idname, recreate) ->
  return () ->
    data = (item.value for item in $(this).find('input[type=checkbox][checked|=true]'))
    if data.length is 0
      alert "No items have been selected."
      return false

    datamap= ({fqGroupName:ele} for ele in data)
    console.log "us", datamap
    for idx in [0...datamap.length]
        $.post SITEPREFIX+path, JSON.stringify(datamap[idx]), do (idx) ->
            (resp) ->
                console.log 'in unsubscribe', resp, idx, datamap.length
                recreate() if idx is (datamap.length-1)
                return false

    return false

handleInvites = (recreate) ->
    () ->
        console.log 'in stghi', $(this.form)
        groupsintext = (item.value for item in $(this.form).find('input[type=checkbox][checked|=true]'))
        if groupsintext.length is 0
          alert "No items have been selected."
          return false
        console.log "GROUPSINTEXT", groupsintext
        groups=groupsintext
        console.log $(this.form).find('.invitetext')
        invitestring=$($(this.form).find('.invitetext')[0]).val();
        userNames=invitestring.split(',')
        #Want a regex filtering here BUG
        for idx in [0...groups.length]
            data = {fqGroupName:groups[idx], userNames}
            $.post "#{SITEPREFIX}/addinvitationtogroup", JSON.stringify(data), do (idx) ->
                (resp) ->
                    console.log 'inav', resp, idx, groups.length
                    recreate() if idx is (groups.length-1)
                    return false
        return false

handleAccepts = (recreate) ->
    () ->
        console.log 'in stgha', $(this.form)
        groupsintext = (item.value for item in $(this.form).find('input[type=checkbox][checked|=true]'))
        if groupsintext.length is 0
          alert "No items have been selected."
          return false
        console.log "GROUPSINTEXT", groupsintext
        groups=groupsintext
        for idx in [0...groups.length]
            data = {fqGroupName:groups[idx]}
            $.post "#{SITEPREFIX}/acceptinvitationtogroup", JSON.stringify(data), do (idx) ->
                (resp) ->
                    console.log 'inava', resp, idx, groups.length
                    recreate() if idx is (groups.length-1)
                    return false
        return false
        
createMemberOfGroups = () ->
  $('div#member_groups').empty()
  $.getJSON SITEPREFIX + '/memberofgroups', (data) ->
    status = data.status is 'SUCCESS'
    if status and data.memberOfGroups.length > 0
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
  $div.append AjaxSolr.theme('section_title', 'Collaborations you are a member of:')
  $div.append AjaxSolr.theme('section_items', 'member_groups',
    ['Collaboration Name', 'Members'], rows)
    #handleSearches(getBibTexFromADS),
    #handleSearches(saveToMyADS))

  $('#member_groups-form').submit submitUnsubscribeGroupAction('/removeoneselffromgroup', 'fqGroupName', createMemberOfGroups)
  for idx in [0...groups.length]
    $.getJSON SITEPREFIX+"/getmembersofgroup?fqGroupName=#{groups[idx]}", do (idx) =>
        (data)->
            frag=groups[idx].replace(/\//g, '-').replace('@', '_at_').replace(/\./g, '_dot_')
            grouptext=data.getMembersOfGroup.join ', '
            #console.log grouptext
            $("#mg_#{frag}").text grouptext
            $('#member_groups-table').tablesorter() if idx is (groups.length-1)


noMemberOfGroups = () ->
  $('div#member_groups').append AjaxSolr.theme('section_title', 'No Collaborations you are a member of')
  return true      
  

submitDeleteActionInvitations = (path, idname, recreate) ->
  return () ->
    data = (item.value for item in $(this).find('input[type=checkbox][checked|=true]'))
    if data.length is 0
      alert "No items have been selected."
      return false

    datamap= ({fqGroupName:ele} for ele in data)
    for idx in [0...datamap.length]
        $.post SITEPREFIX+path, JSON.stringify(datamap[idx]), do (idx) ->
                (resp) ->
                    console.log 'in del invit', resp, idx, datamap.length
                    recreate() if idx is (datamap.length-1)
                    return false

    return false

createPendingInvitations = () ->
  $('div#pending_invitations').empty()
  $.getJSON SITEPREFIX + '/pendinginvitationtogroups', (data) ->
    console.log data
    status = data.status is 'SUCCESS'
    if status and data.pendingInvitationToGroups.length > 0
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
  $div.append AjaxSolr.theme('section_title', 'Collaborations you are invited to:')
  $div.append AjaxSolr.theme('section_items', 'pending_invitations',
    ['Collaboration Name', 'Creator'], rows, null, handleAccepts(refreshAll))
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
  $('div#pending_invitations').append AjaxSolr.theme('section_title', 'No Pending Invitations To Collaborations')
  return true  

submitDeleteActionOwnerGroups = (path, idname, recreate) ->
    return () ->
      data = (item.value for item in $(this).find('input[type=checkbox][checked|=true]'))
      if data.length is 0
        alert "No items have been selected."
        return false

      datamap= ({fqGroupName:ele} for ele in data)
      for idx in [0...datamap.length]
          $.post SITEPREFIX+path, JSON.stringify(datamap[idx]), do (idx) ->
            (resp) ->
                console.log 'in del invit', resp, idx, datamap.length
                recreate() if idx is (datamap.length-1)
                return false

      return false

createOwnerOfGroups = () ->
    $('div#owner_groups').empty()
    $.getJSON SITEPREFIX + '/ownerofgroups', (data) ->
      status = data.status is 'SUCCESS'
      if status and data.ownerOfGroups.length > 0
        createOwnerOfGroupsSection data.ownerOfGroups
      else
        noOwnerOfGroups()


makeOwnerOfGroupsSectionRow = (s) ->
    frag=s.replace(/\//g, '-').replace('@', '_at_').replace(/\./g, '_dot_')
    [$('<input type="checkbox" name="groupid"/>').attr('value', s),
     $('<a/>').attr('href', "#{SITEPREFIX}/explorer/group?fqGroupName=#{s}").text(s),
     $("<span id=\"og_"+frag+"\">"),
     $("<span id=\"ogi_"+frag+"\">")]

    #makeSearchText s.searchuri]

#BUG not clear if tablesorting happens when there are no invites
createOwnerOfGroupsSection = (groups) ->
    ngroup = groups.length

    rows = (makeOwnerOfGroupsSectionRow s for s in groups)
    $div = $('div#owner_groups')
    $div.append AjaxSolr.theme('section_title', 'Collaborations you are the owner of:')
    $div.append AjaxSolr.theme('section_items', 'owner_groups',
      ['Collaboration Name', 'Other Members', 'Invitations'], rows, handleInvites(refreshAll))
      #handleSearches(getBibTexFromADS),
      #handleSearches(saveToMyADS))

    $('#owner_groups-form').submit submitDeleteActionOwnerGroups('/deletegroup', 'fqGroupName', refreshAll)
    console.log "grpus", groups
    
    inviteremovehandler = () ->
        ietr=$(this).attr('id')
        fqGroupName=$(this).attr('group')
        userNames=[ietr[2...].replace('_at_','@').replace(/_dot_/g, '.')]
        data = {fqGroupName, userNames}
        $.post SITEPREFIX+'/removeinvitationfromgroup', JSON.stringify(data), (resp) ->
            console.log resp
            createOwnerOfGroups()
    $div.delegate 'a.xinvite', 'click', inviteremovehandler
    memberremovehandler = () ->
        metr=$(this).attr('id')
        userNames=[metr[2...].replace('_at_','@').replace(/_dot_/g, '.')]
        fqGroupName=$(this).attr('group')
        data = {fqGroupName, userNames}
        $.post SITEPREFIX+'/removeuserfromgroup', JSON.stringify(data), (resp) ->
            console.log resp
            createOwnerOfGroups()
    $div.delegate 'a.xmember', 'click', memberremovehandler
    for idx in [0...groups.length]
      $.getJSON SITEPREFIX+"/getmembersofgroup?fqGroupName=#{groups[idx]}", do (idx) =>
          (data)->
              console.log "data", data
              frag=groups[idx].replace(/\//g, '-').replace('@', '_at_').replace(/\./g, '_dot_')
              grouptextarray=(ele+' <a group="'+groups[idx]+'" id="m-'+ele.replace('@', '_at_').replace(/\./g, '_dot_')+'" class="xmember label important">x</a>' for ele in data.getMembersOfGroup when ele isnt root.email)
              grouptext=grouptextarray.join ', '
              $("#og_#{frag}").html grouptext
              #BUG: scope it
              #$('a.xmember').click memberremovehandler came twice
              cidx=idx
              $.getJSON SITEPREFIX+"/getinvitationstogroup?fqGroupName=#{groups[cidx]}", do (cidx) =>
                  (data2) ->
                      console.log "data2", data2
                      invitetextarray=(ele+' <a group="'+groups[cidx]+'" id="i-'+ele.replace('@', '_at_').replace(/\./g, '_dot_')+'" class="xinvite label important">x</a>' for ele in data2.getInvitationsToGroup)
                      invitetext=invitetextarray.join ', '
                      $("#ogi_#{frag}").html invitetext
                      #BUG scope it
                      #$('a.xinvite').click inviteremovehandler came twice
                      console.log(data2,cidx) if cidx is (groups.length-1)
                      $('#owner_groups-table').tablesorter() if cidx is (groups.length-1)


noOwnerOfGroups = () ->
    $('div#owner_groups').append AjaxSolr.theme('section_title', 'No Collaborations you are a owner of')
    return true

refreshAll = () ->
    createOwnerOfGroups()
    createPendingInvitations()
    createMemberOfGroups()
          
mediator.subscribe 'user/login', (email) ->
  root.email=email
  refreshAll()
  $('#welcome').text("Welcome, user #{email}!")

  
