# Theme for the saved view

$ = jQuery

# Create a title for a saved item (e.g. searches or publications) area.

AjaxSolr.theme.prototype.section_title = (text) -> $('<h3/>').text text

# Set or unset all the buttons in the table.

changeAllButtons = (newstate) ->
  () ->
    (item.checked = newstate for item in $(this.form).find('input[type=checkbox]'))
    return true

# Create the form actions for the saved-item form.
AjaxSolr.theme.prototype.owner_groups_formactions = (invitehandler, accepthandler) ->
  return $('<div class="formactions"/>')
    .append($('<input type="button" class="btn small" value="Mark all"/>').click(changeAllButtons true))
    .append($('<input type="button" class="btn small" value="Clear all"/>').click(changeAllButtons false))
    .append($('<span>&nbsp;<span class="label"/>&nbsp;</span>'))
    .append($('<input type="submit" class="btn small danger" value="Delete Collabs" name="action"/>'))
    .append($('<span>&nbsp;<span class="label"/>&nbsp;</span>'))
    .append($('<input class="medium invitetext" type="text"/>'))
    .append($('<input type="button" class="btn small info" value="Invite" name="Invite"/>').click(invitehandler))
AjaxSolr.theme.prototype.member_groups_formactions = (invitehandler, accepthandler) ->
  return $('<div class="formactions"/>')
    .append($('<input type="button" class="btn small" value="Mark all"/>').click(changeAllButtons true))
    .append($('<input type="button" class="btn small" value="Clear all"/>').click(changeAllButtons false))
    .append($('<span>&nbsp;<span class="label"/>&nbsp;</span>'))
    .append($('<input type="submit" class="btn small danger" value="Unsubscribe" name="action"/>'))

AjaxSolr.theme.prototype.pending_invitations_formactions = (invitehandler, accepthandler) ->
  return $('<div class="formactions"/>')
    .append($('<input type="button" class="btn small" value="Mark all"/>').click(changeAllButtons true))
    .append($('<input type="button" class="btn small" value="Clear all"/>').click(changeAllButtons false))
    .append($('<span>&nbsp;<span class="label"/>&nbsp;</span>'))
    .append($('<input type="submit" class="btn small danger" value="Decline" name="action"/>'))
    .append($('<span>&nbsp;<span class="label"/>&nbsp;</span>'))
    .append($('<input type="button" class="btn small info" value="Accept" name="Accept"/>').click(accepthandler))
               

# Create the THEAD block for the saved-item table.
#
#   cols is an array of column names.
#
# The first column is created empty and should not be included in cols.

AjaxSolr.theme.prototype.section_tablehead = (cols) ->
  $tr = $('<tr/>').append('<th/>')
  for name in cols
    $tr.append $('<th/>').text(name)

  $('<thead/>').append($tr)

# Create a table row for the saved-item table.
#
#   row is an array of items to store in the table

AjaxSolr.theme.prototype.section_tablerow = (row) ->
  $out = $('<tr class="saveditem"/>')
  for value in row
    $out.append $('<td/>').append($(value))

  $out

# Create the list of saved items.
#
#  idfrag is used to create the various names - e.g.
#      an id of 'saved-' + idfrag + '-form' for the form
#   cols is an array of column headers (not including the
#     first column which is empty/the selection column)
#   rows is an array of rows, where each item is an
#     array of values to display.
#
#   bibtexHandler is the click handler for the 'export as BibTex' button
#   myADSHandler is the click handler for the 'export to myADS' button

AjaxSolr.theme.prototype.section_items = (idfrag, cols, rows, invitehandler=null, accepthandler=null) ->
  $out = $('<form action="#"/>').attr 'id', "#{idfrag}-form"
  $actions = AjaxSolr.theme "#{idfrag}_formactions", invitehandler, accepthandler
  $table = $('<table class="table table-striped table-bordered table-condensed"/>')
    .attr('id', "#{idfrag}-table")
    .append(AjaxSolr.theme 'section_tablehead', cols)

  $tbody = $('<tbody/>')
  for value in rows
    $tbody.append(AjaxSolr.theme "section_tablerow", value)

  $table.append $tbody
  $out.append($actions).append($table)
  $out
