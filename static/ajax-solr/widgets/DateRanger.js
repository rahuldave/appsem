//Date range picker without a date picker but using sliders
//Dual float or int widget
//with 2 sliders

//we have a one day offset problem may be due to inclusive range ussues FIX

(function ($) {

    // Note: using date.js
    //
    var zeroDate = new Date(1977, 0, 1);

    AjaxSolr.DateRangerWidget = AjaxSolr.DualSliderWidget.extend({

	/**
	 * The start date to use for the widget. For internal use only.
	 *
	 * @field
	 * @private
	 * @type Date
	 */
	zeroDate: null,

	/*
	 * The start of the slider, as a year.
	 *
	 * @field
	 * @public
	 * @type Integer
	 */
	startYear: null,

	/**
	 * Sets up the datamin and datamax fields of the widget. This
	 * over-rides any user-supplied values.
	 */
	init: function () {
	    var dy = 0;
	    var zeroDate = new Date(this.startYear, 0, 1);
	    var year0 = zeroDate.getUTCFullYear();
	    var yearMax = Date.today().getUTCFullYear() + 1;

	    // Can we not use TimeSpan for this?
	    for (var y = year0; y < yearMax; y++) {
		for (var m = 0; m < 12; m++) {
		    dy += Date.getDaysInMonth(y, m);
		}
	    }

	    this.datamin = 0;
	    this.datamax = dy;
	    this.zeroDate = zeroDate;

	},

	dayToDate: function (theday) {
	  return this.zeroDate.clone().addDays(theday);
	},

	fromFacet: function (value) {
	    var date = new Date(value);
	    var span = new TimeSpan(date - this.zeroDate);
	    return span.getDays();
	},

	toFacet: function (value) {
	    return this.dayToDate(value).toISOString();
	},
	
	toDisplay: function(value) {
	    return this.dayToDate(value).toString("d-MMM-yyyy");

	}

    });

})(jQuery);
