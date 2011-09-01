//Dual float or int widget
//with 2 sliders

(function ($) {

    AjaxSolr.DualSliderWidget = AjaxSolr.AbstractFacetWidget.extend({
	afterRequest: function () {
	    var self = this;
	    var fieldstats = self.manager.response.stats.stats_fields[self.field];
	    var themin = undefined;
	    var themax = undefined;

	    if (fieldstats !== undefined && fieldstats.count > 0) {
		themin = fieldstats.min;
		themax = fieldstats.max;
	    } else {
		themin = this.themin;
		themax = this.themax;

		// This assumes that we only have a single time range
		var pqvalues=self.manager.store.values('fq');
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

	    $(this.target).slider('destroy').slider({
		'range':true,
		'max': this.themax,
		'min': this.themin,
		'step':this.thestep,
		'values':[themin,themax],
		slide: function( event, ui ) {
                    console.log('SLIDE EVENT');
                    $( "#"+self.id+"_amount" ).val(ui.values[0]+'-'+ui.values[1] );
		},
		stop: function( event, ui ) {
                    console.log("ONSTOP"+ui.values);
                    //self.manager.store.addByValue('fq', facet.field + ':' + facet.value)
                    if (self.manager.store.addByValue('fq',self.field+':['+ui.values[0]+' TO '+ui.values[1]+']')) {
                        self.manager.doRequest(0);
                    }
		}
	    });
	    $( "#"+this.id+"_amount" ).val($(this.target).slider( "values" ,0)+'-'+ $(this.target).slider( "values" ,1));
	}
    });
    
})(jQuery);
