/**
 * Widgets for the observations view.
 */

function encodeObsuri(obsuri){
    var splist=obsuri.split('/');
    return splist[0]+'-'+splist[1];
}

(function ($) {

    PublicationView=Backbone.View.extend({
        //We'll just initialize with an attribute dict passed into constructor by Collection.
    });
    
    ObjectView=Backbone.View.extend({
    //We'll just initialize with an attribute dict passed into constructor by Collection.
    });
    PublicationCollectionView=Backbone.View.extend({
        tagName: "div",
        className: "publicationarea",
        initialize: function(){
            //this.model.bind("add", this.addOne, this);
            this.model.bind("populated", this.addAll, this);
            //alert("AA"+this.model.nobj)
            var npub=this.model.npub;
            this.collectionexpanded=false;
            $(this.el).append(AjaxSolr.theme("publicationpreamble", npub, this.model));
        },
        addOne: function(publicationmodel){
            var view=new PublicationView({model:publicationmodel});
            this.$('.publicationtbody').append(AjaxSolr.theme("publicationline", view.model.toJSON()));
        },
        addAll: function(){
            //alert("Hi");
            //alert(this.testlist);
            this.model.each(this.addOne, this);
            this.collectionexpanded=true;
            this.$('.tablesorter').tablesorter();
            //alert(this.counter);
        },
        render: function(){
            return this;
        }
    });
    
    ObjectCollectionView=Backbone.View.extend({
        tagName: "div",
        className: "objectarea",
        initialize: function(){
            //this.model.bind("add", this.addOne, this);
            this.model.bind("populated", this.addAll, this);
            //alert("AA"+this.model.nobj)
            var nobj=this.model.nobj;
            this.collectionexpanded=false;
            $(this.el).append(AjaxSolr.theme("objectpreamble", nobj));
        },
        addOne: function(objectmodel){
            //console.log("is this called");
            var view=new ObjectView({model:objectmodel});
            this.$('.objecttbody').append(AjaxSolr.theme("objectline", view.model.toJSON()));
        },
        addAll: function(){
            //alert("Hi");
            //alert(this.testlist);
            this.model.each(this.addOne, this);
            this.collectionexpanded=true;
            this.$('.tablesorter').tablesorter();
            //alert(this.counter);
        },
        render: function(){
            return this;
        }
    });
    ObservationView=Backbone.View.extend({
       tagName:  "div",
       className: "publication",
       initialize: function (viewhash){
           this.widget=viewhash.widget;
           this.pubcollectionview=null;
           //this.objcollectionview=null;
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
                   links.push(AjaxSolr.theme('facet_link2',
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
               if (this.pubcollectionview.collectionexpanded===false){
                   this.model.publicationcollection.trigger('populated');
               }
               if (this.objcollectionview.collectionexpanded===false){
                    this.model.objectcollection.trigger('populated');
               }
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
           //console.log("SAVEIT:", encodeObsuri(thedoc.obsids_s));
           $.post(SITEPREFIX+'/saveobsv', JSON.stringify({
                    'savedobsv':thedoc.obsids_s, 
			        'obsvtarget':thedoc.targets_s,
			        'obsvtitle':thedoc.obsv_title
            }), function(data){
                    if (data['SUCCESS']==='defined'){
                        that.$('.savelink').hide();
                        that.$('.deletelink').show();
                    }
            });
            return false;
       },
       deleteIfSavedHandler: function(){
           var thedoc=this.model.toJSON();
           var that=this;
           console.log("SAVEIT:", thedoc.obsids_s);
           $.post(SITEPREFIX+'/deleteobsv', JSON.stringify({
                'obsvid':thedoc.obsids_s 
           }), function(data){
                    if (data['SUCCESS']==='defined'){
                        that.$('.savelink').show();
                        that.$('.deletelink').hide();
                    }
           });
           return false;
       },
       render: function() {
           //alert(this.el);
           var doc=this.model.toJSON();
           //console.log("OBSIDS_S", doc.obsids_s);
           var obsvtime_d=doc.obsvtime_d;
           var emdomains = this.facetLinks("emdomains_s", doc.emdomains_s);

           var pubcollection=this.model.publicationcollection;
           var objcollection=this.model.objectcollection;
           this.pubcollectionview=new PublicationCollectionView({model:pubcollection});
           this.objcollectionview=new ObjectCollectionView({model:objcollection});
           //This will fire things and add things to view? What about ordering?
           pubcollection.populate();
           objcollection.populate();
          
           var ajrtheme=AjaxSolr.theme('result2',
                doc, 
                AjaxSolr.theme('title2', doc),
                AjaxSolr.theme('list_items', AjaxSolr.theme('emdomains'), emdomains, "| "),
                AjaxSolr.theme('additional', 
                    doc,
                    AjaxSolr.theme('facet_link2', obsvtime_d, 'obsvtime_d', '['+obsvtime_d+' TO ' + obsvtime_d +']'), doc.exptime_f
                ),
                AjaxSolr.theme('lessmore', doc, this.objcollectionview.render().el, this.pubcollectionview.render().el),
                this.widget
          );
          //obsvcollection.trigger("populated");
          //objcollection.trigger("populated");
          $(this.el).html(ajrtheme);

          return this;
       },
    });


    ObservationCollectionView=Backbone.View.extend({
        initialize: function(options){
            this.widget=options.widget;
            this.viewdict={};
            this.model.bind("add", this.addOne, this);
        },
        addOne: function(observationmodel){
            var view=new ObservationView({model:observationmodel, widget:this.widget});
            this.viewdict[view.model.get('obsids_s')]=view;
            this.el.append(view.render().el);
        }
    });
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
    var $target=$(this.target); 
    $target.empty();
    var page=new ObservationCollection([],{ajaxsolrmanager:self.manager, from_observations:true});
    var pageview=new ObservationCollectionView({el:$target, widget:self, model:page});
    page.populate();
    docids=page.docids;
    viewhash=pageview.viewdict;
    /*
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
      AjaxSolr.theme('list_items', $('#links_' + encodeObsuri(doc.obsids_s)), gaga, "| ");
      docids.push(encodeObsuri(doc.obsids_s));
    }
    */
    //console.log("DOCIDS", docids);
    // Find out which papers have been saved so that we can change the 
    // Saved text/icon to delete.
    
    $.getJSON(SITEPREFIX+'/savedobsvs', function(data){
        if (data['savedobsvs']!='undefined'){
            var savedobsvarray=data['savedobsvs'];

            _.each(docids, function(ele){
                if (_.indexOf(savedobsvarray, ele)!=-1){
		            //$('#saveobsv_'+ele).hide();
		            //$('#delobsv_'+ele).show();
		            viewhash[ele].$('.savelink').hide();
                    viewhash[ele].$('.deletelink').show();
                }
            });
        } else {
            _.each(docids, function(ele){
                //console.log("ELE",ele);
                //$('#saveobsv_'+ele).hide();
                //$('#delobsv_'+ele).hide(); // should already be hidden but just in case
                //$('#data_'+ele).hide();
                viewhash[ele].$('.savelink').hide();
                viewhash[ele].$('.deletelink').hide(); // should already be hidden but just in case
            });
        }
    });
  
  },
  
  beforeRequest: function () {
    $(this.target).html(AjaxSolr.theme('loader'));
  }
});

})(jQuery);
