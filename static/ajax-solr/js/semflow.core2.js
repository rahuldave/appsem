(function() {
  var $, loginHandler, makeConsole, makeMediator, myjsonp, root, setLoggedIn, setLoggedOut;
  var __slice = Array.prototype.slice;
  root = typeof exports !== "undefined" && exports !== null ? exports : this;
  $ = jQuery;
  root.SITEPREFIX = '/semantic2/alpha';
  root.SOLRURL = "" + root.SITEPREFIX + "/solr/";
  makeConsole = function() {
    var console;
    if (typeof console === "undefined" || typeof console.log === "undefined") {
      return console = {
        log: function() {}
      };
    }
  };
  makeConsole();
  makeMediator = function() {
    var publish, subscribe;
    subscribe = function(channel, fn) {
      if (!mediator.channels[channel]) {
        mediator.channels[channel] = [];
      }
      mediator.channels[channel].push({
        context: this,
        callback: fn
      });
      return this;
    };
    publish = function() {
      var args, channel, subscription, _i, _len, _ref;
      channel = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (!mediator.channels[channel]) {
        return false;
      }
      _ref = mediator.channels[channel];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        subscription = _ref[_i];
        subscription.callback.apply(subscription.context, args);
      }
      return this;
    };
    return {
      channels: {},
      publish: publish,
      subscribe: subscribe,
      installTo: function(obj) {
        obj.subscribe = subscribe;
        return obj.publish = publish;
      }
    };
  };
  root.mediator = makeMediator();
  root.cleanFacetName = function(name, namemap) {
    var _ref;
    return (_ref = namemap[name]) != null ? _ref : name;
  };
  root.cleanFacetValue = function(label) {
    var firstChar, idx, l, lastChar, r;
    if (label === "") {
      return label;
    }
    l = label.length;
    firstChar = label[0];
    lastChar = label[l - 1];
    if (firstChar === '"' && lastChar === '"') {
      return label.substr(1, l - 2);
    } else if (firstChar === '[' && lastChar === ']') {
      idx = label.indexOf(' TO ');
      if (idx !== -1) {
        label = label.substr(1, l - 2);
        l = label.substr(0, idx - 1);
        r = label.substr(idx + 3);
        if (l === r) {
          return l;
        } else {
          return label;
        }
      }
    }
    return label;
  };
  root.searchToText = function(searchTerm, namemap) {
    var n, name, out, s, term, terms, v, value, _i, _len, _ref, _results;
    s = ("&" + searchTerm).replace('&q=*%3A*', '');
    terms = s.split(/&fq=/);
    terms.shift();
    out = {};
    for (_i = 0, _len = terms.length; _i < _len; _i++) {
      term = terms[_i];
      _ref = decodeURIComponent(term).split(':', 2), name = _ref[0], value = _ref[1];
      value = cleanFacetValue(value);
      if (name in out) {
        out[name].push(value);
      } else {
        out[name] = [value];
      }
    }
    _results = [];
    for (n in out) {
      v = out[n];
      _results.push("" + (cleanFacetName(n, namemap)) + "=" + (v.join(',')));
    }
    return _results;
  };
  root.fieldname_map = {
    keywords_s: 'Keyword',
    author_s: 'Author',
    objecttypes_s: 'Object Type',
    objectnames_s: 'Object Name',
    obsvtypes_s: 'Observation Type',
    obsids_s: 'Observation ID',
    instruments_s: 'Instrument',
    obsv_mission_s: 'Mission',
    missions_s: 'Mission',
    emdomains_s: 'Wavelength',
    targets_s: 'Target Name',
    datatypes_s: 'Data Type',
    propids_s: 'Proposal ID',
    proposaltype_s: 'Proposal Type',
    proposalpi_s: 'Proposal PI',
    pubyear_i: 'Publication Year',
    ra_f: 'RA',
    dec_f: 'Dec',
    fov_f: 'Field of View',
    obsvtime_d: 'Observation Date',
    exptime_f: 'Exposure Time',
    data_collection_s: 'Data Collection',
    resolution_f: 'Spatial resolution',
    t_resolution_f: 'Temporal resolution'
  };
  setLoggedIn = function(email) {
    var elem, _i, _j, _len, _len2, _ref, _ref2;
    $('a#logouthref').text("logout " + email);
    _ref = $('.userloggedin');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      elem = _ref[_i];
      $(elem).show();
    }
    _ref2 = $('.userloggedout');
    for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
      elem = _ref2[_j];
      $(elem).hide();
    }
    return mediator.publish('user/login', email);
  };
  setLoggedOut = function() {
    var elem, _i, _j, _len, _len2, _ref, _ref2;
    _ref = $('.userloggedout');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      elem = _ref[_i];
      $(elem).show();
    }
    _ref2 = $('.userloggedin');
    for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
      elem = _ref2[_j];
      $(elem).hide();
    }
    return mediator.publish('user/logout');
  };
  myjsonp = function(data) {
    return data;
  };
  loginHandler = function() {
    return $.ajax({
      url: "http://labs.adsabs.harvard.edu" + SITEPREFIX + "/adsjsonp?callback=?",
      dataType: 'jsonp',
      jsonpcallback: myjsonp,
      success: function(data) {
        if ((data.email != null) && data.email !== '') {
          return $.post("" + SITEPREFIX + "/addtoredis", JSON.stringify(data), function() {
            return window.location.reload();
          });
        } else {
          $('a#loginhref').click(function() {
            var loc, page, prefix;
            page = window.location;
            prefix = "" + page.protocol + "//" + page.host;
            loc = encodeURIComponent("" + prefix + SITEPREFIX + "/login?redirect=" + window.location);
            return window.location.href = "http://adsabs.harvard.edu/cgi-bin/nph-manage_account?man_cmd=login&man_url=" + loc;
          });
          return $('a#loginhref').trigger('click');
        }
      }
    });
  };
  $(function() {
    var elem, _i, _len, _ref;
    $('#gosearch').click(function() {
      return alert('The search box is not implemented');
    });
    _ref = $('a.userlogin');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      elem = _ref[_i];
      $(elem).click(loginHandler);
    }
    $('a#logouthref').click(function() {
      var loc;
      loc = encodeURIComponent(window.location);
      return window.location.href = "" + SITEPREFIX + "/logout?redirect=" + loc;
    });
    return $.getJSON("" + SITEPREFIX + "/getuser", function(data) {
      if ((data.email != null) && data.email !== '' && data.email !== 'undefined') {
        return setLoggedIn(data.email);
      } else {
        if ((data.startup != null) && data.startup !== 'undefined') {
          return $.ajax({
            url: "http://labs.adsabs.harvard.edu" + SITEPREFIX + "/adsjsonp?callback=?",
            dataType: 'jsonp',
            jsonpcallback: myjsonp,
            success: function(adata) {
              if ((adata.email != null) && adata.email !== '') {
                setLoggedIn(adata.email);
                return $.post("" + SITEPREFIX + "/addtoredis", JSON.stringify(adata));
              } else {
                return setLoggedOut();
              }
            }
          });
        } else {
          return setLoggedOut();
        }
      }
    });
  });
}).call(this);
