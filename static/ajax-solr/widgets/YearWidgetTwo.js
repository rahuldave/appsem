//with 2 sliders
(function ($) {

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
	    var stats = self.manager.response.stats.stats_fields[self.field];
	    var themin = undefined;
	    var themax = undefined;

	    /*
	     * Since we now get Solr to calculate the min/max values for the year
	     * this loop is not needed, apart from when the search is empty.
	     * THIS WILL BE CHANGED
	     */
	    if (stats !== undefined && stats.count > 0) {
		themin = stats.min;
		themax = stats.max;
	    } else {
		themin = self.datamin;
		themax = self.datamax;

		// This assumes that we only have a single filter for this field
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

	    var adjustText = function (values) {
		$('#amount').val(values[0] + '-' + values[1]);
	    }
	    
	    $(this.target).slider("destroy").slider({
		'range': true,
		'min': self.datamin,
		'max': self.datamax,
		'step': self.datastep,
		'values': [themin, themax],
		slide: function (event, ui) { adjustText(ui.values); },
		stop: function (event, ui) {
		    var val = self.field + ':[' + ui.values[0] + ' TO ' + ui.values[1] + ']';
		    if (self.manager.store.addByValue('fq', val)) {
                        self.manager.doRequest(0);
                    }
		}
	    });

	    adjustText($(this.target).slider("values"));
	    
	}
    });

})(jQuery); 
