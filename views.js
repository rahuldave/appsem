(function() {
  /*
  Create the different views/pages for the application.
  */
  var SITEPREFIX, STATICPREFIX, TEMPLATEDIR, bodybodygroup, bodybodyhelp, bodybodyobsv, bodybodypub, bodybodysaved, bodybodyuser, config, doGroup, doHelp, doObservations, doPublications, doSaved, doUser, doView, fs, getTemplate, globpartialsjson, maint, mustache, partials, redis_client, url;
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
  bodybodyhelp = getTemplate('bodybody_help.html');
  bodybodygroup = getTemplate('bodybody_group.html');
  bodybodyuser = getTemplate('bodybody_user.html');
  doView = function(name, body, view) {
    return function(req, res, next) {
      var camefrom, group, isgroup, istag, isuser, lpartials, tag, user, _ref, _ref2, _ref3;
      console.log("== doView: name=" + name + " url=" + req.url + " referer=" + req.headers.referer + " originalUrl=" + req.originalUrl);
      camefrom = url.parse(req.url, true).query.camefrom;
      console.log("== request from: " + camefrom + " Query  " + req.query);
      group = (_ref = req.query.fqGroupName) != null ? _ref : 'default';
      user = (_ref2 = req.query.fqUserName) != null ? _ref2 : 'default';
      tag = (_ref3 = req.query.tagName) != null ? _ref3 : 'default';
      console.log("GROUP", group, name, user);
      view.bodyhead.current_url = req.url;
      isgroup = group !== 'default';
      istag = tag !== 'default';
      isuser = user !== 'default';
      view.pagehead.group = group;
      view.bodyhead.group = group;
      view.bodybody.group = group;
      view.pagehead.isgroup = isgroup;
      view.bodyhead.isgroup = isgroup;
      view.bodybody.isgroup = isgroup;
      view.pagehead.user = user;
      view.bodyhead.user = user;
      view.bodybody.user = user;
      view.pagehead.isuser = isuser;
      view.bodyhead.isuseris = user;
      view.bodybody.isuser = isuser;
      view.pagehead.tag = tag;
      view.bodyhead.tag = tag;
      view.bodybody.tag = tag;
      view.pagehead.istag = istag;
      view.bodyhead.istag = istag;
      view.bodybody.istag = istag;
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
  doHelp = doView("Help", bodybodyhelp, {
    pagehead: {
      pagetitle: 'Help',
      pageclass: 'help',
      haswidgets: false,
      siteprefix: SITEPREFIX,
      staticprefix: STATICPREFIX,
      jsdir: 'coffee'
    },
    bodyhead: {
      isitchosenhelp: 'active',
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
  exports.doHelp = doHelp;
}).call(this);
