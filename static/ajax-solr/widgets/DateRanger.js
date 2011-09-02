//Date range picker without a date picker but using sliders
//Dual float or int widget
//with 2 sliders

//we have a one day offset problem may be due to inclusive range ussues FIX
(function ($) {

    AjaxSolr.DateRangerWidget = AjaxSolr.AbstractFacetWidget.extend({
	afterRequest: function () {
	    var self = this;
	    var d1 = Date.today().set({year: self.themin, month: 0, day: 1});
	    var d2 = Date.today().set({year: self.themax+1, month: 0, day: 1});
	    var tmin=0;
	    var tmax=0;
	    for (var y = self.themin; y < self.themax+1; y++){
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
	    
	    var pqvalues = self.manager.store.values('fq');
	    var ourmin = undefined;
	    var ourmax = undefined;
	    if (pqvalues.length > 0) {
		for (var tval in pqvalues) {
		    var splitfq = pqvalues[tval].split(':');
		    if (splitfq[0] === self.field) {
			var splitstring = splitfq.slice(1).join(":");
			var splitonto = splitstring.split('TO');
			var ourminiso = splitonto[0].trim().substr(1);
			var tempmax = splitonto[1].trim();
			var ourmaxiso = tempmax.slice(0, tempmax.length -1);
			var ourmindate = new Date(ourminiso);
			var spanmin = new TimeSpan(ourmindate - d1);
			var ourmaxdate = new Date(ourmaxiso);
			var spanmax = new TimeSpan(ourmaxdate - d1);
			ourmin = spanmin.getDays();
			ourmax = spanmax.getDays();
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
		'step': self.thestep,
		'values':[ourmin,ourmax],
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
