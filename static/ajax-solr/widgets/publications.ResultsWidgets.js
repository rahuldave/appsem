/**
 * Widgets for the publications view.
 */

(function ($) {
ResultModel=Backbone.Model.extend({
    
});
ResultView=Backbone.View.extend({
   tagName:  "div",
   className: "publication",
   initialize: function (viewhash){
       this.widget=viewhash.widget;
   },
   pivothandlerMaker: function(pivot){
    var that=this;
    return function() {
        that.widget.manager.store.remove('fq');
        that.widget.manager.store.addByValue('fq', pivot);
        that.widget.manager.doRequest(0);
        return false;
    }
   },
   pivothandlerMaker2: function(facet_field, facet_value){
       var pivot=facet_field + ':' + AjaxSolr.Parameter.escapeValue(facet_value);
       var that=this;
       return function() {
           //alert($(e.target).attr('class'));
           that.widget.manager.store.remove('fq');
           that.widget.manager.store.addByValue('fq', pivot);
           that.widget.manager.doRequest(0);
           return false;
       }
   },
   facetHandlerMaker: function (facet_field, facet_value) {
           return this.pivothandlerMaker2(facet_field, facet_value);
   },
   facetishHandler: function(event){
       var $target=$(event.target);
   },
   facetLinks: function (facet_field, facet_values) {
       var links = [];
       if (facet_values) {
           for (var i = 0, l = facet_values.length; i < l; i++) {
               links.push(AjaxSolr.theme('facet_link',
                        facet_values[i],
                        facet_field,
                        //doing it like below overrides event bubbling.
                        this.facetHandlerMaker(facet_field, facet_values[i])));
           }
       }
       //alert(links);
       return links;
     },
   events: function(){
       var eventhash={
        'click .pivotlink.bibcode':"pivothandler_bibcode",
        //'click .pivotlink.author_s':"pivothandler_author_s",
        //'click .pivotlink.keywords_s':"pivothandler_keywords_s",
       };
       this['pivothandler_bibcode']=this.pivothandlerMaker2('bibcode', this.model.get('bibcode'));
       return eventhash;
   },

   render: function() {
       //alert(this.el);
       var doc=this.model.toJSON();
       var year=doc.pubyear_i;
       var keywords = this.facetLinks("keywords_s", doc.keywords_s);
       var authors= this.facetLinks("author_s", doc.author_s);
       var ajrtheme=AjaxSolr.theme('result',
            doc, 
            AjaxSolr.theme('title', doc),
            AjaxSolr.theme('list_items', AjaxSolr.theme('keywords'), keywords, "| "),
            AjaxSolr.theme('additional', 
                doc,
                AjaxSolr.theme('list_items', AjaxSolr.theme('authors'), authors, "; "),
                AjaxSolr.theme('facet_link', year, 'pubyear_i', this.facetHandlerMaker('pubyear_i','['+year+' TO ' + year +']' ))
            ),
            AjaxSolr.theme('lessmore', doc),
            this.widget
      );
      $(this.el).html(ajrtheme);
      return this;
   },
});
AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget.extend({

  afterRequest: function () {
    var self=this;
    var $target=$(this.target); 
    $target.empty();
    docids=[];
    for (var i = 0, l = self.manager.response.response.docs.length; i < l; i++) {
      var doc = self.manager.response.response.docs[i];
      var year=doc.pubyear_i;

      var result=new ResultModel(doc);
      var resultview=new ResultView({
        model:result, 
        widget:self
      });
      $target.append(resultview.render().el);
      //$(this.target).append();
      //AjaxSolr.theme('list_items', $('#links_' + doc.id), keywords, "| ");
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

  beforeRequest: function () {
    $(this.target).html(AjaxSolr.theme('loader'));
  }
});

})(jQuery);
