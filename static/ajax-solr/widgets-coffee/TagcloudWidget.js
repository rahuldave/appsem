(function() {
  AjaxSolr.TagcloudWidget = AjaxSolr.AbstractFacetWidget.extend({
    justfacetHandler: function(value) {
      var self;
      self = this;
      return function() {
        self.manager.store.remove('fq');
        self.add(value);
        self.manager.doRequest(0);
        return false;
      };
    },
    afterRequest: function() {
      var $tag, count, facet, maxCount, objectedItems, value, _i, _len, _ref, _ref2;
      maxCount = 0;
      objectedItems = [];
      _ref = this.manager.response.facet_counts.facet_fields[this.field];
      for (facet in _ref) {
        value = _ref[facet];
        count = parseInt(value);
        if (count > maxCount) {
          maxCount = count;
        }
        objectedItems.push({
          facet: facet,
          count: count
        });
      }
      if (objectedItems.length === 0) {
        $(this.target).html(AjaxSolr.theme('no_items_found'));
        return;
      }
      objectedItems.sort(function(a, b) {
        if (a.facet < b.facet) {
          return -1;
        } else {
          return 1;
        }
      });
      $(this.target).empty();
      for (_i = 0, _len = objectedItems.length; _i < _len; _i++) {
        _ref2 = objectedItems[_i], facet = _ref2.facet, count = _ref2.count;
        $tag = AjaxSolr.theme('tag', facet, count, parseInt(count / maxCount * 10), this.clickHandler(facet), this.justfacetHandler(facet));
        $(this.target).append($tag);
      }
      return true;
    }
  });
}).call(this);
