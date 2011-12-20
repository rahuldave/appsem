(function() {
  var $, changeAllButtons;
  $ = jQuery;
  AjaxSolr.theme.prototype.section_title = function(text) {
    return $('<h1/>').text(text);
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
  AjaxSolr.theme.prototype.saved_formactions = function() {
    return $('<div class="formactions"/>').append($('<input type="button" value="Mark all"/>').click(changeAllButtons(true))).append($('<input type="button" value="Clear all"/>').click(changeAllButtons(false))).append($('<input type="submit" value="Delete marked" name="action"/>'));
  };
  AjaxSolr.theme.prototype.saved_tablehead = function(cols) {
    var $tr, name, _i, _len;
    $tr = $('<tr/>').append('<th/>');
    for (_i = 0, _len = cols.length; _i < _len; _i++) {
      name = cols[_i];
      $tr.append($('<th/>').text(name));
    }
    return $('<thead/>').append($tr);
  };
  AjaxSolr.theme.prototype.saved_tablerow = function(row) {
    var $out, value, _i, _len;
    $out = $('<tr class="saveditem"/>');
    for (_i = 0, _len = row.length; _i < _len; _i++) {
      value = row[_i];
      $out.append($('<td/>').append($(value)));
    }
    return $out;
  };
  AjaxSolr.theme.prototype.section_items = function(idfrag, cols, rows) {
    var $actions, $out, $table, $tbody, value, _i, _len;
    $out = $('<form action="#"/>').attr('id', "saved-" + idfrag + "-form");
    $actions = AjaxSolr.theme('saved_formactions');
    $table = $('<table class="tablesorter"/>').attr('id', "saved-" + idfrag + "-table").append(AjaxSolr.theme('saved_tablehead', cols));
    $tbody = $('<tbody/>');
    for (_i = 0, _len = rows.length; _i < _len; _i++) {
      value = rows[_i];
      $tbody.append(AjaxSolr.theme('saved_tablerow', value));
    }
    $table.append($tbody);
    $out.append($actions).append($table);
    return $out;
  };
}).call(this);
