//Date range picker without a date picker but using sliders
//Dual float or int widget
//with 2 sliders

//we have a one day offset problem may be due to inclusive range ussues FIX
(function ($) {

    AjaxSolr.DateRangerWidget = AjaxSolr.AbstractFacetWidget.extend({
	afterRequest: function () {
	    var self = this;
	    var d1 = Date.today().set({year: self.datamin, month: 0, day: 1});
	    // var d2 = Date.today().set({year: self.datamax+1, month: 0, day: 1});

	    // This only needs to be recomputed whenever datamin/max gets changed
	    var tmin=0;
	    var tmax=0;
	    for (var y = self.datamin; y < self.datamax+1; y++){
		for (var m = 0; m<12; m++){
		    tmax += Date.getDaysInMonth(y, m);
		}
	    }
	    //tmax=tmax-1;//so that 1 would represent 2nd Jan not 1st Jan
	    //var tmax=d2-d1;

	    // not sure why the need for the double indirection here
	    var convertit = function (myvar) {
		var theinitialdate = myvar;
		return function (theday) {
		    return theinitialdate.clone().addDays(theday);
		};
	    }(d1);
	    
	    var fromFacet = function (val) {
		var date = new Date(val);
		var span = new TimeSpan(date - d1);
		return span.getDays();
	    }

	    var pqvalues = self.manager.store.values('fq');
	    var ourmin = undefined;
	    var ourmax = undefined;
	    if (pqvalues.length > 0) {
		for (var tval in pqvalues) {
		    var fcon = pqvalues[tval];
		    var idx = fcon.indexOf(':');

		    if (fcon.substr(0, idx) === self.field) {
			var fstr = fcon.substr(idx+2, fcon.length - 3 - idx);
			var idx = fstr.indexOf(' TO ');
			var fvals = [fstr.substr(0, idx).trim(),
				     fstr.substr(idx+4).trim()];

			ourmin = fromFacet(fvals[0]);
			ourmax = fromFacet(fvals[1]);
		    }
		}
		if (ourmin === undefined) {
		    ourmin=tmin;
		}
		if (ourmax === undefined) {
		    ourmax=tmax;
		}
	    } else {
		ourmin = tmin;
		ourmax = tmax;
	    }
	    
	    var textdiv = $('#' + self.id + "_amount");
	    var adjustText = function (values) {
		var val =
		    convertit(values[0]).toString("d-MMM-yyyy") + '-' +
		    convertit(values[1]).toString("d-MMM-yyyy");
		$(textdiv).text(val);
	    }

	    $(this.target).slider('destroy').slider({
		'range': true,
		'max': tmax,
		'min': tmin,
		'step': self.datastep,
		'values': [ourmin,ourmax],
		slide: function (event, ui) { adjustText(ui.values); },
		stop: function (event, ui) {
		    var val = self.field + ':[' + 
			convertit(ui.values[0]).toISOString() + ' TO ' + 
			convertit(ui.values[1]).toISOString() + ']';
                    if (self.manager.store.addByValue('fq', val)) {
                        self.manager.doRequest(0);
                    }
		}
	    });

	    adjustText($(this.target).slider("values"));

	}
    });
    
})(jQuery);
