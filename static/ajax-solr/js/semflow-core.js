/*
 * Common code for AstroExplorer
 */

var Manager;
var SITEPREFIX = '/semantic2/alpha';

(function() {
    function nop() {}
    if (! ("console" in window) || !("firebug" in console)) {
	var names = ["log", "debug", "info", "warn", "error", "assert", "dir",
		     "dirxml", "group", "groupEnd", "time", "timeEnd", "count",
		     "trace", "profile", "profileEnd"];
	window.console = {};
	for (var i = 0; i < names.length; ++i) {
	    window.console[names[i]] = nop;
	}
    }
})();

(function ($) {
    $(function () {
	// console.log("WHEN IS THIS CALLED?");
	var userhasbeengot=false;
	Manager = new AjaxSolr.Manager({
	    solrUrl: SITEPREFIX+'/solr/'
	});

/***	
	Manager.setStore(new AjaxSolr.ParameterHashStore({
	    
	    // overriding the default to include stats.field
	    isMultiple: function (name) {
		return name.match(/^(?:bf|bq|facet\.date|facet\.date\.other|facet\.date\.include|facet\.field|facet\.pivot|facet\.range|facet\.range\.other|facet\.range\.include|facet\.query|fq|group\.field|group\.func|group\.query|stats\.field|pf|qf)$/);
	    },
	    
	    // Overriding the default behavior to try and fix the issue
	    // with constraints of author names - which contain commas - being
	    // broken up when reloaded and so not parsed correctly.
	    // This may be a sledgehammer aimed at the wrong nut.
	    //
	    parseString: function (str) {
		var pairs = str.split('&');
		for (var i = 0, l = pairs.length; i < l; i++) {
		    if (pairs[i]) { // ignore leading, trailing, and consecutive &'s
			var param = new AjaxSolr.Parameter();
			param.parseString(pairs[i]);
			// re-constructing any values that may have been split apart by
			// param.parseString.
			if (AjaxSolr.isArray(param.value)) {
			    param.value = param.value.join(',');
			}
			this.add(param.name, param);
		    }
		}
	    }
	    
	}));
	Manager.store.exposed = [ 'fq', 'q' ];
	Manager.init();
	Manager.store.addByValue('q', '*:*');
	console.log("facet_fields:", facet_fields);
	var params = {
	    'facet': true,
	    'facet.field': facet_fields,
	    'facet.limit': 20, // change this to set autocompletion limits differently...or solr 1.5
	    'facet.mincount': 1,
	    'f.topics.facet.limit': 50,
	    'json.nl': 'map',
	    'sort':'citationcount_i desc',
	    'rows':20,
	    'stats': 'true',
	    'stats.field': facet_numericfields.concat(['exptime_f', 'pubyear_i'])
	};
	for (var name in params) {
	    Manager.store.addByValue(name, params[name]);
	}
	Manager.doRequest();
***/
	
	function myjsonp(data){
            return data; //so that we dont handle url on server
	};
	$('#gosearch').click(function(){
            alert("not yet implemented");
	});
	$('a#loginhref').click(function(){
            var loc=encodeURIComponent(window.location);
            //alert(loc);
            //window.location.href="http://adsabs.harvard.edu/cgi-bin/nph-manage_account?man_cmd=login&man_url="+loc;
            //window.location.href="/login?currenturl="+loc;
            $.ajax({
		url: "http://labs.adsabs.harvard.edu"+SITEPREFIX+"/adsjsonp?callback=?",
		dataType: 'jsonp',
		jsonpcallback: myjsonp,
		success:    function(data) {
                    if (data['email']!=''){
			$('a#loginhref').text(data['email']);
			$('a#loginhref').text(data['email']).attr('href', SITEPREFIX+'/explorer/saved');
			$.post(SITEPREFIX+'/addtoredis', JSON.stringify(data), function(){
                            //not correct as it dosent do anything on nonpublication pages
                            var thisloc=window.location;
                            //Manager.doRequest();
                            //alert(thisloc.href);
                            window.location.reload();
			});
                    } else {//we aint logged in
			$('a#loginhref').click(function(){
                            var thispage=window.location;
                            var prefix=thispage.protocol+'//'+location.host;
                            var loc=encodeURIComponent(prefix+SITEPREFIX+"/login?redirect="+window.location);
                            window.location.href="http://adsabs.harvard.edu/cgi-bin/nph-manage_account?man_cmd=login&man_url="+loc;
                            //window.location.href="/login?redirect="+loc;
			});
			//$.cookie('startup', 'anyvalue', { expires: new Date(Date.now()+300000), path: '/' });
			$('a#loginhref').trigger('click');
                    }
		}
            });
	});
	$('a#logouthref').click(function(){
            var loc=encodeURIComponent(window.location);
            console.log("loc",loc);
            window.location.href=SITEPREFIX+"/logout?redirect="+loc;
	});
	
	console.log('Hi');
	
        $.getJSON(SITEPREFIX+'/getuser', function(data){
            console.log("DADATA",data);
            if (data['email']!='null' && data['email'] != 'undefined'){
                $('a#loginhref').text(data['email']).attr('href', SITEPREFIX+'/explorer/saved');
                userhasbeengot=true;
                
            }
            else{//shouldnt we distinguish null from undefined? null is for no db entry, undefined for no cookie
                //only go in if local cookie found
                //console.log("$$$$$$$$$$$$$$$$$$$COOK",$.cookie('logincookie'));
                //if ($.cookie('startup')=='anyvalue'){
                console.log("making ajax call to jsonp callback");
                if (data['startup']!='undefined'){
                    $.ajax({
			url: "http://labs.adsabs.harvard.edu"+SITEPREFIX+"/adsjsonp?callback=?",
			dataType: 'jsonp',
			jsonpcallback: myjsonp,
			success:    function(data) {
                            //$.cookie('startup', null);//should it be only on success?
                            if (data['email']!=''){
				$('a#loginhref').text(data['email']);
				$('a#loginhref').text(data['email']).attr('href', SITEPREFIX+'/explorer/saved');
				$.post(SITEPREFIX+'/addtoredis', JSON.stringify(data));
                            }
                            
			}
                    });
                }
		
            }
        });
	
	/*
	  $.ajax({
          url: "http://labs.adsabs.harvard.edu/semantic2/adsjsonp?callback=?",
          dataType: 'jsonp',
          jsonpcallback: myjsonp,
          success:    function(data) {
          $('a#loginhref').text(data['email']);
          $.post('/addtoredis', JSON.stringify(data));
          }
          }
	  );
	*/
    });
})(jQuery);
