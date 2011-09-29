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
   facetishHandler: function(event){
       var $target=$(event.target);
       var facet_field=$target.attr('facet_field');
       var facet_value=$target.attr('facet_value');
       var pivot=facet_field + ':' + AjaxSolr.Parameter.escapeValue(facet_value);
       this.widget.manager.store.remove('fq');
       this.widget.manager.store.addByValue('fq', pivot);
       this.widget.manager.doRequest(0);
       return false;
   },
   pivotishHandler: function(event){
       var $target=$(event.target);
       var facet_field=$target.attr('facet_field');
       var facet_value=this.model.get(facet_field);
       var pivot=facet_field + ':' + AjaxSolr.Parameter.escapeValue(facet_value);
       this.widget.manager.store.remove('fq');
       this.widget.manager.store.addByValue('fq', pivot);
       this.widget.manager.doRequest(0);
       return false;
   },
   facetLinks: function (facet_field, facet_values) {
       var links = [];
       if (facet_values) {
           for (var i = 0, l = facet_values.length; i < l; i++) {
               links.push(AjaxSolr.theme('facet_link',
                        facet_values[i],
                        facet_field));
                        //doing it like below overrides event bubbling.
                        //this.facetHandlerMaker(facet_field, facet_values[i])));
           }
       }
       //alert(links);
       return links;
     },
   events: function(){
       var eventhash={
        'click .facetlink':"facetishHandler",
        'click .pivotlink':"pivotishHandler",
        'click .savelink':"saveIfNotHandler",
        'click .deletelink':"deleteIfSavedHandler",
        'click .morelink': "toggleLessMore",
        'click .lesslink': "toggleLessMore"
        //'click .pivotlink.author_s':"pivothandler_author_s",
        //'click .pivotlink.keywords_s':"pivothandler_keywords_s",
       };
       //this['pivothandler_bibcode']=this.pivothandlerMaker2('bibcode', this.model.get('bibcode'));
       return eventhash;
   },
   toggleLessMore: function() {
       //var thedoc=this.model.toJSON();
       //alert(this.$('.lessmore').attr('state'));
       if (this.$('.lessmore').attr('state')==='more'){
           this.$('.morelink').show();
           this.$('.extrapaperinfo').hide();
           this.$('.lesslink').hide();
           this.$('.lessmore').attr('state', 'less');
       } else if (this.$('.lessmore').attr('state')==='less'){
           //alert("hi");
           this.$('.morelink').hide();
           this.$('.extrapaperinfo').show();		
           this.$('.lesslink').show();
           this.$('.lessmore').attr('state', 'more');
       }
       return false;
   },
   saveIfNotHandler: function(){
       var thedoc=this.model.toJSON();
       var that=this;
       $.post(SITEPREFIX+'/savepub', JSON.stringify({
               'savedpub':thedoc.id, 
               'pubbibcode':thedoc.bibcode,
               'pubtitle':thedoc.title
        }), function(data){
                if (data['success']==='defined'){
                    that.$('.savelink').hide();
                    that.$('.deletelink').show();
                }
        });
        return false;
   },
   deleteIfSavedHandler: function(){
       var thedoc=this.model.toJSON();
       var that=this;
       $.post(SITEPREFIX+'/deletepub', JSON.stringify({
           'pubid':thedoc.id 
       }), function(data){
                if (data['success']==='defined'){
                    that.$('.savelink').show();
                    that.$('.deletelink').hide();
                }
       });
       return false;
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
                AjaxSolr.theme('facet_link', year, 'pubyear_i', '['+year+' TO ' + year +']')
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
    viewhash={};
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
      viewhash[doc.id]=resultview;
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
                    viewhash[ele].$('.savelink').hide();
                    viewhash[ele].$('.deletelink').show();
                }
            });
        } else {
            _.each(docids, function(ele){
                //console.log("ELE",ele);
                //isnt this inefficient. Dont show in first place?
                viewhash[ele].$('.savelink').hide();
                viewhash[ele].$('.deletelink').hide(); // should already be hidden but just in case
                //$('#data_'+ele).hide();
            });
        }
    });

  },

  beforeRequest: function () {
    $(this.target).html(AjaxSolr.theme('loader'));
  }
});

})(jQuery);
