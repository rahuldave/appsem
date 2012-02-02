(function() {
  var $, createMemberOfGroups, createMemberOfGroupsSection, createOwnerOfGroups, createOwnerOfGroupsSection, createPendingInvitations, createPendingInvitationsSection, handleAccepts, handleInvites, makeMemberOfGroupsSectionRow, makeOwnerOfGroupsSectionRow, makePendingInvitationsSectionRow, noMemberOfGroups, noOwnerOfGroups, noPendingInvitations, refreshAll, root, submitDeleteActionInvitations, submitDeleteActionOwnerGroups, submitUnsubscribeGroupAction;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  root = typeof exports !== "undefined" && exports !== null ? exports : this;
  $ = jQuery;
  submitUnsubscribeGroupAction = function(path, idname, recreate) {
    return function() {
      var data, datamap, ele, idx, item, _ref;
      data = (function() {
        var _i, _len, _ref, _results;
        _ref = $(this).find('input[type=checkbox]:checked');
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
            fqGroupName: ele
          });
        }
        return _results;
      })();
      console.log("us", datamap);
      for (idx = 0, _ref = datamap.length; 0 <= _ref ? idx < _ref : idx > _ref; 0 <= _ref ? idx++ : idx--) {
        $.post(SITEPREFIX + path, JSON.stringify(datamap[idx]), (function(idx) {
          return function(resp) {
            console.log('in unsubscribe', resp, idx, datamap.length);
            if (idx === (datamap.length - 1)) {
              recreate();
            }
            return false;
          };
        })(idx));
      }
      return false;
    };
  };
  handleInvites = function(recreate) {
    return function() {
      var data, groups, groupsintext, idx, invitestring, item, userNames, _ref;
      console.log('in stghi', $(this.form));
      groupsintext = (function() {
        var _i, _len, _ref, _results;
        _ref = $(this.form).find('input[type=checkbox]:checked');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          _results.push(item.value);
        }
        return _results;
      }).call(this);
      if (groupsintext.length === 0) {
        alert("No items have been selected.");
        return false;
      }
      console.log("GROUPSINTEXT", groupsintext);
      groups = groupsintext;
      console.log($(this.form).find('.invitetext'));
      invitestring = $($(this.form).find('.invitetext')[0]).val();
      userNames = invitestring.split(',');
      for (idx = 0, _ref = groups.length; 0 <= _ref ? idx < _ref : idx > _ref; 0 <= _ref ? idx++ : idx--) {
        data = {
          fqGroupName: groups[idx],
          userNames: userNames
        };
        $.post("" + SITEPREFIX + "/addinvitationtogroup", JSON.stringify(data), (function(idx) {
          return function(resp) {
            console.log('inav', resp, idx, groups.length);
            if (idx === (groups.length - 1)) {
              recreate();
            }
            return false;
          };
        })(idx));
      }
      return false;
    };
  };
  handleAccepts = function(recreate) {
    return function() {
      var data, groups, groupsintext, idx, item, _ref;
      console.log('in stgha', $(this.form));
      groupsintext = (function() {
        var _i, _len, _ref, _results;
        _ref = $(this.form).find('input[type=checkbox]:checked');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          _results.push(item.value);
        }
        return _results;
      }).call(this);
      if (groupsintext.length === 0) {
        alert("No items have been selected.");
        return false;
      }
      console.log("GROUPSINTEXT", groupsintext);
      groups = groupsintext;
      for (idx = 0, _ref = groups.length; 0 <= _ref ? idx < _ref : idx > _ref; 0 <= _ref ? idx++ : idx--) {
        data = {
          fqGroupName: groups[idx]
        };
        $.post("" + SITEPREFIX + "/acceptinvitationtogroup", JSON.stringify(data), (function(idx) {
          return function(resp) {
            console.log('inava', resp, idx, groups.length);
            if (idx === (groups.length - 1)) {
              recreate();
            }
            return false;
          };
        })(idx));
      }
      return false;
    };
  };
  createMemberOfGroups = function() {
    $('div#member_groups').empty();
    return $.getJSON(SITEPREFIX + '/memberofgroups', function(data) {
      var status;
      status = data.status === 'SUCCESS';
      if (status && data.memberOfGroups.length > 0) {
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
    $div.append(AjaxSolr.theme('section_title', 'Collaborations you are a member of:'));
    $div.append(AjaxSolr.theme('section_items', 'member_groups', ['Collaboration Name', 'Members'], rows));
    $('#member_groups-form').submit(submitUnsubscribeGroupAction('/removeoneselffromgroup', 'fqGroupName', createMemberOfGroups));
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
    $('div#member_groups').append(AjaxSolr.theme('section_title', 'No Collaborations you are a member of'));
    return true;
  };
  submitDeleteActionInvitations = function(path, idname, recreate) {
    return function() {
      var data, datamap, ele, idx, item, _ref;
      data = (function() {
        var _i, _len, _ref, _results;
        _ref = $(this).find('input[type=checkbox]:checked');
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
            fqGroupName: ele
          });
        }
        return _results;
      })();
      for (idx = 0, _ref = datamap.length; 0 <= _ref ? idx < _ref : idx > _ref; 0 <= _ref ? idx++ : idx--) {
        $.post(SITEPREFIX + path, JSON.stringify(datamap[idx]), (function(idx) {
          return function(resp) {
            console.log('in del invit', resp, idx, datamap.length);
            if (idx === (datamap.length - 1)) {
              recreate();
            }
            return false;
          };
        })(idx));
      }
      return false;
    };
  };
  createPendingInvitations = function() {
    $('div#pending_invitations').empty();
    return $.getJSON(SITEPREFIX + '/pendinginvitationtogroups', function(data) {
      var status;
      console.log(data);
      status = data.status === 'SUCCESS';
      if (status && data.pendingInvitationToGroups.length > 0) {
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
    $div.append(AjaxSolr.theme('section_title', 'Collaborations you are invited to:'));
    $div.append(AjaxSolr.theme('section_items', 'pending_invitations', ['Collaboration Name', 'Creator'], rows, null, handleAccepts(refreshAll)));
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
    $('div#pending_invitations').append(AjaxSolr.theme('section_title', 'No Pending Invitations To Collaborations'));
    return true;
  };
  submitDeleteActionOwnerGroups = function(path, idname, recreate) {
    return function() {
      var data, datamap, ele, idx, item, _ref;
      data = (function() {
        var _i, _len, _ref, _results;
        _ref = $(this).find('input[type=checkbox]:checked');
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
            fqGroupName: ele
          });
        }
        return _results;
      })();
      for (idx = 0, _ref = datamap.length; 0 <= _ref ? idx < _ref : idx > _ref; 0 <= _ref ? idx++ : idx--) {
        $.post(SITEPREFIX + path, JSON.stringify(datamap[idx]), (function(idx) {
          return function(resp) {
            console.log('in del invit', resp, idx, datamap.length);
            if (idx === (datamap.length - 1)) {
              recreate();
            }
            return false;
          };
        })(idx));
      }
      return false;
    };
  };
  createOwnerOfGroups = function() {
    $('div#owner_groups').empty();
    return $.getJSON(SITEPREFIX + '/ownerofgroups', function(data) {
      var status;
      status = data.status === 'SUCCESS';
      if (status && data.ownerOfGroups.length > 0) {
        return createOwnerOfGroupsSection(data.ownerOfGroups);
      } else {
        return noOwnerOfGroups();
      }
    });
  };
  makeOwnerOfGroupsSectionRow = function(s) {
    var frag;
    frag = s.replace(/\//g, '-').replace('@', '_at_').replace(/\./g, '_dot_');
    return [$('<input type="checkbox" name="groupid"/>').attr('value', s), $('<a/>').attr('href', "" + SITEPREFIX + "/explorer/group?fqGroupName=" + s).text(s), $("<span id=\"og_" + frag + "\">"), $("<span id=\"ogi_" + frag + "\">")];
  };
  createOwnerOfGroupsSection = function(groups) {
    var $div, idx, inviteremovehandler, memberremovehandler, ngroup, rows, s, _ref, _results;
    ngroup = groups.length;
    rows = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = groups.length; _i < _len; _i++) {
        s = groups[_i];
        _results.push(makeOwnerOfGroupsSectionRow(s));
      }
      return _results;
    })();
    $div = $('div#owner_groups');
    $div.append(AjaxSolr.theme('section_title', 'Collaborations you are the owner of:'));
    $div.append(AjaxSolr.theme('section_items', 'owner_groups', ['Collaboration Name', 'Other Members', 'Invitations'], rows, handleInvites(refreshAll)));
    $('#owner_groups-form').submit(submitDeleteActionOwnerGroups('/deletegroup', 'fqGroupName', refreshAll));
    console.log("grpus", groups);
    inviteremovehandler = function() {
      var data, fqGroupName, ietr, userNames;
      ietr = $(this).attr('id');
      fqGroupName = $(this).attr('group');
      userNames = [ietr.slice(2).replace('_at_', '@').replace(/_dot_/g, '.')];
      data = {
        fqGroupName: fqGroupName,
        userNames: userNames
      };
      return $.post(SITEPREFIX + '/removeinvitationfromgroup', JSON.stringify(data), function(resp) {
        console.log(resp);
        return createOwnerOfGroups();
      });
    };
    $div.delegate('a.xinvite', 'click', inviteremovehandler);
    memberremovehandler = function() {
      var data, fqGroupName, metr, userNames;
      metr = $(this).attr('id');
      userNames = [metr.slice(2).replace('_at_', '@').replace(/_dot_/g, '.')];
      fqGroupName = $(this).attr('group');
      data = {
        fqGroupName: fqGroupName,
        userNames: userNames
      };
      return $.post(SITEPREFIX + '/removeuserfromgroup', JSON.stringify(data), function(resp) {
        console.log(resp);
        return createOwnerOfGroups();
      });
    };
    $div.delegate('a.xmember', 'click', memberremovehandler);
    _results = [];
    for (idx = 0, _ref = groups.length; 0 <= _ref ? idx < _ref : idx > _ref; 0 <= _ref ? idx++ : idx--) {
      _results.push($.getJSON(SITEPREFIX + ("/getmembersofgroup?fqGroupName=" + groups[idx]), __bind(function(idx) {
        return function(data) {
          var cidx, ele, frag, grouptext, grouptextarray;
          console.log("data", data);
          frag = groups[idx].replace(/\//g, '-').replace('@', '_at_').replace(/\./g, '_dot_');
          grouptextarray = (function() {
            var _i, _len, _ref2, _results2;
            _ref2 = data.getMembersOfGroup;
            _results2 = [];
            for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
              ele = _ref2[_i];
              if (ele !== root.email) {
                _results2.push(ele + ' <a group="' + groups[idx] + '" id="m-' + ele.replace('@', '_at_').replace(/\./g, '_dot_') + '" class="xmember label important">x</a>');
              }
            }
            return _results2;
          })();
          grouptext = grouptextarray.join(', ');
          $("#og_" + frag).html(grouptext);
          cidx = idx;
          return $.getJSON(SITEPREFIX + ("/getinvitationstogroup?fqGroupName=" + groups[cidx]), __bind(function(cidx) {
            return function(data2) {
              var ele, invitetext, invitetextarray;
              console.log("data2", data2);
              invitetextarray = (function() {
                var _i, _len, _ref2, _results2;
                _ref2 = data2.getInvitationsToGroup;
                _results2 = [];
                for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                  ele = _ref2[_i];
                  _results2.push(ele + ' <a group="' + groups[cidx] + '" id="i-' + ele.replace('@', '_at_').replace(/\./g, '_dot_') + '" class="xinvite label important">x</a>');
                }
                return _results2;
              })();
              invitetext = invitetextarray.join(', ');
              $("#ogi_" + frag).html(invitetext);
              if (cidx === (groups.length - 1)) {
                console.log(data2, cidx);
              }
              if (cidx === (groups.length - 1)) {
                return $('#owner_groups-table').tablesorter();
              }
            };
          }, this)(cidx));
        };
      }, this)(idx)));
    }
    return _results;
  };
  noOwnerOfGroups = function() {
    $('div#owner_groups').append(AjaxSolr.theme('section_title', 'No Collaborations you are a owner of'));
    return true;
  };
  refreshAll = function() {
    createOwnerOfGroups();
    createPendingInvitations();
    return createMemberOfGroups();
  };
  mediator.subscribe('user/login', function(email) {
    root.email = email;
    refreshAll();
    return $('#welcome').text("Welcome, user " + email + "!");
  });
  $(function() {
    return $('a.feedback').fancybox();
  });
}).call(this);
