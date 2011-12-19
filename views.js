(function() {
  /*
  Create the different views/pages for the application.
  */
  var SITEPREFIX, STATICPREFIX, TEMPLATEDIR, bodybodygroup, bodybodyobsv, bodybodypub, bodybodysaved, bodybodyuser, config, doGroup, doObservations, doPublications, doSaved, doUser, doView, fs, getTemplate, globpartialsjson, maint, mustache, partials, redis_client, url;
  fs = require('fs');
  url = require('url');
  mustache = require('mustache');
  redis_client = require('redis').createClient();
  config = require("./config").config;
  SITEPREFIX = config.SITEPREFIX;
  STATICPREFIX = config.STATICPREFIX;
  TEMPLATEDIR = config.TEMPLATEDIR;
  getTemplate = function(fname) {
    return fs.readFileSync("" + TEMPLATEDIR + fname, 'utf-8');
  };
  maint = getTemplate('template.html');
  partials = {
    pagehead: getTemplate('pagehead.html'),
    bodyhead: getTemplate('bodyhead.html'),
    bodyright: getTemplate('bodyright.html')
  };
  globpartialsjson = JSON.stringify(partials);
  bodybodypub = getTemplate('bodybody_publications.html');
  bodybodyobsv = getTemplate('bodybody_observations.html');
  bodybodysaved = getTemplate('bodybody_saved.html');
  bodybodygroup = getTemplate('bodybody_group.html');
  bodybodyuser = getTemplate('bodybody_user.html');
  doView = function(name, body, view) {
    return function(req, res, next) {
      var camefrom, group, lpartials, user, _ref, _ref2;
      console.log("== doView: name=" + name + " url=" + req.url + " referer=" + req.headers.referer + " originalUrl=" + req.originalUrl);
      camefrom = url.parse(req.url, true).query.camefrom;
      console.log("== request from: " + camefrom + " Query  " + req.query);
      group = (_ref = req.query.fqGroupName) != null ? _ref : 'default';
      user = (_ref2 = req.query.fqUserName) != null ? _ref2 : 'default';
      console.log("GROUP", group, name, user);
      view.bodyhead.current_url = req.url;
      view.pagehead.group = group;
      view.bodyhead.group = group;
      view.bodybody.group = group;
      view.pagehead.user = user;
      view.bodyhead.user = user;
      view.bodybody.user = user;
      lpartials = JSON.parse(globpartialsjson);
      lpartials.bodybody = body;
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=UTF-8'
      });
      res.end(mustache.to_html(maint, view, lpartials));
      return true;
    };
  };
  doPublications = doView("Publications", bodybodypub, {
    pagehead: {
      pagetitle: 'Publications',
      pageclass: 'publications',
      haswidgets: true,
      siteprefix: SITEPREFIX,
      staticprefix: STATICPREFIX,
      jsdir: 'coffee'
    },
    bodyhead: {
      isitchosenpublications: 'active',
      siteprefix: SITEPREFIX,
      staticprefix: STATICPREFIX
    },
    bodybody: {
      bodyright: {
        siteprefix: SITEPREFIX,
        staticprefix: STATICPREFIX
      }
    }
  });
  doObservations = doView("Observations", bodybodyobsv, {
    pagehead: {
      pagetitle: 'Observations',
      pageclass: 'observations',
      haswidgets: true,
      siteprefix: SITEPREFIX,
      staticprefix: STATICPREFIX,
      jsdir: 'js'
    },
    bodyhead: {
      isitchosenobservations: 'active',
      siteprefix: SITEPREFIX,
      staticprefix: STATICPREFIX
    },
    bodybody: {
      bodyright: {
        siteprefix: SITEPREFIX,
        staticprefix: STATICPREFIX
      }
    }
  });
  doSaved = doView("Saved", bodybodysaved, {
    pagehead: {
      pagetitle: 'Saved',
      pageclass: 'saved',
      haswidgets: false,
      siteprefix: SITEPREFIX,
      staticprefix: STATICPREFIX,
      jsdir: 'coffee'
    },
    bodyhead: {
      isitchosensaved: 'active',
      siteprefix: SITEPREFIX,
      staticprefix: STATICPREFIX
    },
    bodybody: {
      bodyright: {
        siteprefix: SITEPREFIX,
        staticprefix: STATICPREFIX
      }
    }
  });
  doGroup = doView("Group", bodybodygroup, {
    pagehead: {
      pagetitle: 'Group',
      pageclass: 'group',
      haswidgets: false,
      siteprefix: SITEPREFIX,
      staticprefix: STATICPREFIX,
      jsdir: 'coffee'
    },
    bodyhead: {
      isitchosengroup: 'active',
      siteprefix: SITEPREFIX,
      staticprefix: STATICPREFIX
    },
    bodybody: {
      bodyright: {
        siteprefix: SITEPREFIX,
        staticprefix: STATICPREFIX
      }
    }
  });
  doUser = doView("User", bodybodyuser, {
    pagehead: {
      pagetitle: 'Home',
      pageclass: 'user',
      haswidgets: false,
      siteprefix: SITEPREFIX,
      staticprefix: STATICPREFIX,
      jsdir: 'coffee'
    },
    bodyhead: {
      isitchosenuser: 'active',
      siteprefix: SITEPREFIX,
      staticprefix: STATICPREFIX
    },
    bodybody: {
      bodyright: {
        siteprefix: SITEPREFIX,
        staticprefix: STATICPREFIX
      }
    }
  });
  exports.doPublications = doPublications;
  exports.doObservations = doObservations;
  exports.doSaved = doSaved;
  exports.doGroup = doGroup;
  exports.doUser = doUser;
}).call(this);
