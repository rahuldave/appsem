(function() {
  var $, createSavedObservationSection, createSavedObservations, createSavedPublicationSection, createSavedPublications, createSavedSearchSection, createSavedSearches, createTagsList, doADSProxy, doThrow, getBibTexFromADS, handleItemsWithPK, handleObservations, handlePublications, handleSearches, makeObsvRow, makePubRow, makeSearchRow, makeSearchText, noSavedObservations, noSavedPublications, noSavedSearches, saveToGroup, saveToMyADS, saveToTag, savemap, submitDeleteAction, tsortopts;

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
    if (groupName == null) groupName = 'default';
    return function() {
      var data, item, map;
      data = (function() {
        var _i, _len, _ref, _results;
        _ref = $(this).find('input[type=checkbox]:checked');
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
        _ref = $(this.form).find('input[type=checkbox]:checked').parent().nextAll('td').find('span.bibcode');
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

  handleItemsWithPK = function(widgetname, handler, itemstype, recreate) {
    return function() {
      var bcodes, data, ele, faceter, fqGroupName, ihash, item, items, objectsToSave, tagName, thetype, throwhref, throwurlist, _i, _len;
      console.log('in stgh', widgetname, itemstype, $(this.form));
      console.log("AAAA", $(this.form).find('input[type=checkbox]'));
      items = (function() {
        var _i, _len, _ref, _results;
        _ref = $(this.form).find('input[type=checkbox]:checked');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          _results.push(item.value);
        }
        return _results;
      }).call(this);
      if (items.length === 0) {
        alert("No items have been selected.");
        return false;
      }
      thetype = "saved" + savemap[itemstype];
      objectsToSave = [];
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        ele = items[_i];
        ihash = {};
        ihash[thetype] = ele;
        objectsToSave.push(ihash);
      }
      if (widgetname === "groups") {
        fqGroupName = $(this.form).find('.groupselect option:selected')[0].text;
        data = {
          fqGroupName: fqGroupName,
          objectsToSave: objectsToSave
        };
      } else if (widgetname === 'tags') {
        tagName = $($(this.form).find('.tagstext')[0]).val();
        data = {
          tagName: tagName,
          objectsToSave: objectsToSave
        };
      } else if (widgetname === 'observations') {
        faceter = 'obsids_s';
        throwurlist = (function() {
          var _j, _len2, _results;
          _results = [];
          for (_j = 0, _len2 = items.length; _j < _len2; _j++) {
            ele = items[_j];
            _results.push("" + (encodeURIComponent(ele)));
          }
          return _results;
        })();
        throwhref = "" + SITEPREFIX + "/explorer/" + widgetname + "#fq=" + faceter + "%3A" + (throwurlist.join('%20OR%20'));
        window.location.href = throwhref;
      } else if (widgetname === 'publications') {
        faceter = 'bibcode';
        bcodes = (function() {
          var _j, _len2, _ref, _results;
          _ref = $(this.form).find('input[type=checkbox]:checked');
          _results = [];
          for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
            item = _ref[_j];
            _results.push($(item).attr('bibcode'));
          }
          return _results;
        }).call(this);
        throwurlist = (function() {
          var _j, _len2, _results;
          _results = [];
          for (_j = 0, _len2 = bcodes.length; _j < _len2; _j++) {
            ele = bcodes[_j];
            _results.push("" + (encodeURIComponent(ele)));
          }
          return _results;
        })();
        throwhref = "" + SITEPREFIX + "/explorer/" + widgetname + "#fq=" + faceter + "%3A" + (throwurlist.join('%20OR%20'));
        window.location.href = throwhref;
      }
      if (objectsToSave.length === 0) {
        alert("No " + itemstype + " have been selected.");
        return false;
      }
      return handler(itemstype, data, recreate);
    };
  };

  doThrow = function() {
    return false;
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

  saveToTag = function(itemstype, map, recreate) {
    console.log("inwith", map, "" + SITEPREFIX + "/save" + itemstype + "totag");
    $.post("" + SITEPREFIX + "/save" + itemstype + "totag", JSON.stringify(map), function(data) {
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
        _ref = $(this.form).find('input[type=checkbox]:checked').parent().nextAll('td').find('span.bibcode');
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
        _ref = $(this.form).find('input[type=checkbox]:checked');
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
    return $.getJSON(SITEPREFIX + '/gettagsforuser', function(data) {
      var ele, tags, tagsintext;
      tags = data.gettagsforuser;
      tagsintext = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = tags.length; _i < _len; _i++) {
          ele = tags[_i];
          _results.push('<li><a href="' + ("" + SITEPREFIX + "/explorer/saved?tagName=" + ele) + '">' + ele.split('/').pop() + '</a></li>');
        }
        return _results;
      })();
      console.log("tagsintext", tagsintext);
      return $('div#tagslist').append('<h3>Tags:</h3>').append('<ul/>').append(tagsintext.join(''));
    });
  };

  createSavedSearches = function(tagbool) {
    var url;
    if (tagbool == null) tagbool = null;
    $('div#saved-searches').empty();
    if (datag === 'default') {
      url = '/savedsearches2';
    } else {
      url = "/savedsearchesfortag?tagName=" + datag;
    }
    return $.getJSON(SITEPREFIX + url, function(data) {
      var searches, _ref;
      searches = (_ref = data.savedsearchesfortag) != null ? _ref : data.savedsearches;
      if (searches.hassearches) {
        createSavedSearchSection(searches.savedsearches);
      } else {
        noSavedSearches();
      }
      if (!tagbool) return createTagsList();
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
    var ele, groupsintext, scpts, tagsintext;
    groupsintext = (function() {
      var _i, _len, _ref, _results;
      _ref = s.groupsin.unique();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ele = _ref[_i];
        _results.push('<a href="' + ("" + SITEPREFIX + "/explorer/group?fqGroupName=" + ele) + '">' + ele.split('/').pop() + '</a>');
      }
      return _results;
    })();
    tagsintext = (function() {
      var _i, _len, _ref, _results;
      _ref = s.tagsin.unique();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ele = _ref[_i];
        _results.push('<a href="' + ("" + SITEPREFIX + "/explorer/saved?tagName=" + ele) + '">' + ele.split('/').pop() + '</a>');
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
    $div.append(AjaxSolr.theme('section_title', 'Saved Searches'));
    $div.append(AjaxSolr.theme('saved_items', 'searches', ['Date saved', 'Search terms', 'Collaborations', 'Tags'], rows, handleItemsWithPK('groups', saveToGroup, 'searches', createSavedSearches), handleItemsWithPK('tags', saveToTag, 'searches', createSavedSearches), null, null, null));
    $('#saved-searches-form').submit(submitDeleteAction('/deletesearches', 'searchid', createSavedSearches));
    return $('#saved-searches-table').tablesorter(tsortopts);
  };

  createSavedPublications = function(tagbool) {
    var url;
    if (tagbool == null) tagbool = null;
    $('div#saved-pubs').empty();
    if (datag === 'default') {
      url = '/savedpubs2';
    } else {
      url = "/savedpubsfortag?tagName=" + datag;
    }
    return $.getJSON(SITEPREFIX + url, function(data) {
      var pubs, _ref;
      console.log("DATA", data);
      pubs = (_ref = data.savedpubsfortag) != null ? _ref : data.savedpubs;
      if (pubs.haspubs) {
        createSavedPublicationSection(pubs.savedpubs);
      } else {
        noSavedPublications();
      }
      if (!tagbool) return createTagsList();
    });
  };

  makePubRow = function(p) {
    var ele, groupsintext, tagsintext;
    groupsintext = (function() {
      var _i, _len, _ref, _results;
      _ref = p.groupsin.unique();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ele = _ref[_i];
        _results.push('<a href="' + ("" + SITEPREFIX + "/explorer/group?fqGroupName=" + ele) + '">' + ele.split('/').pop() + '</a>');
      }
      return _results;
    })();
    tagsintext = (function() {
      var _i, _len, _ref, _results;
      _ref = p.tagsin.unique();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ele = _ref[_i];
        _results.push('<a href="' + ("" + SITEPREFIX + "/explorer/saved?tagName=" + ele) + '">' + ele.split('/').pop() + '</a>');
      }
      return _results;
    })();
    return [$('<input type="checkbox" name="pubid"/>').attr('value', p.pubid).attr('bibcode', p.bibcode), $('<span/>').attr('value', p.pubtime).text(p.pubtimestr), $('<a/>').attr('href', "" + SITEPREFIX + "/explorer/publications#fq=" + p.linkuri + "&q=*%3A*").text(p.linktext), $('<span class="bibcode"/>').text(p.bibcode), $('<span/>').html(groupsintext.join(', ')), $('<span/>').html(tagsintext.join(', '))];
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
    $div.append(AjaxSolr.theme('section_title', 'Saved Publications'));
    $div.append(AjaxSolr.theme('saved_items', 'pubs', ['Date saved', 'Title', 'Bibcode', 'Collaborations', 'Tags'], rows, handleItemsWithPK('groups', saveToGroup, 'pubs', createSavedPublications), handleItemsWithPK('tags', saveToTag, 'pubs', createSavedPublications), handleItemsWithPK('publications', doThrow, 'pubs', createSavedPublications), handlePublications(getBibTexFromADS), handlePublications(saveToMyADS)));
    $('#saved-pubs-form').submit(submitDeleteAction('/deletepubs', 'pubid', createSavedPublications));
    return $('#saved-pubs-table').tablesorter(tsortopts);
  };

  createSavedObservations = function(tagbool) {
    var url;
    if (tagbool == null) tagbool = null;
    $('div#saved-obsvs').empty();
    if (datag === 'default') {
      url = '/savedobsvs2';
    } else {
      url = "/savedobsvsfortag?tagName=" + datag;
    }
    return $.getJSON(SITEPREFIX + url, function(data) {
      var obsvs, _ref;
      obsvs = (_ref = data.savedobsvsfortag) != null ? _ref : data.savedobsvs;
      if (obsvs.hasobsvs) {
        createSavedObservationSection(obsvs.savedobsvs);
      } else {
        noSavedObservations();
      }
      if (!tagbool) return createTagsList();
    });
  };

  makeObsvRow = function(o) {
    var ele, groupsintext, tagsintext;
    console.log(o.tagsin);
    groupsintext = (function() {
      var _i, _len, _ref, _results;
      _ref = o.groupsin.unique();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ele = _ref[_i];
        _results.push('<a href="' + ("" + SITEPREFIX + "/explorer/group?fqGroupName=" + ele) + '">' + ele.split('/').pop() + '</a>');
      }
      return _results;
    })();
    tagsintext = (function() {
      var _i, _len, _ref, _results;
      _ref = o.tagsin.unique();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ele = _ref[_i];
        _results.push('<a href="' + ("" + SITEPREFIX + "/explorer/saved?tagName=" + ele) + '">' + ele.split('/').pop() + '</a>');
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
    $div.append(AjaxSolr.theme('section_title', 'Saved Observations'));
    $div.append(AjaxSolr.theme('saved_items', 'obsvs', ['Date Observed', 'Obsid', 'Target', 'Collaborations', 'Tags'], rows, handleItemsWithPK('groups', saveToGroup, 'obsvs', createSavedObservations), handleItemsWithPK('tags', saveToTag, 'obsvs', createSavedObservations), handleItemsWithPK('observations', doThrow, 'obsvs', createSavedObservations), null, null));
    $('#saved-obsvs-form').submit(submitDeleteAction('/deleteobsvs', 'obsvid', createSavedObservations));
    return $('#saved-obsvs-table').tablesorter(tsortopts);
  };

  noSavedSearches = function() {
    $('div#saved-searches').append(AjaxSolr.theme('section_title', 'No saved searches'));
    return true;
  };

  noSavedPublications = function() {
    $('div#saved-pubs').append(AjaxSolr.theme('section_title', 'No saved publications'));
    return true;
  };

  noSavedObservations = function() {
    $('div#saved-obsvs').append(AjaxSolr.theme('section_title', 'No saved observations'));
    return true;
  };

  mediator.subscribe('user/login', function(email) {
    createSavedSearches(true);
    createSavedPublications(true);
    createSavedObservations(true);
    return createTagsList();
  });

}).call(this);
