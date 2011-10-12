/**
 * Widgets for the observations view.
 */

function encodeObsuri(obsuri){
    var splist=obsuri.split('/');
    return splist[0]+'-'+splist[1];
}

(function ($) {

    // should we be using facetLinks?
    //
    function getAuthors(self, facetHandler, authors) {
	var $out = $('<span class="authors"/>');
	for (var i in authors) {
	    if (i != 0) { $out.append('; '); }
	    $out.append($('<a href="#"/>')
			.text(authors[i])
			.click(facetHandler(self, 'author_s', '"'+authors[i]+'"')));
	}
	return $out;
    }

    function getObsvtime(self, facetHandler, year) {
	return $('<a href="#"/>')
	    .text(year)
	    .click(facetHandler(self, 'obsvtime_d', '['+year+' TO ' + year +']'));
	    //this will still work, but should we do a slight interval sround it?
    }

    // copy of facetHandler; this is not ideal bit it should be a temporary
    // addition, since the display of authors is going to change to match
    // the author list of a publication.
    //
    function facetHandler2(self, facet_field, facet_value) {
	return function () {
	    // console.log("For facet "+facet_field+" Trying value "+facet_value);
            self.manager.store.remove('fq');
            self.manager.store.addByValue('fq', facet_field + ':' + facet_value);
            self.manager.doRequest(0);
            return false;
	};
    }
	
AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget.extend({
  afterRequest: function () {
    var self=this;  
    $(this.target).empty();
    
    docids=[];
    for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
      var doc = this.manager.response.response.docs[i];
      $(this.target).append(AjaxSolr.theme('result', doc, 
					   AjaxSolr.theme('snippet', doc,
							  //getAuthors(self, facetHandler2, doc.author),
							  getObsvtime(self, facetHandler2, doc.obsvtime_d)
							 ), 
					   AjaxSolr.theme('title', doc),
					   AjaxSolr.theme('pivot', doc, this.facetHandler('obsids_s', doc.obsids_s)),
					   self)
			   );
      //$(this.target).append(AjaxSolr.theme('result', doc, "DOGDOG"));
      var items = [];
      //alert(doc.emdomains_s);
      var gaga=this.facetLinks("emdomains_s", doc.emdomains_s);
      items.concat(gaga);
      //alert(gaga.length+","+items.length);
      //alert(items);
      AjaxSolr.theme('list_items', '#links_' + encodeObsuri(doc.obsids_s), gaga, "| ");
      docids.push(encodeObsuri(doc.obsids_s));
    }
    console.log("DOCIDS", docids);
    // Find out which papers have been saved so that we can change the 
    // Saved text/icon to delete.
    
    $.getJSON(SITEPREFIX+'/savedobsvs', function(data){
        if (data['savedobsvs']!='undefined'){
            var savedobsvarray=data['savedobsvs'];
            console.log("SAVEDOBSVARRAY", savedobsvarray);
            //alert(savedobsvarray);
            _.each(docids, function(ele){
                //alert(ele);
                if (_.indexOf(savedobsvarray, ele)!=-1){
                    //console.log("ELE",ele);
		    $('#saveobsv_'+ele).hide();
		    $('#delobsv_'+ele).show();
                }
            });
        } else {
            _.each(docids, function(ele){
                //console.log("ELE",ele);
                $('#saveobsv_'+ele).hide();
                $('#delobsv_'+ele).hide(); // should already be hidden but just in case
                $('#data_'+ele).hide();
            });
        }
    });
  
  },
  facetLinks: function (facet_field, facet_values) {
    var links = [];
    //alert(facet_values.length);
    if (facet_values) {
        for (var i = 0, l = facet_values.length; i < l; i++) {
            links.push(AjaxSolr.theme('facet_link',
				      /*  Doug thinks the quotes are visually distracting
					 '"'+facet_values[i]+'"', 
				      */
				      facet_values[i],
				      this.facetHandler(facet_field, '"'+facet_values[i]+'"')));
        }
    }
    //alert(links);
    return links;
  },
  moreHandler: function(doc){
	var self = this;
	var thedoc=doc;
	return function() {
	    console.log("imh", thedoc.obsids_s, $('#p_'+encodeObsuri(thedoc.obsids_s)).text() );
		$('#am_'+encodeObsuri(thedoc.obsids_s)).hide();
		$('#p_'+encodeObsuri(thedoc.obsids_s)).show();		
		$('#al_'+encodeObsuri(thedoc.obsids_s)).show();
		return false;
	};
  },
  lessHandler: function(doc){ 
	var self = this;
	var thedoc=doc;
	return function() {
		$('#am_'+encodeObsuri(thedoc.obsids_s)).show();
		$('#p_'+encodeObsuri(thedoc.obsids_s)).hide();
		$('#al_'+encodeObsuri(thedoc.obsids_s)).hide();
		return false;
	};
  },
  // Save a publication
  saveHandler: function(doc){
      var thedoc=doc;
      return function(){
	  $.post(SITEPREFIX+'/saveobsv', JSON.stringify({
		      'savedobsv':encodeObsuri(thedoc.obsids_s), 
			  'obsvtarget':thedoc.targets_s,
			  'obsvtitle':thedoc.obsv_title
			  }), function(data){
                if (data['success']==='defined'){
                    $('#saveobsv_'+encodeObsuri(thedoc.obsids_s)).hide();
                    $('#delobsv_'+encodeObsuri(thedoc.obsids_s)).show();
                }
            });
            return false;
      }
  },
  // Delete a saved publication
  deleteHandler: function(doc){
      var thedoc=doc;
      return function(){
	  $.post(SITEPREFIX+'/deleteobsv', JSON.stringify({
		      'obsid':encodeObsURI(thedoc.obsids_s) }), function(data){
                if (data['success']==='defined'){
                    $('#saveobsv_'+encodeObsuri(thedoc.obsids_s)).show();
                    $('#delobsv_'+encodeObsuri(thedoc.obsids_s)).hide();
                }
            });
            return false;
      }
  },
    /* have removed this for now
  dataHandler: function(doc){
      return function(){
          alert("not yet implemented");
          return false;
      }
  },
    */
  facetHandler: function (facet_field, facet_value) {
    var self = this;
    return function () {
	// console.log("For facet "+facet_field+" Trying value "+facet_value);
        self.manager.store.remove('fq');
        self.manager.store.addByValue('fq', facet_field + ':' + facet_value);
        self.manager.doRequest(0);
        return false;
    };
  },

  init: function () {
	//$('a.more').click(alert("Hi"));
    /*$('a.more').live(function () {
        $(this).toggle(function () {
            $(this).parent().find('span.abstract').show();
            $(this).text('less');
            return false;
        }, function () {
            $(this).parent().find('span.abstract').hide();
            $(this).text('more');
            return false;
        });
    });*/
  },
  beforeRequest: function () {
    $(this.target).html($('<img/>').attr('src', '/semantic2/alpha/static/images/ajax-loader.gif'));
  }
});

})(jQuery);
