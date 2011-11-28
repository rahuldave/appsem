(function() {
  var $, zeroDate;
  $ = jQuery;
  zeroDate = new Date(1977, 0, 1);
  AjaxSolr.DateRangerWidget = AjaxSolr.DualSliderWidget.extend({
    zeroDate: null,
    startYear: null,
    init: function() {
      var dy, m, y, year0, yearMax;
      dy = 0;
      zeroDate = new Date(this.startYear, 0, 1);
      year0 = zeroDate.getUTCFullYear();
      yearMax = Date.today().getUTCFullYear() + 1;
      y = year0;
      while (y < yearMax) {
        for (m = 0; m < 12; m++) {
          dy += Date.getDaysInMonth(y, m);
        }
        y++;
      }
      this.datamin = 0;
      this.datamax = dy;
      this.zeroDate = zeroDate;
      return true;
    },
    dayToDate: function(theday) {
      return this.zeroDate.clone().addDays(theday);
    },
    fromFacet: function(value) {
      var date;
      date = new Date(value);
      return new TimeSpan(date - this.zeroDate).getDays();
    },
    toFacet: function(value) {
      return this.dayToDate(value).toISOString();
    },
    toDisplay: function(value) {
      return this.dayToDate(value).toString("d-MMM-yyyy");
    }
  });
}).call(this);
