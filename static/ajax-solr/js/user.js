(function() {
  var $, createMemberOfGroups, createMemberOfGroupsSection, makeSectionRow, noMemberOfGroups, submitDeleteAction;
  $ = jQuery;
  submitDeleteAction = function(path, idname, recreate, fqGroupName) {
    if (fqGroupName == null) {
      fqGroupName = 'default';
    }
    return function() {
      var data, item, map;
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
      map = {};
      map.fqGroupName = fqGroupName;
      $.post(SITEPREFIX + path, JSON.stringify(map), function(resp) {
        recreate();
        return false;
      });
      return false;
    };
  };
  createMemberOfGroups = function() {
    $('div#member-groups').empty();
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
  makeSectionRow = function(s) {
    return [$('<input type="checkbox" name="groupid"/>').attr('value', s), $('<a/>').attr('href', "" + SITEPREFIX + "/explorer/group?fqGroupName=" + s).text(s), 'Members'];
  };
  createMemberOfGroupsSection = function(groups) {
    var $div, ngroup, rows, s;
    ngroup = groups.length;
    rows = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = groups.length; _i < _len; _i++) {
        s = groups[_i];
        _results.push(makeSectionRow(s));
      }
      return _results;
    })();
    $div = $('div#member-groups');
    $div.append(AjaxSolr.theme('section_title', 'Groups you are a member of:'));
    $div.append(AjaxSolr.theme('section_items', 'groups', ['Group Name', 'Members'], rows));
    $('#member-groups-form').submit(submitDeleteAction('/removeoneselffromgroup', 'fqGroupName', createMemberOfGroups));
    return $('#member-groups-table').tablesorter();
  };
  noMemberOfGroups = function() {
    $('div#member-groups').append(AjaxSolr.theme('saved_title', 'No Groups you are a member of'));
    return true;
  };
  mediator.subscribe('user/login', function(email) {
    return createMemberOfGroups();
  });
}).call(this);
