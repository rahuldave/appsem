# A range widget which uses a slider with both lower and upper
# handles to display a numeric range (integer or floating-point).
#
# The range displayed by the slider is:
#    - if no selection has been made then use the datamin/datamax
#      values of the object
#
#    - if a selection has been made but it does not include this
#      field then use the data range
#
#    - if the selection contains the field as a filter then use
#      the requested limits, even if the actual data does not
#      match them (it can exceed the limits if the field occurs
#      multiple times for a document, such as the RA of a source)
#
#      The code assumes that there is only one filter in the search
#      for this field.

$ = jQuery

AjaxSolr.DualSliderWidget = AjaxSolr.AbstractFacetWidget.extend
  # We assume that only one range can be supplied for this field.
  multivalue: false

  afterRequest: () ->
    self = this
    stats = self.manager.response.stats.stats_fields[self.field]

    # In case stats.count can be 0
    if stats?.count > 0
      themin = self.fromFacet stats.min
      themax = self.fromFacet stats.max

    else
      themin = self.datamin
      themax = self.datamax

    # We only expect 0 or 1 filters, so use the last one
    # if there are more.
    pqvalues = self.manager.store.values 'fq'
    for fcon in pqvalues
      idx = fcon.indexOf ':'
      if fcon.substr(0, idx) is self.field
        fstr = fcon.substr idx+2, fcon.length-3-idx
        idx = fstr.indexOf ' TO '
        flo = fstr.substr(0, idx).trim()
        fhi = fstr.substr(idx+4).trim()

        if flo isnt ''
          themin = self.fromFacet flo
        if fhi isnt ''
          themax = self.fromFacet fhi

    $(self.target).slider('destroy').slider
      range: true
      max: self.datamax
      min: self.datamin
      step: self.datastep
      values: [themin, themax]
      slide: (event, ui) -> self.adjustText ui.values
      stop: (event, ui) ->
        val = "[#{self.toFacet ui.values[0]} TO #{self.toFacet ui.values[1]}]"
        if self.set val
          self.manager.doRequest 0

    self.adjustText $(self.target).slider("values")

  # Display the current range in the associated span. It is
  # setn an array of two elements, the low and high values.

  adjustText: ([lo,hi]) ->
    if lo is hi
      txt = this.toDisplay lo
    else
      txt = "#{this.toDisplay lo} to #{this.toDisplay hi}"

    $("##{this.id}_amount").text txt

  # Convert the value (min or max) to the format used in the
  # UI for display to the user.

  toDisplay: (val) -> val

  # Convert the value (min or max) to the format used for the
  # Solr facet query

  toFacet: (val) -> val

  # Convert the value (min or max) from the format used in the
  # Solr facet query to that used by the slider

  fromFacet: (val) -> val

