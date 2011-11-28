# Autocompletion widget

$ = jQuery

AjaxSolr.AutocompleteWidget = AjaxSolr.AbstractFacetWidget.extend

  # A mapping from the field names for each facet (as used by Solr)
	# and the display version. If there is no entry then the facet field
	# name is used.
	#
	# @public
	# @field
	# @type Object (map from facet field names to human-readable values)

	fieldmap: {}

	afterRequest: () ->
    $(this.target).find('input').val('')
    self = this

    $(this.target).find('input').unbind().bind 'keydown', (e) ->
      if self.requestSent is false and e.which is 13
        value = $(this).val()
        if value and self.add(value)
          self.manager.doRequest(0)

    callback = (response) ->
      list = []
      for field in self.fields
        for facet, val of response.facet_counts.facet_fields[field]
          fieldname = self.fieldmap[field] ? field
          list.push
            field: field
            value: facet
            text: "#{facet} (#{val}) - #{fieldname}"

      self.requestSent = false
      resHandler = (err, facet) ->
        self.requestSent = true
        nval = "#{facet.field}:#{AjaxSolr.Parameter.escapeValue facet.value}"
        if self.manager.store.addByValue 'fq', nval
          self.manager.doRequest 0

      $(self.target).find('input')
        .unautocomplete()
        .autocomplete(list, formatItem: (facet) -> facet.text)
        .result(resHandler)

    params = [self.manager.store.hash, 'facet=true&facet.limit=-1&facet.mincount=1&json.nl=map']
    for field in self.fields
      params.push "facet.field=#{field}"

    getjsonstring = this.manager.solrUrl + 'select?' + params.join('&') + '&wt=json&json.wrf=?'
    $.getJSON getjsonstring, {}, callback

