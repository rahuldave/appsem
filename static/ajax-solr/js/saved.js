(function() {
  var $, createSavedObservationSection, createSavedObservations, createSavedPublicationSection, createSavedPublications, createSavedSearchSection, createSavedSearches, doADSProxy, getBibTexFromADS, handleObservations, handlePublications, handleSearches, makeObsvRow, makePubRow, makeSearchRow, makeSearchText, noSavedObservations, noSavedPublications, noSavedSearches, saveToMyADS, submitDeleteAction, tsortopts;
  $ = jQuery;
  doADSProxy = function(urlpath, callback) {
    return $.post("" + SITEPREFIX + "/adsproxy", JSON.stringify({
      urlpath: urlpath
    }), callback);
  };
  submitDeleteAction = function(path, idname, recreate) {
    return function() {
      var data, item, map;
      data = (function() {
        var _i, _len, _ref, _results;
        _ref = $(this).find('input[type=checkbox][checked|=true]');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          _results.push(item.value);
        }
        return _results;
      }).call(this);
      if (data.length === 0) {
        alert("No items have been selected.");
        return false;
      }
      map = {
        action: "delete"
      };
      map[idname] = data;
      $.post(SITEPREFIX + path, JSON.stringify(map), function(resp) {
        recreate();
        return false;
      });
      return false;
    };
  };
  getBibTexFromADS = function(bibcodes) {
    return doADSProxy('/cgi-bin/nph-bib_query?data_type=BIBTEX&' + bibcodes.map(encodeURIComponent).join('&'), function(resp) {
      $.fancybox("<pre>" + resp + "</pre>");
      return false;
    });
  };
  saveToMyADS = function(bibcodes) {
    var item;
    return doADSProxy('/cgi-bin/nph-abs_connect?library=Add&' + ((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = bibcodes.length; _i < _len; _i++) {
        item = bibcodes[_i];
        _results.push("bibcode=" + (encodeURIComponent(item)));
      }
      return _results;
    })()).join('&'), function(resp) {
      $.fancybox(resp);
      return false;
    });
  };
  handlePublications = function(handler) {
    return function() {
      var data, item;
      data = (function() {
        var _i, _len, _ref, _results;
        _ref = $(this.form).find('input[type=checkbox][checked|=true]').parent().nextAll('td').find('span.bibcode');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          _results.push($(item).text());
        }
        return _results;
      }).call(this);
      if (data.length === 0) {
        alert("No publications have been selected.");
        return false;
      }
      $.fancybox.showActivity();
      return handler(data);
    };
  };
  handleObservations = function(handler) {
    return function() {
      var data, item;
      data = (function() {
        var _i, _len, _ref, _results;
        _ref = $(this.form).find('input[type=checkbox][checked|=true]').parent().nextAll('td').find('span.bibcode');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          _results.push($(item).text());
        }
        return _results;
      }).call(this);
      if (data.length === 0) {
        alert("No observations have been selected.");
        return false;
      }
      $.fancybox.showActivity();
      return handler(data);
    };
  };
  handleSearches = function(handler) {
    return function() {
      var data, item, ndata, nrows, query;
      data = (function() {
        var _i, _len, _ref, _results;
        _ref = $(this.form).find('input[type=checkbox][checked|=true]');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          _results.push(item.value);
        }
        return _results;
      }).call(this);
      ndata = data.length;
      if (ndata === 0) {
        alert("Please select one search.");
        return false;
      } else if (ndata > 1) {
        alert("Only one search can be retrieved at a time (you have selected " + ndata + ")");
        return false;
      }
      $.fancybox.showActivity();
      nrows = 100;
      query = "" + SOLRURL + "select?" + data[0] + "&fl=bibcode&rows=" + nrows + "&wt=json&json.wrf=?";
      return $.getJSON(query, function(response) {
        var bibcodes, doc, nf, resp;
        resp = response.response;
        nf = resp.numFound;
        if (nf === 0) {
          $.fancybox.hideActivity();
          alert('No publications found for this search.');
          return false;
        } else if (nf > nrows) {
          alert("Warning: results restricted to " + nrows + " of " + nf + " publications.");
        }
        bibcodes = (function() {
          var _i, _len, _ref, _results;
          _ref = resp.docs;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            doc = _ref[_i];
            _results.push(doc.bibcode);
          }
          return _results;
        })();
        return handler(bibcodes);
      });
    };
  };
  tsortopts = {
    headers: {
      0: {
        sorter: false
      }
    },
    textExtraction: function(node) {
      var val;
      val = $(node).find('span').attr('value');
      return val != null ? val : $(node).text();
    }
  };
  createSavedSearches = function() {
    $('div#saved-searches').empty();
    return $.getJSON(SITEPREFIX + '/savedsearches2', function(data) {
      var searches;
      searches = data.savedsearches;
      if (searches.hassearches) {
        return createSavedSearchSection(searches.savedsearches);
      } else {
        return noSavedSearches();
      }
    });
  };
  makeSearchText = function(urifrag) {
    var $search, dummy, scpt, scpts;
    scpts = searchToText(urifrag, fieldname_map);
    $search = $('<a/>').attr('href', "" + SITEPREFIX + "/explorer/publications#" + urifrag);
    dummy = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = scpts.length; _i < _len; _i++) {
        scpt = scpts[_i];
        _results.push($search.append($('<div/>').text(scpt)));
      }
      return _results;
    })();
    return $search;
  };
  makeSearchRow = function(s) {
    return [$('<input type="checkbox" name="searchid"/>').attr('value', s.searchuri), $('<span/>').attr('value', s.searchtime).text(s.searchtimestr), makeSearchText(s.searchuri)];
  };
  createSavedSearchSection = function(searches) {
    var $div, nsearch, rows, s;
    nsearch = searches.length;
    rows = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = searches.length; _i < _len; _i++) {
        s = searches[_i];
        _results.push(makeSearchRow(s));
      }
      return _results;
    })();
    $div = $('div#saved-searches');
    $div.append(AjaxSolr.theme('saved_title', 'Saved Searches'));
    $div.append(AjaxSolr.theme('saved_items', 'searches', ['Date saved', 'Search terms'], rows, handleSearches(getBibTexFromADS), handleSearches(saveToMyADS)));
    $('#saved-searches-form').submit(submitDeleteAction('/deletesearches', 'searchid', createSavedSearches));
    return $('#saved-searches-table').tablesorter(tsortopts);
  };
  createSavedPublications = function() {
    $('div#saved-pubs').empty();
    return $.getJSON(SITEPREFIX + '/savedpubs2', function(data) {
      var pubs;
      pubs = data.savedpubs;
      if (pubs.haspubs) {
        return createSavedPublicationSection(pubs.savedpubs);
      } else {
        return noSavedPublications();
      }
    });
  };
  makePubRow = function(p) {
    return [$('<input type="checkbox" name="pubid"/>').attr('value', p.pubid), $('<span/>').attr('value', p.pubtime).text(p.pubtimestr), $('<a/>').attr('href', "" + SITEPREFIX + "/explorer/publications#fq=" + p.linkuri + "&q=*%3A*").text(p.linktext), $('<span class="bibcode"/>').text(p.bibcode)];
  };
  createSavedPublicationSection = function(pubs) {
    var $div, npubs, pub, rows;
    npubs = pubs.length;
    rows = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = pubs.length; _i < _len; _i++) {
        pub = pubs[_i];
        _results.push(makePubRow(pub));
      }
      return _results;
    })();
    $div = $('div#saved-pubs');
    $div.append(AjaxSolr.theme('saved_title', 'Saved Publications'));
    $div.append(AjaxSolr.theme('saved_items', 'pubs', ['Date saved', 'Title', 'Bibcode'], rows, handlePublications(getBibTexFromADS), handlePublications(saveToMyADS)));
    $('#saved-pubs-form').submit(submitDeleteAction('/deletepubs', 'pubid', createSavedPublications));
    return $('#saved-pubs-table').tablesorter(tsortopts);
  };
  createSavedObservations = function() {
    $('div#saved-obsvs').empty();
    return $.getJSON(SITEPREFIX + '/savedobsvs2', function(data) {
      var obsvs;
      obsvs = data.savedobsvs;
      if (obsvs.hasobsvs) {
        return createSavedObservationSection(obsvs.savedobsvs);
      } else {
        return noSavedObservations();
      }
    });
  };
  makeObsvRow = function(o) {
    return [$('<input type="checkbox" name="obsvid"/>').attr('value', o.obsvid), $('<span/>').attr('value', o.obsvtime).text(o.obsvtimestr), $('<a/>').attr('href', "" + SITEPREFIX + "/explorer/observations#fq=" + o.linkuri + "&q=*%3A*").text(o.linktext), $('<span class="bibcode"/>').text(o.target)];
  };
  createSavedObservationSection = function(obsvs) {
    var $div, nobsvs, obsv, rows;
    nobsvs = obsvs.length;
    rows = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = obsvs.length; _i < _len; _i++) {
        obsv = obsvs[_i];
        _results.push(makeObsvRow(obsv));
      }
      return _results;
    })();
    $div = $('div#saved-obsvs');
    $div.append(AjaxSolr.theme('saved_title', 'Saved Observations'));
    $div.append(AjaxSolr.theme('saved_items', 'obsvs', ['Date Observed', 'Title', 'Target'], rows, null, null));
    $('#saved-obsvs-form').submit(submitDeleteAction('/deleteobsvs', 'obsvid', createSavedObservations));
    return $('#saved-obsvs-table').tablesorter(tsortopts);
  };
  noSavedSearches = function() {
    $('div#saved-searches').append(AjaxSolr.theme('saved_title', 'No saved searches'));
    return true;
  };
  noSavedPublications = function() {
    $('div#saved-pubs').append(AjaxSolr.theme('saved_title', 'No saved publications'));
    return true;
  };
  noSavedObservations = function() {
    $('div#saved-obsvs').append(AjaxSolr.theme('saved_title', 'No saved observations'));
    return true;
  };
  mediator.subscribe('user/login', function(email) {
    createSavedSearches();
    createSavedPublications();
    return createSavedObservations();
  });
}).call(this);
