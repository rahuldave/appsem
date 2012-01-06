# Autocompletion widget

#Not sure i understand this. CHANDRA/1269 dosent show up until CHANDRA/126, not even at CHANDRA/12. Why?
root = exports ? this
$ = jQuery

doADSProxy2 = (urlpath, datastring, callback) -> 
  return $.post("#{SITEPREFIX}/adsproxy2", JSON.stringify({
    urlpath: urlpath,
    method: 'POST',
    data: {bibcode: datastring, data_type: 'HTML'}
  }), callback)


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
        #scope these by a div to reduce DOM lookups BUG
        $('#thrower').hide()
        $('#metricsthrower').hide()
        $('#numpubs').hide()
        $(this.target).find('input').val('')
        self = this

        $(this.target).find('input').unbind().bind 'keydown', (e) ->
          if self.requestSent is false and e.which is 13
            value = $(this).val()
            console.log "value is", value
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
              npubs=pubs.length
              nobsvs=obsvs.length
              console.log "INAUTOWIDGET", self.tab, 'pubs', npubs, 'obsvs', nobsvs
              self.requestSent = false

              if self.tab is 'publications'
                  othertab='observations'
                  faceter='obsids_s'
                  listuse=obsvs
                  
              if self.tab is 'observations'
                  othertab='publications'
                  faceter='bibcode'
                  listuse=pubs
              shownpubs=false  
              if npubs < 200
                  poststring=pubs.join ","
                  console.log poststring
                  hiddenformdiv="""
                  <div id=\"tempform\" style=\"display:none\"><form method=\"post\" action=\"http://adsabs.harvard.edu/tools/metrics?rahul\">
                  <input type=\"hidden\" name=\"bibcode\" value=\"#{poststring}\">
                  <input type=\"hidden\" name=\"service\" value=\"yes\">
                  <input type=\"submit\" name=\"submit\" id=\"tempformsubmit\" value=\"submit\"/></form></div>
                  """
                  $('body').append(hiddenformdiv)                   
                  $('#metricsthrower').attr('href', '/semantic2/alpha/static/hiddenform.html')
                  $("#metricsthrower").fancybox({type: 'iframe',autoDimensions: false,width: 1024,height: 768,scrolling: 'yes'})
                  $('#metricsthrower').show()
                  $('#numpubs').text("(#{npubs} pubs)")
                  shownpubs=true
              if listuse.length > 0
                  #does and: throwurlist=("fq=#{faceter}%3A#{encodeURIComponent ele}" for ele in listuse)
                  throwurlist=("#{encodeURIComponent ele}" for ele in listuse)
                  throwhref="#{root.dasiteprefix}/explorer/#{othertab}#fq=#{faceter}%3A#{throwurlist.join '%20OR%20'}"
                  console.log "THROWHREFLENGTH", throwhref.length
                  if throwhref.length < 3750
                      $('#thrower').attr('href', throwhref);
                      $('#thrower').show()
                      $('#numpubs').text("(#{npubs} pubs)") unless shownpubs
                      shownpubs=true
              if self.tab isnt 'publications' and shownpubs
                  $('#numpubs').show()
              resHandler = (err, facet) ->
                    self.requestSent = true
                    console.log "in RESHANDLER", facet
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

