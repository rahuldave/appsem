(function() {
  var $;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  $ = jQuery;
  AjaxSolr.CurrentSearchWidget = AjaxSolr.AbstractWidget.extend({
    fieldmap: {},
    allowmulti: [],
    splitConstraint: function(constraint) {
      var field, i, label, spobject;
      i = constraint.indexOf(':');
      field = constraint.substr(0, i);
      label = cleanFacetValue(constraint.substr(i + 1));
      spobject = {
        constraint: constraint,
        field: field,
        display: cleanFacetName(field, this.fieldmap),
        label: label
      };
      return spobject;
    },
    pivotHandler: function(constraint) {
      var self;
      self = this;
      return function() {
        self.manager.store.remove('fq');
        self.manager.store.addByValue('fq', constraint);
        self.manager.doRequest(0);
        return false;
      };
    },
    afterRequest: function() {
      var $link, $pivot, $span, $sspan, c, cstr, field, fq, i, labeltext, list, lp, order, self, store, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4;
      self = this;
      fq = self.manager.store.values('fq');
      order = [];
      store = {};
      console.log('fq in here is', fq);
      _ref = (function() {
        var _j, _len, _results;
        _results = [];
        for (_j = 0, _len = fq.length; _j < _len; _j++) {
          cstr = fq[_j];
          _results.push(self.splitConstraint(cstr));
        }
        return _results;
      })();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        labeltext = c.label;
        $span = $('<span/>');
        if ((lp = c.label.search(/OR/)) !== -1) {
          labeltext = c.label.slice(0, lp * 2) + '...';
          console.log(lp, c.label);
          $sspan = $('<span class="facetvalue"/>').html("" + labeltext + " ").twipsy({
            fallback: c.label,
            placement: 'below'
          });
        } else {
          $sspan = $('<span class="facetvalue"/>').html("" + labeltext + " ");
        }
        $link = $('<a class="label important" href="#"/>').html('x').click(self.removeFacet(c.constraint));
        $pivot = AjaxSolr.theme('pivot_link', self.pivotHandler(c.constraint));
        $span.append($sspan).append($link).append($pivot);
        if (_ref2 = c.display, __indexOf.call(order, _ref2) < 0) {
          order.push(c.display);
          store[c.display] = [];
        }
        console.log("&&&&&&", c.field, c.display, self.allowmulti, store[c.display]);
        if ((_ref3 = c.field, __indexOf.call(self.allowmulti, _ref3) >= 0) || store[c.display].length === 0) {
          store[c.display].push($span);
          console.log("LLL", c);
        } else {
          if (self.removeFacet(c.field)) {
            console.log("MMM", c);
            self.manager.doRequest(0);
          }
        }
      }
      list = [];
      for (_j = 0, _len2 = order.length; _j < _len2; _j++) {
        field = order[_j];
        $span = $('<div class="facetconstraints"/>').append($('<span class="facetname"/>').text("" + field + " "));
        for (i = _ref4 = store[field].length - 1; _ref4 <= 0 ? i <= 0 : i >= 0; _ref4 <= 0 ? i++ : i--) {
          $span.append(store[field][i]);
          if (i > 0) {
            $span.append('; ');
          }
        }
        list.push($span);
      }
      if (list.length === 0) {
        $(self.target).html('<div>Viewing all documents!</div>');
      } else {
        if (list.length > 1) {
          list.push($('<a class="label important" href="#"/>').text('remove all').click(function() {
            self.manager.store.remove('fq');
            self.manager.doRequest(0);
            return false;
          }));
        }
        AjaxSolr.theme('list_items', $(self.target), list);
      }
      return true;
    },
    removeFacet: function(facet) {
      var self;
      self = this;
      return function() {
        if (self.manager.store.removeByValue('fq', facet)) {
          self.manager.doRequest(0);
        }
        return false;
      };
    }
  });
}).call(this);
