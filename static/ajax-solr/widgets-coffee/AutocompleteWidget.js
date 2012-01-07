(function() {
  var $, doADSProxy2, root;
  root = typeof exports !== "undefined" && exports !== null ? exports : this;
  $ = jQuery;
  doADSProxy2 = function(urlpath, datastring, callback) {
    return $.post("" + SITEPREFIX + "/adsproxy2", JSON.stringify({
      urlpath: urlpath,
      method: 'POST',
      data: {
        bibcode: datastring,
        data_type: 'HTML'
      }
    }), callback);
  };
  AjaxSolr.AutocompleteWidget = AjaxSolr.AbstractFacetWidget.extend({
    fieldmap: {},
    afterRequest: function() {
      var callback, field, getjsonstring, params, self, _i, _len, _ref;
      $('#thrower').hide();
      $('#metricsthrower').hide();
      $('#numpubs').hide();
      $(this.target).find('input').val('');
      self = this;
      $(this.target).find('input').unbind().bind('keydown', function(e) {
        var value;
        if (self.requestSent === false && e.which === 13) {
          value = $(this).val();
          console.log("value is", value);
          if (value && self.add(value)) {
            return self.manager.doRequest(0);
          }
        }
      });
      callback = function(response) {
        var ele, facet, faceter, facetfields, field, fieldname, list, listuse, methandler, nobsvs, npubs, obsvs, othertab, poststring, pubs, resHandler, shownpubs, throwhref, throwurlist, val, _i, _len, _ref, _ref2, _ref3;
        list = [];
        obsvs = [];
        pubs = [];
        facetfields = response.facet_counts.facet_fields;
        console.log("BB", self.fields, facetfields);
        _ref = self.fields;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          field = _ref[_i];
          _ref2 = facetfields[field];
          for (facet in _ref2) {
            val = _ref2[facet];
            if (field === 'obsids_s') {
              obsvs.push(facet);
            }
            if (field === 'bibcode') {
              pubs.push(facet);
            }
            fieldname = (_ref3 = self.fieldmap[field]) != null ? _ref3 : field;
            list.push({
              field: field,
              value: facet,
              text: "" + facet + " (" + val + ") - " + fieldname
            });
          }
        }
        npubs = pubs.length;
        nobsvs = obsvs.length;
        console.log("INAUTOWIDGET", self.tab, 'pubs', npubs, 'obsvs', nobsvs);
        if (self.tab === 'publications') {
          othertab = 'observations';
          faceter = 'obsids_s';
          listuse = obsvs;
        }
        if (self.tab === 'observations') {
          othertab = 'publications';
          faceter = 'bibcode';
          listuse = pubs;
        }
        shownpubs = false;
        if (npubs < 500) {
          poststring = pubs.join(",");
          methandler = function() {
            var hiddenformdiv;
            hiddenformdiv = "<div id=\"tempform\" style=\"display:none\"><form name=\"tempformform\" method=\"post\" action=\"http://adsabs.harvard.edu/tools/metrics\">\n<input type=\"hidden\" name=\"bibcode\" value=\"" + poststring + "\">\n<input type=\"hidden\" name=\"service\" value=\"yes\">\n<input type=\"submit\" name=\"submit\" id=\"tempformsubmit\" value=\"submit\"/></form></div>";
            $('body').append(hiddenformdiv);
            console.log("HERE", hiddenformdiv);
            $.fancybox({
              type: 'iframe',
              href: dastaticprefix + '/hiddenform.html',
              autoDimensions: false,
              width: 1024,
              height: 768,
              scrolling: 'yes'
            });
            return false;
          };
          $('#metricsthrower').unbind('click').bind('click', methandler);
          $('#metricsthrower').show();
          $('#numpubs').text("(" + npubs + " pubs)");
          shownpubs = true;
        }
        if (listuse.length > 0) {
          throwurlist = (function() {
            var _j, _len2, _results;
            _results = [];
            for (_j = 0, _len2 = listuse.length; _j < _len2; _j++) {
              ele = listuse[_j];
              _results.push("" + (encodeURIComponent(ele)));
            }
            return _results;
          })();
          throwhref = "" + root.dasiteprefix + "/explorer/" + othertab + "#fq=" + faceter + "%3A" + (throwurlist.join('%20OR%20'));
          console.log("THROWHREFLENGTH", throwhref.length);
          if (throwhref.length < 3500) {
            $('#thrower').attr('href', throwhref);
            $('#thrower').show();
            if (!shownpubs) {
              $('#numpubs').text("(" + npubs + " pubs)");
            }
            shownpubs = true;
          }
        }
        if (self.tab !== 'publications' && shownpubs) {
          $('#numpubs').show();
        }
        resHandler = function(err, facet) {
          var nval;
          self.requestSent = true;
          console.log("in RESHANDLER", facet);
          nval = "" + facet.field + ":" + (AjaxSolr.Parameter.escapeValue(facet.value));
          if (self.manager.store.addByValue('fq', nval)) {
            return self.manager.doRequest(0);
          }
        };
        self.requestSent = false;
        return $(self.target).find('input').unautocomplete().autocomplete(list, {
          formatItem: function(facet) {
            return facet.text;
          }
        }).result(resHandler);
      };
      params = [self.manager.store.hash, 'q=*:*&rows=0&facet=true&facet.limit=-1&facet.mincount=1&json.nl=map'];
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
