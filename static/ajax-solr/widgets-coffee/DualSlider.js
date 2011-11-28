(function() {
  var $;
  $ = jQuery;
  AjaxSolr.DualSliderWidget = AjaxSolr.AbstractFacetWidget.extend({
    multivalue: false,
    afterRequest: function() {
      var fcon, fhi, flo, fstr, idx, pqvalues, self, stats, themax, themin, _i, _len;
      self = this;
      stats = self.manager.response.stats.stats_fields[self.field];
      if ((stats != null ? stats.count : void 0) > 0) {
        themin = self.fromFacet(stats.min);
        themax = self.fromFacet(stats.max);
      } else {
        themin = self.datamin;
        themax = self.datamax;
      }
      pqvalues = self.manager.store.values('fq');
      for (_i = 0, _len = pqvalues.length; _i < _len; _i++) {
        fcon = pqvalues[_i];
        idx = fcon.indexOf(':');
        if (fcon.substr(0, idx) === self.field) {
          fstr = fcon.substr(idx + 2, fcon.length - 3 - idx);
          idx = fstr.indexOf(' TO ');
          flo = fstr.substr(0, idx).trim();
          fhi = fstr.substr(idx + 4).trim();
          if (flo !== '') {
            themin = self.fromFacet(flo);
          }
          if (fhi !== '') {
            themax = self.fromFacet(fhi);
          }
        }
      }
      $(self.target).slider('destroy').slider({
        range: true,
        max: self.datamax,
        min: self.datamin,
        step: self.datastep,
        values: [themin, themax],
        slide: function(event, ui) {
          return self.adjustText(ui.values);
        },
        stop: function(event, ui) {
          var val;
          val = "[" + (self.toFacet(ui.values[0])) + " TO " + (self.toFacet(ui.values[1])) + "]";
          if (self.set(val)) {
            return self.manager.doRequest(0);
          }
        }
      });
      return self.adjustText($(self.target).slider("values"));
    },
    adjustText: function(_arg) {
      var hi, lo, txt;
      lo = _arg[0], hi = _arg[1];
      if (lo === hi) {
        txt = this.toDisplay(lo);
      } else {
        txt = "" + (this.toDisplay(lo)) + " to " + (this.toDisplay(hi));
      }
      return $("#" + this.id + "_amount").text(txt);
    },
    toDisplay: function(val) {
      return val;
    },
    toFacet: function(val) {
      return val;
    },
    fromFacet: function(val) {
      return val;
    }
  });
}).call(this);
