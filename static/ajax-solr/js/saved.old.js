/*
 * Code for the saved page
 */

/**
 * Make a POST request to the ADS servers using the given
 * URL path and apply the given callback to the response.
 */
var doADSproxy; // ugly polution of the global namespace

/**
 * Change all the buttons in the form to the given state.
 */
var changeAllButtons;

/**
 * Set up the 'Submit a delete' action for the table.
 */
var submitDeleteAction;

/**
 * Check the saved-publication table to find all checked items
 * and export them to BibTex using the ADS server.
 */
var getAsBibTex;

/**
 * Get the BibTex entries for all the publications in the saved
 * search.
 *
 * At present we restrict to one search.
 */
var getSearchAsBibTex;

/**
 * Save all the publications in the saved search to a myADS library.
 *
 * At present we restrict to one search.
 */ 
var saveSearchToMyADS;

/**
 * Save all the publications to a myADS library.
 */
var saveToMyADS;

/**
 * Ensure the given table is ready for user sorting.
 */
var setupSortedTable;

// var fancyboxOpts = { 'autoDimensions': false, 'width': 1024, 'height': 768 };

(function ($) {

    changeAllButtons = function (form, newstate) {
	$(form).find('input[type=checkbox]').each(function() { this.checked = newstate; });
    };

    doADSproxy = function (urlpath, callback) {
	$.post(SITEPREFIX + '/adsproxy',
	       JSON.stringify({urlpath: urlpath}),
	       callback);
    };

    submitDeleteAction = function (path, idname) {
	return function () {
	    var data = [];
	    $(this).find('input[type=checkbox][checked|=true]').each(function() {
		data.push(this.value);
	    });
	    if (data.length == 0) { return false; }
	    var map = { action: "delete" };
	    map[idname] = data;
	    $.post(SITEPREFIX+path, JSON.stringify(map), function (resp) {
		// reload on success or error
		window.location.reload();
	    });
	};
    };

    getAsBibTex = function (form) {
	var data = [];
	// could use input:checked but I think I read that there may
	// be issues, so use the more explicit version.
	$(form).find('input[type=checkbox][checked|=true]').parent().nextAll('td.bibcode').each(function() {
	    data.push($(this).text());
	});
	if (data.length == 0) { return false; }
	$.fancybox.showActivity();
	doADSproxy('/cgi-bin/nph-bib_query?data_type=BIBTEX&' +
		   data.map(encodeURIComponent).join('&'),
		   function (resp) { $.fancybox('<pre>'+resp+'</pre>'); });
	return false;
    };

    getSearchAsBibTex = function (form) {
	var data = [];
	$(form).find('input[type=checkbox][checked|=true]').each(function() {
	    data.push(this.value);
	});
	if (data.length == 0) { return false; }
	else if (data.length > 1) {
	    alert("Only 1 search can be retrieved as BibTex at a time (you selected " + data.length + ")");
	    return false;
	}
	$.fancybox.showActivity();

	var query = SOLRURL + 'select?' + data[0] +
            '&fl=bibcode' +
            '&wt=json&json.wrf=?';

	$.getJSON(query, function (response) {
	    if (response.response.numFound === 0) {
		$.fancybox.hideActivity();
		alert("No publications found for this search.");
		return false;
	    }
	    var bibcodes = [];
	    for (var i = 0, n = response.response.docs.length; i < n; i++) {
		bibcodes.push(response.response.docs[i].bibcode);
	    }
	    doADSproxy('/cgi-bin/nph-bib_query?data_type=BIBTEX&' +
		       bibcodes.map(encodeURIComponent).join('&'),
		       function (resp) { $.fancybox('<pre>'+resp+'</pre>'); return false; });
	});
    };

    saveToMyADS = function (form) {
	var data = [];
	$(form).find('input[type=checkbox][checked|=true]').parent().nextAll('td.bibcode').each(function() {
	    data.push($(this).text());
	});
	if (data.length == 0) { return false; }
	$.fancybox.showActivity();
	doADSproxy('/cgi-bin/nph-abs_connect?library=Add&' +
		   data.map(function (item) { return 'bibcode=' +
					      encodeURIComponent(item); }).join('&'),
		   function(resp) { $.fancybox(resp); return false; });  
    };
   
    saveSearchToMyADS = function (form) {
	var data = [];
	$(form).find('input[type=checkbox][checked|=true]').each(function() {
	    data.push(this.value);
	});
	if (data.length == 0) { return false; }
	else if (data.length > 1) {
	    alert("Only 1 search can be retrieved as BibTex at a time (you selected " + data.length + ")");
	    return false;
	}
	$.fancybox.showActivity();

	var query = SOLRURL + 'select?' + data[0] +
            '&fl=bibcode' +
            '&wt=json&json.wrf=?';
	
	$.getJSON(query, function (response) {
	    if (response.response.numFound === 0) {
		$.fancybox.hideActivity();
		alert("No publications found for this search.");
		return false;
	    }
	    var bibcodes = [];
	    for (var i = 0, n = response.response.docs.length; i < n; i++) {
		bibcodes.push(response.response.docs[i].bibcode);
	    }
	    var bibcodelist = bibcodes.map(function (item) { return 'bibcode=' +
							     encodeURIComponent(item); });
	    doADSproxy('/cgi-bin/nph-abs_connect?library=Add&' + bibcodelist.join('&'),
		       function(resp) { $.fancybox(resp); return false; });
	});
    };

    // Use the actual time value to sort the time column rather than
    // the text, and the text for the other columns. a bit ugly
    //
    var tsortopts = {
	headers: { 0: { sorter: false } },
	textExtraction: function(node) {
	    var val = $(node).find('span').attr('value');
	    if (val === undefined) {
		return $(node).text();
	    } else {
		return val;
	    }
	}
    };
    
    setupSortedTable = function (table) {
	$(table).tablesorter(tsortopts);
    };
    
})(jQuery);
