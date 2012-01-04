(function() {
  var $, createSavedObservationSection, createSavedObservations, createSavedPublicationSection, createSavedPublications, createSavedSearchSection, createSavedSearches, createTagsList, doADSProxy, getBibTexFromADS, handleObservations, handlePublications, handleSearches, makeObsvRow, makePubRow, makeSearchRow, makeSearchText, noSavedObservations, noSavedPublications, noSavedSearches, saveToMyADS, submitDeleteAction, tsortopts;
  $ = jQuery;
  Array.prototype.unique = function() {
    var key, output, value, _ref, _results;
    output = {};
    for (key = 0, _ref = this.length; 0 <= _ref ? key < _ref : key > _ref; 0 <= _ref ? key++ : key--) {
      output[this[key]] = this[key];
    }
    _results = [];
    for (key in output) {
      value = output[key];
      _results.push(value);
    }
    return _results;
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
      map.fqGroupName = groupName;
      map.deltype = idname;
      map.items = data;
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
  createTagsList = function() {
    $('div#tagslist').empty();
    return $.getJSON(SITEPREFIX + ("/gettagsforgroup?fqGroupName=" + dagroup), function(data) {
      var ele, tags, tagsintext;
      tags = data.gettagsforgroup;
      tagsintext = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = tags.length; _i < _len; _i++) {
          ele = tags[_i];
          _results.push('<li><a href="' + ("" + SITEPREFIX + "/explorer/group?fqGroupName=" + dagroup + "&tagName=" + ele) + '">' + ele.split('/').pop() + '</a></li>');
        }
        return _results;
      })();
      console.log("tagsintext", tagsintext);
      return $('div#tagslist').append('<h3>Tags:</h3>').append('<ul/>').append(tagsintext.join(''));
    });
  };
  createSavedSearches = function(tagsbool) {
    var url;
    if (tagsbool == null) {
      tagsbool = null;
    }
    $('div#saved-searches').empty();
    if (datag === 'default') {
      url = "/savedsearchesforgroup2?fqGroupName=" + dagroup;
    } else {
      url = "/savedsearchesfortag?tagName=" + datag + "&fqGroupName=" + dagroup;
    }
    return $.getJSON(SITEPREFIX + url, function(data) {
      var searches, _ref;
      console.log("DATA IS", data);
      searches = (_ref = data.savedsearchesfortag) != null ? _ref : data.savedsearchesforgroup;
      if (searches.hassearches) {
        createSavedSearchSection(searches.savedsearches);
      } else {
        noSavedSearches();
      }
      if (!tagsbool) {
        return createTagsList();
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
    var ele, gin, groupsintext, idx, sby, scpts, tagsintext;
    gin = s.groupsin;
    sby = s.searchby;
    console.log("sby", sby, "gin", gin, sby[0]);
    groupsintext = (function() {
      var _ref, _results;
      _results = [];
      for (idx = 0, _ref = gin.length; 0 <= _ref ? idx < _ref : idx > _ref; 0 <= _ref ? idx++ : idx--) {
        _results.push('by ' + sby[idx].split('@')[0] + ' in <a href="' + ("" + SITEPREFIX + "/explorer/group?fqGroupName=" + gin[idx]) + '">' + gin[idx].split('/').pop() + '</a>');
      }
      return _results;
    })();
    tagsintext = (function() {
      var _i, _len, _ref, _results;
      _ref = s.tagsin.unique();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ele = _ref[_i];
        _results.push('<a href="' + ("" + SITEPREFIX + "/explorer/group?fqGroupName=" + dagroup + "&tagName=" + ele) + '">' + ele.split('/').pop() + '</a>');
      }
      return _results;
    })();
    scpts = searchToText(s.searchuri, fieldname_map);
    console.log(s.searchtext, s.searchuri, scpts);
    return [$('<input type="checkbox" name="searchid"/>').attr('value', s.searchuri), $('<span/>').attr('value', s.searchtime).text(s.searchtimestr), $('<a/>').attr('href', "" + SITEPREFIX + "/explorer/" + s.searchuri).text(scpts.join(" | ")), $('<span/>').html(groupsintext.join(', ')), $('<span/>').html(tagsintext.join(', '))];
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
    $div.append(AjaxSolr.theme('saved_items', 'searches', ['Date saved', 'Search terms', 'Groups', 'Tags'], rows, null, null));
    $('#saved-searches-form').submit(submitDeleteAction('/deletesearchesfromgroup', 'searches', createSavedSearches, dagroup));
    return $('#saved-searches-table').tablesorter(tsortopts);
  };
  createSavedPublications = function(tagsbool) {
    var url;
    if (tagsbool == null) {
      tagsbool = null;
    }
    $('div#saved-pubs').empty();
    if (datag === 'default') {
      url = "/savedpubsforgroup2?fqGroupName=" + dagroup;
    } else {
      url = "/savedpubsfortag?tagName=" + datag + "&fqGroupName=" + dagroup;
    }
    return $.getJSON(SITEPREFIX + url, function(data) {
      var pubs, _ref;
      pubs = (_ref = data.savedpubsfortag) != null ? _ref : data.savedpubsforgroup;
      if (pubs.haspubs) {
        createSavedPublicationSection(pubs.savedpubs);
      } else {
        noSavedPublications();
      }
      if (!tagsbool) {
        return createTagsList();
      }
    });
  };
  makePubRow = function(p) {
    var ele, gin, groupsintext, idx, sby, tagsintext;
    gin = p.groupsin;
    sby = p.searchby;
    groupsintext = (function() {
      var _ref, _results;
      _results = [];
      for (idx = 0, _ref = gin.length; 0 <= _ref ? idx < _ref : idx > _ref; 0 <= _ref ? idx++ : idx--) {
        _results.push('by ' + sby[idx].split('@')[0] + ' in <a href="' + ("" + SITEPREFIX + "/explorer/group?fqGroupName=" + gin[idx]) + '">' + gin[idx].split('/').pop() + '</a>');
      }
      return _results;
    })();
    tagsintext = (function() {
      var _i, _len, _ref, _results;
      _ref = p.tagsin.unique();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ele = _ref[_i];
        _results.push('<a href="' + ("" + SITEPREFIX + "/explorer/group?fqGroupName=" + dagroup + "&tagName=" + ele) + '">' + ele.split('/').pop() + '</a>');
      }
      return _results;
    })();
    return [$('<input type="checkbox" name="pubid"/>').attr('value', p.pubid), $('<span/>').attr('value', p.pubtime).text(p.pubtimestr), $('<a/>').attr('href', "" + SITEPREFIX + "/explorer/publications#fq=" + p.linkuri + "&q=*%3A*").text(p.linktext), $('<span class="bibcode"/>').text(p.bibcode), $('<span/>').html(groupsintext.join(', ')), $('<span/>').html(tagsintext.join(', '))];
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
    $div.append(AjaxSolr.theme('saved_items', 'pubs', ['Date saved', 'Title', 'Bibcode', 'Groups', 'Tags'], rows, handlePublications(getBibTexFromADS), handlePublications(saveToMyADS)));
    $('#saved-pubs-form').submit(submitDeleteAction('/deletepubsfromgroup', 'pubs', createSavedPublications, dagroup));
    return $('#saved-pubs-table').tablesorter(tsortopts);
  };
  createSavedObservations = function(tagsbool) {
    var url;
    if (tagsbool == null) {
      tagsbool = null;
    }
    $('div#saved-obsvs').empty;
    if (datag === 'default') {
      url = "/savedobsvsforgroup2?fqGroupName=" + dagroup;
    } else {
      url = "/savedobsvsfortag?tagName=" + datag + "&fqGroupName=" + dagroup;
    }
    return $.getJSON(SITEPREFIX + url, function(data) {
      var obsvs, _ref;
      obsvs = (_ref = data.savedobsvsfortag) != null ? _ref : data.savedobsvsforgroup;
      if (obsvs.hasobsvs) {
        createSavedObservationSection(obsvs.savedobsvs);
      } else {
        noSavedObservations();
      }
      if (!tagsbool) {
        return createTagsList();
      }
    });
  };
  makeObsvRow = function(o) {
    var ele, gin, groupsintext, idx, sby, tagsintext;
    gin = o.groupsin;
    sby = o.searchby;
    console.log(o.tagsin, gin, sby);
    groupsintext = (function() {
      var _ref, _results;
      _results = [];
      for (idx = 0, _ref = gin.length; 0 <= _ref ? idx < _ref : idx > _ref; 0 <= _ref ? idx++ : idx--) {
        _results.push('by ' + sby[idx].split('@')[0] + ' in <a href="' + ("" + SITEPREFIX + "/explorer/group?fqGroupName=" + gin[idx]) + '">' + gin[idx].split('/').pop() + '</a>');
      }
      return _results;
    })();
    tagsintext = (function() {
      var _i, _len, _ref, _results;
      _ref = o.tagsin.unique();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ele = _ref[_i];
        _results.push('<a href="' + ("" + SITEPREFIX + "/explorer/group?fqGroupName=" + dagroup + "&tagName=" + ele) + '">' + ele.split('/').pop() + '</a>');
      }
      return _results;
    })();
    return [$('<input type="checkbox" name="obsvid"/>').attr('value', o.obsvid), $('<span/>').attr('value', o.obsvtime).text(o.obsvtimestr), $('<a/>').attr('href', "" + SITEPREFIX + "/explorer/observations#fq=" + o.linkuri + "&q=*%3A*").text(o.linktext), $('<span class="bibcode"/>').text(o.target), $('<span/>').html(groupsintext.join(', ')), $('<span/>').html(tagsintext.join(', '))];
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
    $div.append(AjaxSolr.theme('saved_items', 'obsvs', ['Date Observed', 'Obsid', 'Target', 'Groups', 'Tags'], rows, null, null));
    $('#saved-obsvs-form').submit(submitDeleteAction('/deleteobsvsfromgroup', 'obsvs', createSavedObservations, dagroup));
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
    createSavedSearches(true);
    createSavedPublications(true);
    createSavedObservations(true);
    return createTagsList();
  });
}).call(this);
