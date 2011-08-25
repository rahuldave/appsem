var SITEPREFIX='';
var SITEPREFIX='/semantic2/alpha';

(function ($) {

AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget.extend({
  afterRequest: function () {
    var self=this;  
    $(this.target).empty();
    docids=[];
    for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
      var doc = this.manager.response.response.docs[i];
      $(this.target).append(AjaxSolr.theme('result', doc, AjaxSolr.theme('snippet', doc), 
		AjaxSolr.theme('title', doc),AjaxSolr.theme('pivot', doc, 
		this.facetHandler('bibcode', doc.bibcode)), self));
      //$(this.target).append(AjaxSolr.theme('result', doc, "DOGDOG"));
      var items = [];
      //alert(doc.keywords_s);
      var gaga=this.facetLinks("keywords_s", doc.keywords_s);
      items.concat(gaga);
      //console.log(gaga.length+","+items.length);
      AjaxSolr.theme('list_items', '#links_' + doc.id, gaga, "| ");
      docids.push(doc.id);
    }
    console.log("DOCIDS", docids);
    // Find out which papers have been saved so that we can change the 
    // Saved text/icon to delete.
    $.getJSON(SITEPREFIX+'/savedpubs', function(data){
        if (data['savedpubs']!='undefined'){
            var savedpubarray=data['savedpubs'];
            console.log("SAVEDPUBARRAY", savedpubarray);
            _.each(docids, function(ele){
                if (_.indexOf(savedpubarray, ele)!=-1){
                    //console.log("ELE",ele);
		    $('#savepub_'+ele).hide();
		    $('#delpub_'+ele).show();
                }
            });
        } else {
            _.each(docids, function(ele){
                //console.log("ELE",ele);
                $('#savepub_'+ele).hide();
                $('#delpub_'+ele).hide(); // should already be hidden but just in case
                $('#data_'+ele).hide();
            });
        }
    });
  },
  facetLinks: function (facet_field, facet_values) {
    var links = [];
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
		$('#am_'+thedoc.id).hide();
		$('#p_'+thedoc.id).show();		
		$('#al_'+thedoc.id).show();
		return false;
	};
  },
  lessHandler: function(doc){ 
	var self = this;
	var thedoc=doc;
	return function() {
		$('#am_'+thedoc.id).show();
		$('#p_'+thedoc.id).hide();
		$('#al_'+thedoc.id).hide();
		return false;
	};
  },
  // Save a publication
  saveHandler: function(doc){
      var thedoc=doc;
      return function(){
	  $.post(SITEPREFIX+'/savepub', JSON.stringify({
		      'savedpub':thedoc.id, 
			  'pubbibcode':thedoc.bibcode,
			  'pubtitle':thedoc.title
			  }), function(data){
                if (data['success']==='defined'){
                    $('#savepub_'+thedoc.id).hide();
                    $('#delpub_'+thedoc.id).show();
                }
            });
            return false;
      }
  },
  // Delete a saved publication
  deleteHandler: function(doc){
      var thedoc=doc;
      return function(){
	  $.post(SITEPREFIX+'/deletepub', JSON.stringify({
		      'pubid':thedoc.id }), function(data){
                if (data['success']==='defined'){
                    $('#savepub_'+thedoc.id).show();
                    $('#delpub_'+thedoc.id).hide();
                }
            });
            return false;
      }
  },
  dataHandler: function(doc){
      return function(){
          alert("not yet implemented");
          return false;
      }
  },
  facetHandler: function (facet_field, facet_value) {
    var self = this;
    return function () {
	console.log("For facet "+facet_field+" Trying value "+facet_value);
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
