(function() {
  var $;
  $ = jQuery;
  AjaxSolr.AstroExplorerStore = AjaxSolr.ParameterHashStore.extend({
    isMultiple: function(name) {
      return name.match(/^(?:bf|bq|text|facet\.date|facet\.date\.other|facet\.date\.include|facet\.field|facet\.pivot|facet\.range|facet\.range\.other|facet\.range\.include|facet\.query|fq|group\.field|group\.func|group\.query|stats\.field|pf|qf)$/);
    },
    parseString: function(str) {
      var pair, param, _i, _len, _ref;
      _ref = str.split('&');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pair = _ref[_i];
        if (pair) {
          param = new AjaxSolr.Parameter();
          param.parseString(pair);
          if (AjaxSolr.isArray(param.value)) {
            param.value = param.value.join(',');
          }
          this.add(param.name, param);
        }
      }
      return true;
    }
  });
}).call(this);
