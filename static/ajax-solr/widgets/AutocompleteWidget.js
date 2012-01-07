(function ($) {

    AjaxSolr.AutocompleteWidget = AjaxSolr.AbstractFacetWidget.extend({

	/**
	 * A mapping from the field names for each facet (as used by Solr)
	 * and the display version. If there is no entry then the facet field
	 * name is used.
	 *
	 * @public
	 * @field
	 * @type Object (map from facet field names to human-readable values)
	 */
	fieldmap: {},
	
	/*
	 * moved out of init since this is what 
	 * https://github.com/evolvingweb/ajax-solr/wiki/Reuters-tutorial%3A-step-7
	 * uese
	init: function () {
	    var self = this;
	    $(this.target).find('input').bind('keydown', function(e) {
		if (self.requestSent === false && e.which == 13) {
		    var value = $(this).val();
		    if (value && self.add(value)) {
			self.manager.doRequest(0);
		    }
		}
	    });
	},
	 *
	 */

	afterRequest: function () {
	    $(this.target).find('input').val('');
	    
	    var self = this;

	    $(this.target).find('input').unbind().bind('keydown', function(e) {
		if (self.requestSent === false && e.which == 13) {
		    var value = $(this).val();
		    if (value && self.add(value)) {
			self.manager.doRequest(0);
		    }
		}
	    });
	    
	    var callback = function (response) {
		var list = [];
		for (var i = 0; i < self.fields.length; i++) {
		    var field = self.fields[i];
		    for (var facet in response.facet_counts.facet_fields[field]) {
			var fieldname = self.fieldmap[field] || field;
			list.push({
			    field: field,
			    value: facet,
			    text: facet + ' (' + response.facet_counts.facet_fields[field][facet] + ') - ' + fieldname
			});
	        }
		}
		
		self.requestSent = false;
		$(self.target).find('input').unautocomplete().autocomplete(list, {
		    formatItem: function(facet) {
			return facet.text;
		    }
		}).result(function(e, facet) {
		    self.requestSent = true;
		    if (self.manager.store.addByValue('fq', facet.field + ':' + AjaxSolr.Parameter.escapeValue(facet.value))) {
			self.manager.doRequest(0);
		    }
		});
	    } // end callback

	    // TODO: check what is sent, since this doesn't seem to include the current
	    // constraints when getting the facet values. I thought the change below; including self.manager.store.hash,
	    // would work and it seems to partially work but not always
	    //
	    //var params = [ 'q=*:*&facet=true&facet.limit=-1&facet.mincount=1&json.nl=map' ];
	    var params = [ self.manager.store.hash, 'facet=true&facet.limit=-1&facet.mincount=1&json.nl=map' ];
	    for (var i = 0, nf = self.fields.length; i < nf; i++) {
		params.push('facet.field=' + self.fields[i]);
	    }
	    var getjsonstring = this.manager.solrUrl + 'select?' + params.join('&') + '&wt=json&json.wrf=?';
	    jQuery.getJSON(getjsonstring, {}, callback);
	}
    });
    
})(jQuery);
