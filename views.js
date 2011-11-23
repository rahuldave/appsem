(function() {
  /*
  Create the different views/pages for the application.
  */
  var SITEPREFIX, STATICPREFIX, TEMPLATEDIR, bodybodyobsv, bodybodypub, bodybodysaved, config, doObservations, doPublications, doSaved, doView, fs, getTemplate, globpartialsjson, maint, mustache, partials, redis_client, url;
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
  doView = function(name, body, view) {
    return function(req, res, next) {
      var camefrom, lpartials;
      console.log("== doView: name=" + name + " url=" + req.url + " referer=" + req.headers.referer + " originalUrl=" + req.originalUrl);
      camefrom = url.parse(req.url, true).query.camefrom;
      console.log("== request from: " + camefrom);
      view.bodyhead.current_url = req.url;
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
      isitchosenpublications: 'chosen',
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
      isitchosenobservations: 'chosen',
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
      isitchosensaved: 'chosen',
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
}).call(this);
