# Autocompletion widget

#Not sure i understand this. CHANDRA/1269 dosent show up until CHANDRA/126, not even at CHANDRA/12. Why?
root = exports ? this
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
        $('#thrower').hide()
        $(this.target).find('input').val('')
        self = this

        $(this.target).find('input').unbind().bind 'keydown', (e) ->
          if self.requestSent is false and e.which is 13
            value = $(this).val()
            if value and self.add(value)
              self.manager.doRequest(0)

        callback = (response) ->
              list = []
              obsvs=[]
              pubs=[]
              facetfields=response.facet_counts.facet_fields
              for field in self.fields
                for facet, val of facetfields[field]
                  if field is 'obsids_s'
                      obsvs.push(facet)
                  if field is 'bibcode'
                      pubs.push(facet)
                  fieldname = self.fieldmap[field] ? field
                  list.push
                    field: field
                    value: facet
                    text: "#{facet} (#{val}) - #{fieldname}"
              #console.log "LIST", pubs, obsvs
              console.log self.tab, pubs.length, obsvs.length
              self.requestSent = false
              if self.tab is 'publications'
                  othertab='observations'
                  faceter='obsids_s'
                  listuse=obsvs
              if self.tab is 'observations'
                  othertab='publications'
                  faceter='bibcode'
                  listuse=pubs
              if listuse.length > 0
                  #does and: throwurlist=("fq=#{faceter}%3A#{encodeURIComponent ele}" for ele in listuse)
                  throwurlist=("#{encodeURIComponent ele}" for ele in listuse)
                  throwhref="#{root.dasiteprefix}/explorer/#{othertab}#fq=#{faceter}%3A#{throwurlist.join '%20OR%20'}"
                  console.log throwhref.length
                  if throwhref.length < 3750
                      $('#thrower').attr('href', throwhref);
                      $('#thrower').show()
              resHandler = (err, facet) ->
                    self.requestSent = true
                    nval = "#{facet.field}:#{AjaxSolr.Parameter.escapeValue facet.value}"
                    if self.manager.store.addByValue 'fq', nval
                      self.manager.doRequest 0
              
              $(self.target).find('input')
                .unautocomplete()
                .autocomplete(list, formatItem: (facet) -> facet.text)
                .result(resHandler)
        #console.log 'SELF>MANAGER', self.manager.store.hash
        params = [self.manager.store.hash, 'q=*:*&rows=0&facet=true&facet.limit=-1&facet.mincount=1&json.nl=map']
        for field in self.fields
          params.push "facet.field=#{field}"

        getjsonstring = this.manager.solrUrl + 'select?' + params.join('&') + '&wt=json&json.wrf=?'
        #console.log 'GETJSONSTRING', getjsonstring
        $.getJSON getjsonstring, {}, callback

