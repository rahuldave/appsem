/*
 * Code for the publications page
 */

var PublicationsManager;

(function ($) {
    $(function () {
	console.log("*** In semflow-publications");

	PublicationsManager = new AjaxSolr.Manager({
	    solrUrl: SOLRURL
	});

	PublicationsManager.addWidget(new AjaxSolr.ResultWidget({
	    id: 'result',
	    target: '#docs'
	}));
	PublicationsManager.addWidget(new AjaxSolr.PagerWidget({
	    id: 'pager',
	    target: $('#pager'),
	    prevLabel: '&lt;',
	    nextLabel: '&gt;',
	    innerWindow: 1,
	    renderHeader: function (perPage, offset, total) {
		$('#pager-header')
		    .html($('<span/>')
			  .text('displaying ' + Math.min(total, offset + 1) + ' to ' + Math.min(total, offset + perPage) + ' of ' + total+' '))
		    .append($('<a class="save" id="save-search" href="#">save search</a>'))
		    .append($('<a class="delete" id="delete-search" style="display:none" href="#">delete search</a>'));
		// FOR now remove get-data: append($('<a class="save" id="get-data" href="#">get data</a>'));
		
		$('#save-search').click(function(){
		    $.post(SITEPREFIX+'/savesearch', JSON.stringify({'savedsearch':'publications#'+location.href.split("#")[1]}), function(data){
			//should we decode uri component above? We do it on server so perhaps not.
			if (data['success']==='defined'){
			    $('#save-search').hide();
			    $('#delete-search').show();
			}
		    });  
		    return false;
		});
		$('#delete-search').click(function(){
		    $.post(SITEPREFIX+'/deletesearch', JSON.stringify({'searchid':'publications#'+location.href.split("#")[1]}), function(data){
			//should we decode uri component above? We do it on server so perhaps not.
			if (data['success']==='defined'){
			    $('#delete-search').hide();
			    $('#save-search').show();
			}
		    });  
		    return false;
		});
		
		/*
		// get-data button has been removed for now
		$('#get-data').click(function(){
		alert("not yet implemented");
		return false;
		});
		*/
		
		// Hide the 'save search' button if no search has been made.
		// TODO: this check may need to be updated when we support OR-style
		//       queries
		if (PublicationsManager.store.values('fq').length == 0) {
		    $('#save-search').hide();
		}
		
		//this gets called all the time. How to avoid this?
		$.getJSON(SITEPREFIX+'/savedsearches', function(data){
		    var thissearchurl='publications#'+location.href.split("#")[1];
		    console.log("THISSEARCHURL", thissearchurl);
		    //alert(thissearchurl);
		    if (data['savedsearches']!='undefined'){
			var savedsearcharray=data['savedsearches'];
			console.log("SAVEDSEARCHARRAY", savedsearcharray);
			if (_.indexOf(savedsearcharray, thissearchurl)!=-1){
			    console.log("ELE",thissearchurl);
			    $('#save-search').hide();
			    $('#delete-search').show();
			}
		    } else {
			$('#save-search').hide();
			$('#delete-search').hide();
			// $('#get-data').hide(); currently usunsed
		    }
		});
	    } // renderHeader
	}));
	
	var fields = [ 'keywords', 'author', 'objecttypes', 'objectnames', 'obsvtypes', 'obsids', 'instruments', 'missions', 'emdomains', 'targets', 'datatypes', 'propids', 'proposaltype', 'proposalpi'];
	var facet_fields= [ 'keywords_s', 'author_s', 'objecttypes_s', 'objectnames_s', 'obsvtypes_s', 'obsids_s', 'instruments_s', 'obsv_mission_s', 'emdomains_s', 'targets_s', 'datatypes_s', 'propids_s', 'proposaltype_s', 'proposalpi_s'];
	var field_names = ['Keyword', 'Author', 'Object Type', 'Object Name', 'Observation Type', 'Obsid', 'Instrument',
			   'Mission', 'Wavelength', 'Target Name',
			   'Data Type', 'Proposal ID', 'Proposal Type', 'Proposal PI'];
	var field_map = {};
	
	for (var i = 0, l = fields.length; i < l; i++) {
	    field_map[facet_fields[i]] = field_names[i];
	    
	    PublicationsManager.addWidget(new AjaxSolr.TagcloudWidget({
		id: fields[i],
		target: '#' + fields[i],
		field: facet_fields[i]
	    }));
	}
	
	// Additions
	field_map['pubyear_i'] = 'Publication Year'
	field_map['ra_f'] = 'RA'
	field_map['dec_f'] = 'Dec'
	field_map['obsvtime_d'] = 'Observation Date'
	field_map['exptime_f'] = 'Exposure Time'
	
	PublicationsManager.addWidget(new AjaxSolr.CurrentSearchWidget({
            id: 'currentsearch',
            target: '#selection',
	    fieldmap: field_map,
	    allowmulti: facet_fields
	    
	}));
	PublicationsManager.addWidget(new AjaxSolr.AutocompleteWidget({
            id: 'text',
            target: '#search',
            field: 'text',
            fields: facet_fields.concat(['bibcode']),
	    fieldmap: field_map
	}));
	PublicationsManager.addWidget(new AjaxSolr.YearWidget({
            id: 'pubyear',
            target: '#pubyear',
            field: 'pubyear_i',
	    datamin: 1978,
	    datamax: 2011,
	    datastep: 1
	}));
	
	numericfields=['ra', 'dec'];
	facet_numericfields=['ra_f', 'dec_f'];
	min_numericfields=[0.0, -90.0];
	max_numericfields=[360.0, 90.0];
	step_numericfields=[15.0, 10.0];
	for (var i = 0, l = numericfields.length; i < l; i++) {
            PublicationsManager.addWidget(new AjaxSolr.DualSliderWidget({
		id: numericfields[i],
		target: '#'+numericfields[i],
		field: facet_numericfields[i],
		datamin: min_numericfields[i],
		datamax: max_numericfields[i],
		datastep: step_numericfields[i]
            }));
	}
	
	PublicationsManager.addWidget(new AjaxSolr.DualSliderWidget({
            id: 'exptime',
            target: '#exptime',
            field: 'exptime_f',
            datamin: 0,
            datamax: 350,
            datastep: 1,
	    
	    toFacet: function (val) { return val * 1000; },
	    fromFacet: function (val) { return val / 1000; }
	}));
	
	PublicationsManager.addWidget(new AjaxSolr.DateRangerWidget({
            id: 'obsvtime',
            target: '#obsvtime',
            field: 'obsvtime_d',
	    startYear: 1977,
            datastep: 10
	}));
	
	PublicationsManager.setStore(new AjaxSolr.AstroExplorerStore());
	PublicationsManager.store.exposed = [ 'fq', 'q' ];
	PublicationsManager.init();
	PublicationsManager.store.addByValue('q', '*:*');
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
	    PublicationsManager.store.addByValue(name, params[name]);
	}
	PublicationsManager.doRequest();

    });
})(jQuery);
