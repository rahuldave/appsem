//
// A range widget which uses a slider with both lower and upper
// handles to display a numeric range (integer or floating-point).
//

(function ($) {

    AjaxSolr.DualSliderWidget = AjaxSolr.AbstractFacetWidget.extend({
	afterRequest: function () {
	    var self = this;
	    var stats = self.manager.response.stats.stats_fields[self.field];
	    var themin = undefined;
	    var themax = undefined;

	    // TODO: we should probably use the min/max from any user-supplied
	    // filter even if the data lies outside this range (it can be greater
	    // for thise fields where there are multiple values per paper) as
	    // it *seems* less visually confusing. Needs thought.
	    //
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

	    var textdiv = $('#' + self.id + "_amount");
	    var adjustText = function (values) {
		$(textdiv).val(values[0] + '-' + values[1]);
	    }

	    $(this.target).slider('destroy').slider({
		'range': true,
		'max': self.datamax,
		'min': self.datamin,
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
