//with 2 sliders
(function ($) {

    // This is specific to the pubyear_i facet
    //
    // QUS:
    //   if a user has applied a filter - e.g. 1990 to 2000 - but
    //   the data returned only covers 1993 to 1998 say (due to other
    //   facets), then the current behavior is to set the widget to
    //   the data range rather than the specified range. From a
    //   very quick check this looks odd, so we may move back to
    //   checking the widget for a date range in all cases.
    //
    AjaxSolr.YearWidget = AjaxSolr.AbstractFacetWidget.extend({
	afterRequest: function () {
	    var self = this;
	    var yearstats = self.manager.response.stats.stats_fields.pubyear_i;
	    var themin = undefined;
	    var themax = undefined;

	    /*
	     * Since we now get Solr to calculate the min/max values for the year
	     * this loop is not needed, apart from when the search is empty.
	     */
	    if (yearstats.count > 0) {
		themin = yearstats.min;
		themax = yearstats.max;
	    } else {
		themin = this.manager.store.get('facet.pubyear.start').val();
		themax = this.manager.store.get('facet.pubyear.end').val();

		// This assumes that we only have a single time range
		var pqvalues = self.manager.store.values('fq');
		if (pqvalues.length > 0) {
		    for (var tval in pqvalues) {
			var splitfq = pqvalues[tval].split(':');
			if (splitfq[0] === this.field) {
			    var toks = splitfq[1].split('TO');
			    var lo = toks[0].trim().substr(1);
			    if (lo !== '') {
				themin = lo;
			    }

			    var hi = toks[1].trim();
			    if (hi !== '' && hi !== ']') {
				themax = hi.slice(0, hi.length-1);
			    }
			}
		    }
		}
	    }

	    $(this.target).slider("destroy").slider({
		'range':true,
		'max': this.manager.store.get('facet.pubyear.end').val(),
		'min': this.manager.store.get('facet.pubyear.start').val(),
		'step':this.manager.store.get('facet.pubyear.step').val(),
		//'values':[this.manager.store.get('facet.pubyear.start').val(),this.manager.store.get('facet.pubyear.end').val()],
		'values':[themin, themax],
		slide: function (event, ui) {
                    $( "#amount" ).val(ui.values[0]+'-'+ui.values[1] );
		},
		stop: function( event, ui ) {
                    if (self.manager.store.addByValue('fq',self.manager.store.get('facet.pubyear').val()+':['+ui.values[0]+' TO '+ui.values[1]+']')) {
                        self.manager.doRequest(0);
                    }
		}
	    });

	    $( "#amount" ).val($(this.target).slider( "values" ,0)+'-'+ $(this.target).slider( "values" ,1));
	    
	}
    });

})(jQuery); 
