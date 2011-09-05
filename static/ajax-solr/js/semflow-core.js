/*
 * Common code for AstroExplorer
 */

var SITEPREFIX = '/semantic2/alpha';
var SOLRURL = SITEPREFIX + '/solr/';

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
	var userhasbeengot=false;

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
