/*
 * Code for the saved page
 */

/**
 * Make a POST request to the ADS servers using the given
 * URL path and apply the given callback to the response.
 */
var doADSproxy; // ugly polution of the global namespace

(function ($) {

    doADSproxy = function (urlpath, callback) {
	$.post(SITEPREFIX + '/adsproxy',
	       JSON.stringify({urlpath: urlpath}),
	       callback);
    }

})(jQuery);
