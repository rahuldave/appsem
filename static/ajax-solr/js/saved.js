(function() {
  var $, createSavedObservationSection, createSavedObservations, createSavedPublicationSection, createSavedPublications, createSavedSearchSection, createSavedSearches, doADSProxy, getBibTexFromADS, handleItemsWithPK, handleObservations, handlePublications, handleSearches, makeObsvRow, makePubRow, makeSearchRow, makeSearchText, noSavedObservations, noSavedPublications, noSavedSearches, saveToGroup, saveToMyADS, savemap, submitDeleteAction, tsortopts;
  $ = jQuery;
  savemap = {
    obsvs: 'obsv',
    searches: 'search',
    pubs: 'pub'
  };
  doADSProxy = function(urlpath, callback) {
    return $.post("" + SITEPREFIX + "/adsproxy", JSON.stringify({
      urlpath: urlpath
    }), callback);
  };
  submitDeleteAction = function(path, idname, recreate, groupName) {
    if (groupName == null) {
      groupName = 'default';
    }
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
      map.group = groupName;
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
  handleItemsWithPK = function(handler, itemstype, recreate) {
    return function() {
      var data, ele, fqGroupName, ihash, item, items, objectsToSave, thetype, _i, _len;
      console.log('in stgh', itemstype, $(this.form));
      items = (function() {
        var _i, _len, _ref, _results;
        _ref = $(this.form).find('input[type=checkbox][checked|=true]');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          _results.push(item.value);
        }
        return _results;
      }).call(this);
      thetype = "saved" + savemap[itemstype];
      objectsToSave = [];
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        ele = items[_i];
        ihash = {};
        ihash[thetype] = ele;
        objectsToSave.push(ihash);
      }
      console.log(items, objectsToSave, $(this.form).find('.groupselect option:selected'));
      fqGroupName = $(this.form).find('.groupselect option:selected')[0].text;
      if (objectsToSave.length === 0) {
        alert("No " + itemstype + " have been selected.");
        return false;
      }
      data = {
        fqGroupName: fqGroupName,
        objectsToSave: objectsToSave
      };
      return handler(itemstype, data, recreate);
    };
  };
  saveToGroup = function(itemstype, map, recreate) {
    console.log("inwith", map, "" + SITEPREFIX + "/save" + itemstype + "togroup");
    $.post("" + SITEPREFIX + "/save" + itemstype + "togroup", JSON.stringify(map), function(data) {
      console.log("save rets", data);
      recreate();
      return false;
    });
    return false;
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
    var ele, groupsintext, scpts;
    groupsintext = (function() {
      var _i, _len, _ref, _results;
      _ref = s.groupsin;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ele = _ref[_i];
        _results.push('<a href="' + ("" + SITEPREFIX + "/explorer/group?fqGroupName=" + ele) + '">' + ele.split('/').pop() + '</a>');
      }
      return _results;
    })();
    scpts = searchToText(s.searchuri, fieldname_map);
    console.log(s.searchtext, s.searchuri, scpts);
    return [$('<input type="checkbox" name="searchid"/>').attr('value', s.searchuri), $('<span/>').attr('value', s.searchtime).text(s.searchtimestr), $('<a/>').attr('href', "" + SITEPREFIX + "/explorer/" + s.searchuri).text(scpts.join(" ")), $('<span/>').html(groupsintext.join(', '))];
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
    $div.append(AjaxSolr.theme('saved_items', 'searches', ['Date saved', 'Search terms', 'Groups'], rows, handleItemsWithPK(saveToGroup, 'searches', createSavedSearches), null, null));
    $('#saved-searches-form').submit(submitDeleteAction('/deletesearches', 'searchid', createSavedSearches));
    return $('#saved-searches-table').tablesorter(tsortopts);
  };
  createSavedPublications = function() {
    $('div#saved-pubs').empty();
    return $.getJSON(SITEPREFIX + '/savedpubs2', function(data) {
      var pubs;
      console.log("DATA", data);
      pubs = data.savedpubs;
      if (pubs.haspubs) {
        return createSavedPublicationSection(pubs.savedpubs);
      } else {
        return noSavedPublications();
      }
    });
  };
  makePubRow = function(p) {
    var ele, groupsintext;
    groupsintext = (function() {
      var _i, _len, _ref, _results;
      _ref = p.groupsin;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ele = _ref[_i];
        _results.push('<a href="' + ("" + SITEPREFIX + "/explorer/group?fqGroupName=" + ele) + '">' + ele.split('/').pop() + '</a>');
      }
      return _results;
    })();
    return [$('<input type="checkbox" name="pubid"/>').attr('value', p.pubid), $('<span/>').attr('value', p.pubtime).text(p.pubtimestr), $('<a/>').attr('href', "" + SITEPREFIX + "/explorer/publications#fq=" + p.linkuri + "&q=*%3A*").text(p.linktext), $('<span class="bibcode"/>').text(p.bibcode), $('<span/>').html(groupsintext.join(', '))];
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
    $div.append(AjaxSolr.theme('saved_items', 'pubs', ['Date saved', 'Title', 'Bibcode', 'Groups'], rows, handleItemsWithPK(saveToGroup, 'pubs', createSavedPublications), handlePublications(getBibTexFromADS), handlePublications(saveToMyADS)));
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
    var ele, groupsintext;
    groupsintext = (function() {
      var _i, _len, _ref, _results;
      _ref = o.groupsin;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ele = _ref[_i];
        _results.push('<a href="' + ("" + SITEPREFIX + "/explorer/group?fqGroupName=" + ele) + '">' + ele.split('/').pop() + '</a>');
      }
      return _results;
    })();
    return [$('<input type="checkbox" name="obsvid"/>').attr('value', o.obsvid), $('<span/>').attr('value', o.obsvtime).text(o.obsvtimestr), $('<a/>').attr('href', "" + SITEPREFIX + "/explorer/observations#fq=" + o.linkuri + "&q=*%3A*").text(o.linktext), $('<span class="bibcode"/>').text(o.target), $('<span/>').html(groupsintext.join(', '))];
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
    $div.append(AjaxSolr.theme('saved_items', 'obsvs', ['Date Observed', 'Obsid', 'Target', 'Groups'], rows, handleItemsWithPK(saveToGroup, 'obsvs', createSavedObservations), null, null));
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
