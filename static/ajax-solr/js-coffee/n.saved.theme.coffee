# Theme for the saved view

$ = jQuery

# Create a title for a saved item (e.g. searches or publications) area.

AjaxSolr.theme.prototype.section_title = (text) -> $('<h4/>').text text

# Set or unset all the buttons in the table.

changeAllButtons = (newstate) ->
  () ->
    console.log "cab", $(this.form)
    (item.checked = newstate for item in $(this.form).find('input[type=checkbox]'))
    return true

# Create the form actions for the saved-item form.

AjaxSolr.theme.prototype.saved_formactions = (saveingrouphandler, savetotagshandler, bibtexHandler=null, myADSHandler=null) ->
  unless bibtexHandler is null and myADSHandler is null
      return $('<div class="formactions"/>')
        .append($('<input class="btn small" type="button" value="Mark all"/>').click(changeAllButtons true))
        .append($('<input class="btn small" type="button" value="Clear all"/>').click(changeAllButtons false))
        .append($('<span>&nbsp;<span class="label success"/>&nbsp;</span>'))
        .append($('<input class="btn danger small" type="submit" value="Delete" name="action"/>'))
        .append($('<span>&nbsp;<span class="label success"/>&nbsp;</span>'))
        .append($('<select class="groupselect"/>').append(("<option>#{ele}</option>" for ele in mygroups).join('')))
        .append($('<input class="btn primary small" type="button" value="Save to Collaboration" name="action"/>').click(saveingrouphandler))
        .append($('<span>&nbsp;<span class="label success"/>&nbsp;</span>'))
        .append($('<input class="medium tagstext" type="text"/>'))
        .append($('<input type="button" class="btn small info" value="Add Tags" name="Tag"/>').click(savetotagshandler)) 
        .append($('<span>&nbsp;<span class="label success"/>&nbsp;</span>'))
        .append($('<input class="btn info small" type="button" value="Get as BibTex"/>').click(bibtexHandler))
        .append($('<button type="button" name="myads" value="Send to myADS"/>')
          .click(myADSHandler)
          .append($('<img alt="[myADS logo]"/>')
            .attr('src', "#{SITEPREFIX}/static/images/ADSlabs-button.png")))
  return $('<div class="formactions"/>')
    .append($('<input class="btn small" type="button" value="Mark all"/>').click(changeAllButtons true))
    .append($('<input class="btn small" type="button" value="Clear all"/>').click(changeAllButtons false))
    .append($('<span>&nbsp;<span class="label success"/>&nbsp;</span>'))
    .append($('<input class="btn danger small" type="submit" value="Delete" name="action"/>'))
    .append($('<span>&nbsp;<span class="label success"/>&nbsp;</span>'))
    .append($('<select class="groupselect"/>').append(("<option>#{ele}</option>" for ele in mygroups).join('')))
    .append($('<input class="btn primary small" type="button" value="Save to Collaboration" name="action"/>').click(saveingrouphandler))
    .append($('<span>&nbsp;<span class="label success"/>&nbsp;</span>'))
    .append($('<input class="medium tagstext" type="text"/>'))
    .append($('<input type="button" class="btn small info" value="Add Tags" name="Tag"/>').click(savetotagshandler))

        

# Create the THEAD block for the saved-item table.
#
#   cols is an array of column names.
#
# The first column is created empty and should not be included in cols.

AjaxSolr.theme.prototype.saved_tablehead = (cols) ->
  $tr = $('<tr/>').append('<th/>')
  for name in cols
    $tr.append $('<th/>').text(name)

  $('<thead/>').append($tr)

# Create a table row for the saved-item table.
#
#   row is an array of items to store in the table

AjaxSolr.theme.prototype.saved_tablerow = (row) ->
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

AjaxSolr.theme.prototype.saved_items = (idfrag, cols, rows, saveingrouphandler, savetotagshandler, bibtexHandler, myADSHandler) ->
  $out = $('<form action="#"/>').attr 'id', "saved-#{idfrag}-form"
  $actions = AjaxSolr.theme 'saved_formactions', saveingrouphandler, savetotagshandler, bibtexHandler, myADSHandler

  $table = $('<table class="tablesorter"/>')
    .attr('id', "saved-#{idfrag}-table")
    .append(AjaxSolr.theme 'saved_tablehead', cols)

  $tbody = $('<tbody/>')
  for value in rows
    $tbody.append(AjaxSolr.theme 'saved_tablerow', value)

  $table.append $tbody
  $out.append($actions).append($table)
  $out
