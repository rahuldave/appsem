(function() {
  var $, createMemberOfGroups, createMemberOfGroupsSection, createPendingInvitations, createPendingInvitationsSection, makeMemberOfGroupsSectionRow, makePendingInvitationsSectionRow, noMemberOfGroups, noPendingInvitations, submitDeleteAction, submitDeleteActionInvitations;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  $ = jQuery;
  submitDeleteAction = function(path, idname, recreate) {
    return function() {
      var data, datamap, ele, item, map, _i, _len;
      data = (function() {
        var _i, _len, _ref, _results;
        _ref = $(this).find('input[type=checkbox][checked|=true]');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          _results.push(item.value);
        }
        return _results;
      }).call(this);
      if (data.length === 0) {
        alert("No items have been selected.");
        return false;
      }
      datamap = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          ele = data[_i];
          _results.push({
            idname: ele
          });
        }
        return _results;
      })();
      for (_i = 0, _len = datamap.length; _i < _len; _i++) {
        map = datamap[_i];
        $.post(SITEPREFIX + path, JSON.stringify(map), function(resp) {
          recreate();
          return false;
        });
      }
      return false;
    };
  };
  createMemberOfGroups = function() {
    $('div#member_groups').empty();
    return $.getJSON(SITEPREFIX + '/memberofgroups', function(data) {
      var status;
      status = data.status === 'SUCCESS';
      if (status) {
        return createMemberOfGroupsSection(data.memberOfGroups);
      } else {
        return noMemberOfGroups();
      }
    });
  };
  makeMemberOfGroupsSectionRow = function(s) {
    var frag;
    frag = s.replace(/\//g, '-').replace('@', '_at_').replace(/\./g, '_dot_');
    return [$('<input type="checkbox" name="groupid"/>').attr('value', s), $('<a/>').attr('href', "" + SITEPREFIX + "/explorer/group?fqGroupName=" + s).text(s), $("<span id=\"mg_" + frag + "\">")];
  };
  createMemberOfGroupsSection = function(groups) {
    var $div, idx, ngroup, rows, s, _ref, _results;
    ngroup = groups.length;
    rows = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = groups.length; _i < _len; _i++) {
        s = groups[_i];
        _results.push(makeMemberOfGroupsSectionRow(s));
      }
      return _results;
    })();
    $div = $('div#member_groups');
    $div.append(AjaxSolr.theme('section_title', 'Groups you are a member of:'));
    $div.append(AjaxSolr.theme('section_items', 'member_groups', ['Group Name', 'Members'], rows));
    $('#member_groups-form').submit(submitDeleteAction('/removeoneselffromgroup', 'fqGroupName', createMemberOfGroups));
    _results = [];
    for (idx = 0, _ref = groups.length; 0 <= _ref ? idx < _ref : idx > _ref; 0 <= _ref ? idx++ : idx--) {
      _results.push($.getJSON(SITEPREFIX + ("/getmembersofgroup?fqGroupName=" + groups[idx]), __bind(function(idx) {
        return function(data) {
          var frag, grouptext;
          frag = groups[idx].replace(/\//g, '-').replace('@', '_at_').replace(/\./g, '_dot_');
          grouptext = data.getMembersOfGroup.join(', ');
          $("#mg_" + frag).text(grouptext);
          if (idx === (groups.length - 1)) {
            return $('#member_groups-table').tablesorter();
          }
        };
      }, this)(idx)));
    }
    return _results;
  };
  noMemberOfGroups = function() {
    $('div#member_groups').append(AjaxSolr.theme('saved_title', 'No Groups you are a member of'));
    return true;
  };
  submitDeleteActionInvitations = function(path, idname, recreate) {
    return function() {
      var data, datamap, ele, item, map, _i, _len;
      data = (function() {
        var _i, _len, _ref, _results;
        _ref = $(this).find('input[type=checkbox][checked|=true]');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          _results.push(item.value);
        }
        return _results;
      }).call(this);
      if (data.length === 0) {
        alert("No items have been selected.");
        return false;
      }
      datamap = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          ele = data[_i];
          _results.push({
            idname: ele
          });
        }
        return _results;
      })();
      for (_i = 0, _len = datamap.length; _i < _len; _i++) {
        map = datamap[_i];
        $.post(SITEPREFIX + path, JSON.stringify(map), function(resp) {
          recreate();
          return false;
        });
      }
      return false;
    };
  };
  createPendingInvitations = function() {
    $('div#member_groups').empty();
    return $.getJSON(SITEPREFIX + '/pendinginvitationtogroups', function(data) {
      var status;
      console.log(data);
      status = data.status === 'SUCCESS';
      if (status) {
        return createPendingInvitationsSection(data.pendingInvitationToGroups);
      } else {
        return noPendingInvitations();
      }
    });
  };
  makePendingInvitationsSectionRow = function(s) {
    var frag;
    frag = s.replace(/\//g, '-').replace('@', '_at_').replace(/\./g, '_dot_');
    return [$('<input type="checkbox" name="groupid"/>').attr('value', s), $('<a/>').attr('href', "" + SITEPREFIX + "/explorer/group?fqGroupName=" + s).text(s), $("<span id=\"pi_" + frag + "\">")];
  };
  createPendingInvitationsSection = function(groups) {
    var $div, idx, ngroup, rows, s, _ref, _results;
    console.log(groups);
    ngroup = groups.length;
    rows = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = groups.length; _i < _len; _i++) {
        s = groups[_i];
        _results.push(makePendingInvitationsSectionRow(s));
      }
      return _results;
    })();
    $div = $('div#pending_invitations');
    $div.append(AjaxSolr.theme('section_title', 'Groups you are invited to:'));
    $div.append(AjaxSolr.theme('section_items', 'pending_invitations', ['Group Name', 'Creator'], rows));
    $('#pending_invitations-form').submit(submitDeleteActionInvitations('/declineinvitationtogroup', 'fqGroupName', createPendingInvitations));
    _results = [];
    for (idx = 0, _ref = groups.length; 0 <= _ref ? idx < _ref : idx > _ref; 0 <= _ref ? idx++ : idx--) {
      _results.push($.getJSON(SITEPREFIX + ("/getgroupinfo?fqGroupName=" + groups[idx]), __bind(function(idx) {
        return function(data) {
          var frag, grouptext;
          frag = groups[idx].replace(/\//g, '-').replace('@', '_at_').replace(/\./g, '_dot_');
          grouptext = data.getGroupInfo.owner;
          console.log("pi_" + frag, $("#pi_" + frag), grouptext, $div);
          $("#pi_" + frag).text(grouptext);
          if (idx === (groups.length - 1)) {
            return $('#pending_invitations-table').tablesorter();
          }
        };
      }, this)(idx)));
    }
    return _results;
  };
  noPendingInvitations = function() {
    $('div#pending_invitations').append(AjaxSolr.theme('saved_title', 'No Pending Invitations To Groups'));
    return true;
  };
  mediator.subscribe('user/login', function(email) {
    createPendingInvitations();
    return createMemberOfGroups();
  });
}).call(this);
