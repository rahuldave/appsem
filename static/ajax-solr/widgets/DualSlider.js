//
// A range widget which uses a slider with both lower and upper
// handles to display a numeric range (integer or floating-point).
//
// The range displayed by the slider is:
//    - if no selection has been made then use the datamin/datamax
//      values of the object
//
//    - if a selection has been made but it does not include this
//      field then use the data range
//
//    - if the selection contains the field as a filter then use
//      the requested limits, even if the actual data does not
//      match them (it can exceed the limits if the field occurs
//      multiple times for a document, such as the RA of a source)
//
//      The code assumes that there is only one filter in the search
//      for this field.
//

(function ($) {

    AjaxSolr.DualSliderWidget = AjaxSolr.AbstractFacetWidget.extend({

	/**
	 * We assume that only one range can be supplied for this field.
	 */
	multivalue: false,

	afterRequest: function () {
	    var self = this;
	    var stats = self.manager.response.stats.stats_fields[self.field];
	    var themin = undefined;
	    var themax = undefined;

	    // It may be that stats.count can never be 0?
	    if (stats != null && stats.count > 0) {
		themin = self.fromFacet(stats.min);
		themax = self.fromFacet(stats.max);
	    } else {
		themin = self.datamin;
		themax = self.datamax;
	    }

	    // We only expect 0 or 1 filters for this field but support
	    // multiple values (use the last one).
	    //
	    var pqvalues = self.manager.store.values('fq');
	    var pqlen = pqvalues.length;
	    if (pqlen > 0) {
		for (var tval = 0; tval < pqlen; tval++) {
		    var fcon = pqvalues[tval];
		    var idx = fcon.indexOf(':');
		    if (fcon.substr(0, idx) === self.field) {
			var fstr = fcon.substr(idx+2, fcon.length - 3 - idx);
			var idx = fstr.indexOf(' TO ');
			var fvals = [fstr.substr(0, idx).trim(),
				     fstr.substr(idx+4).trim()];

			if (fvals[0] !== '') {
			    themin = self.fromFacet(fvals[0]);
			}
			if (fvals[1] !== '') {
			    themax = self.fromFacet(fvals[1]);
			}
		    }
		}
	    }

	    $(this.target).slider('destroy').slider({
		'range': true,
		'max': self.datamax,
		'min': self.datamin,
		'step': self.datastep,
		'values': [themin, themax],
		slide: function (event, ui) { self.adjustText(ui.values); },
		stop: function (event, ui) { 
		    var val = '[' + self.toFacet(ui.values[0]) +
			' TO ' + self.toFacet(ui.values[1]) + ']';
		    if (self.set(val)) {
                        self.manager.doRequest(0);
                    }
		}
	    });

	    self.adjustText($(this.target).slider("values"));

	},

	/*
	 * Function to display the current range in the associated
	 * span. It is sent an array of two elements, the low and
	 * high values used by the 
	 */
	adjustText: function (values) {
	    var txt;
	    if (values[0] == values[1]) {
		txt = this.toDisplay(values[0]);
	    } else {
		txt = this.toDisplay(values[0]) + ' to ' + 
		    this.toDisplay(values[1]);
	    }
	    $('#' + this.id + '_amount').text(txt);
	},

	/*
	 * Convert the value (min or max) to the format used in the UI
	 * for display to the user.
	 */
	toDisplay: function (val) { return val; },

	/*
	 * Convert the value (min or max) to the format used in the UI
	 * for the Solr facet.
	 */
	toFacet: function (val) { return val; },

	/*
	 * Convert the value (min or max) from the format used in the
	 * Solr facet query to the value used by the slider.
	 */
	fromFacet: function (val) { return val; }

    });
    
})(jQuery);
