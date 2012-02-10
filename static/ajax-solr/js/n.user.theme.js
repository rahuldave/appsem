(function() {
  var $, changeAllButtons;
  $ = jQuery;
  AjaxSolr.theme.prototype.section_title = function(text) {
    return $('<h3/>').text(text);
  };
  changeAllButtons = function(newstate) {
    return function() {
      var item, _i, _len, _ref;
      _ref = $(this.form).find('input[type=checkbox]');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        item.checked = newstate;
      }
      return true;
    };
  };
  AjaxSolr.theme.prototype.owner_groups_formactions = function(invitehandler, accepthandler) {
    return $('<div class="formactions"/>').append($('<input type="button" class="btn small" value="Mark all"/>').click(changeAllButtons(true))).append($('<input type="button" class="btn small" value="Clear all"/>').click(changeAllButtons(false))).append($('<span>&nbsp;<span class="label"/>&nbsp;</span>')).append($('<input type="submit" class="btn small btn-danger" value="Delete Collabs" name="action"/>')).append($('<span>&nbsp;<span class="label"/>&nbsp;</span>')).append($('<input class="medium invitetext" type="text"/>')).append($('<input type="button" class="btn small btn-info" value="Invite" name="Invite"/>').click(invitehandler));
  };
  AjaxSolr.theme.prototype.member_groups_formactions = function(invitehandler, accepthandler) {
    return $('<div class="formactions"/>').append($('<input type="button" class="btn small" value="Mark all"/>').click(changeAllButtons(true))).append($('<input type="button" class="btn small" value="Clear all"/>').click(changeAllButtons(false))).append($('<span>&nbsp;<span class="label"/>&nbsp;</span>')).append($('<input type="submit" class="btn small btn-danger" value="Unsubscribe" name="action"/>'));
  };
  AjaxSolr.theme.prototype.pending_invitations_formactions = function(invitehandler, accepthandler) {
    return $('<div class="formactions"/>').append($('<input type="button" class="btn small" value="Mark all"/>').click(changeAllButtons(true))).append($('<input type="button" class="btn small" value="Clear all"/>').click(changeAllButtons(false))).append($('<span>&nbsp;<span class="label"/>&nbsp;</span>')).append($('<input type="submit" class="btn small btn-danger" value="Decline" name="action"/>')).append($('<span>&nbsp;<span class="label"/>&nbsp;</span>')).append($('<input type="button" class="btn small btn-info" value="Accept" name="Accept"/>').click(accepthandler));
  };
  AjaxSolr.theme.prototype.section_tablehead = function(cols) {
    var $tr, name, _i, _len;
    $tr = $('<tr/>').append('<th/>');
    for (_i = 0, _len = cols.length; _i < _len; _i++) {
      name = cols[_i];
      $tr.append($('<th/>').text(name));
    }
    return $('<thead/>').append($tr);
  };
  AjaxSolr.theme.prototype.section_tablerow = function(row) {
    var $out, value, _i, _len;
    $out = $('<tr class="saveditem"/>');
    for (_i = 0, _len = row.length; _i < _len; _i++) {
      value = row[_i];
      $out.append($('<td/>').append($(value)));
    }
    return $out;
  };
  AjaxSolr.theme.prototype.section_items = function(idfrag, cols, rows, invitehandler, accepthandler) {
    var $actions, $out, $table, $tbody, value, _i, _len;
    if (invitehandler == null) {
      invitehandler = null;
    }
    if (accepthandler == null) {
      accepthandler = null;
    }
    $out = $('<form action="#"/>').attr('id', "" + idfrag + "-form");
    $actions = AjaxSolr.theme("" + idfrag + "_formactions", invitehandler, accepthandler);
    $table = $('<table class="table table-striped table-bordered table-condensed"/>').attr('id', "" + idfrag + "-table").append(AjaxSolr.theme('section_tablehead', cols));
    $tbody = $('<tbody/>');
    for (_i = 0, _len = rows.length; _i < _len; _i++) {
      value = rows[_i];
      $tbody.append(AjaxSolr.theme("section_tablerow", value));
    }
    $table.append($tbody);
    $out.append($actions).append($table);
    return $out;
  };
}).call(this);
