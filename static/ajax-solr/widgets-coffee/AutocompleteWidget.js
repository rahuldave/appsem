(function() {
  var $;
  $ = jQuery;
  AjaxSolr.AutocompleteWidget = AjaxSolr.AbstractFacetWidget.extend({
    fieldmap: {},
    afterRequest: function() {
      var callback, field, getjsonstring, params, self, _i, _len, _ref;
      $(this.target).find('input').val('');
      self = this;
      $(this.target).find('input').unbind().bind('keydown', function(e) {
        var value;
        if (self.requestSent === false && e.which === 13) {
          value = $(this).val();
          if (value && self.add(value)) {
            return self.manager.doRequest(0);
          }
        }
      });
      callback = function(response) {
        var facet, field, fieldname, list, resHandler, val, _i, _len, _ref, _ref2, _ref3;
        list = [];
        _ref = self.fields;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          field = _ref[_i];
          _ref2 = response.facet_counts.facet_fields[field];
          for (facet in _ref2) {
            val = _ref2[facet];
            fieldname = (_ref3 = self.fieldmap[field]) != null ? _ref3 : field;
            list.push({
              field: field,
              value: facet,
              text: "" + facet + " (" + val + ") - " + fieldname
            });
          }
        }
        self.requestSent = false;
        resHandler = function(err, facet) {
          var nval;
          self.requestSent = true;
          nval = "" + facet.field + ":" + (AjaxSolr.Parameter.escapeValue(facet.value));
          if (self.manager.store.addByValue('fq', nval)) {
            return self.manager.doRequest(0);
          }
        };
        return $(self.target).find('input').unautocomplete().autocomplete(list, {
          formatItem: function(facet) {
            return facet.text;
          }
        }).result(resHandler);
      };
      params = [self.manager.store.hash, 'facet=true&facet.limit=-1&facet.mincount=1&json.nl=map'];
      _ref = self.fields;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        field = _ref[_i];
        params.push("facet.field=" + field);
      }
      getjsonstring = this.manager.solrUrl + 'select?' + params.join('&') + '&wt=json&json.wrf=?';
      return $.getJSON(getjsonstring, {}, callback);
    }
  });
}).call(this);
