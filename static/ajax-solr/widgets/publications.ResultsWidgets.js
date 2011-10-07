/**
 * Widgets for the publications view.
 */

(function ($) {
    
ObservationModel=Backbone.Model.extend({
    //We'll just initialize with an attribute dict passed into constructor by Collection.
});
ObservationView=Backbone.View.extend({
    //We'll just initialize with an attribute dict passed into constructor by Collection.
});

//Later this can be used to get doc from server by overriding sync. Challenge is how to make it useful
//for the general case, perhaps by making simple dictionary copies.
ObservationCollection=Backbone.Collection.extend({
    initialize: function(pubmodel){
        this.pubmodel=pubmodel;
        this.doc=this.pubmodel.toJSON();
        this.missionmap={};
        //if this array is not present, because a pub had nothing, we need to deal with that: BUG
        //BUG2: we have lost pagination
        this.nobs=this.doc.obsids_s.length;
    },
    populate: function(){
        var doc=this.doc;
        var docid=this.doc.id;
        var docbibcode=this.doc.bibcode;
        var obsids=doc.obsids_s;
        var nobs=this.nobs;
        for (var i = 0; i < nobs; i += 1) {
	        var toks = obsids[i].split('/');
	        mission = toks[0];
	        var out = {"mission": mission,
	               "docid": docid,
	               "bibcode": docbibcode,    
		           "obsids_s": toks[1],
		           "exptime_f": doc.exptime_f[i],
		           "obsvtime_d": doc.obsvtime_d[i],
		           "targets_s": doc.targets_s[i].split('/', 2)[1],
		           "ra_f": doc.ra_f[i],
		           "dec_f": doc.dec_f[i]
		    };
	        if (this.missionmap[mission] === undefined) {
		        this.missionmap[mission] = [toks[1]];
	        } else {
		        this.missionmap[mission].push(toks[1]);
	        }
	        this.add(out)
	        //currently use add, later use reset and build all views together to avoid firing so many events
	    }
    },
    comparator: function(observationmodel){
        //couldnt we just return the slashed obsid
        var mission=observationmodel.get('mission');
        var obsids_s=observationmodel.get('obsids_s');
        return mission+'_'+obsids_s;
    }
});
//Call this with an appropriate el. And appropriate model!
//el must be <div class="missiondataarea"/>
ObservationCollectionView=Backbone.View.extend({
    tagName: "div",
    className: "missiondataarea",
    initialize: function(){
        this.viewdict={};
        this.model.bind("add", this.addOne, this);
        $(this.el).append(AjaxSolr.theme("datapreamble", this.model.nobs));
    },
    addOne: function(observationmodel){
        var view=new ObservationView({model:observationmodel});
        this.viewdict[view.model.get('obsid_s')]=view;
        this.$('.datatbody').append(AjaxSolr.theme("dataline", view.model.toJSON()));
    },
    render: function(){
        return this;
    }
});
PublicationModel=Backbone.Model.extend({
    initialize: function(){
        this.observationcollection=new ObservationCollection(this);
    }
});
PublicationView=Backbone.View.extend({
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
       var obsvcollection=this.model.observationcollection;
       var collectionview=new ObservationCollectionView({model:obsvcollection});
       //This will fire things and add things to view? What about ordering?
       obsvcollection.populate();
       var ajrtheme=AjaxSolr.theme('result',
            doc, 
            AjaxSolr.theme('title', doc),
            AjaxSolr.theme('list_items', AjaxSolr.theme('keywords'), keywords, "| "),
            AjaxSolr.theme('additional', 
                doc,
                AjaxSolr.theme('list_items', AjaxSolr.theme('authors'), authors, "; "),
                AjaxSolr.theme('facet_link', year, 'pubyear_i', '['+year+' TO ' + year +']')
            ),
            AjaxSolr.theme('lessmore', doc, collectionview.el),
            this.widget
      );
      $(this.el).html(ajrtheme);
      return this;
   },
});

PublicationCollection=Backbone.Collection.extend({
    initialize: function(ajaxsolrmanager){
        this.docids=[];
        this.manager=ajaxsolrmanager;
    },
    populate: function(){
        for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
          var doc = this.manager.response.response.docs[i];

          var result=new PublicationModel(doc);
          this.add(result)
          this.docids.push(doc.id);
        }
    }
});
PublicationCollectionView=Backbone.View.extend({
    initialize: function(inihash){
        this.widget=inihash.widget;
        this.viewdict={};
        this.model.bind("add", this.addOne, this);
    },
    addOne: function(publicationmodel){
        var view=new PublicationView({model:publicationmodel, widget:this.widget});
        this.viewdict[view.model.get('id')]=view;
        this.el.append(view.render().el);
    }
});

AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget.extend({

  afterRequest: function () {
    var self=this;
    var $target=$(this.target); 
    $target.empty();
    var docids=[];
    var viewhash={};
    
    var page=new PublicationCollection(self.manager);
    var pageview=new PublicationCollectionView({el:$target, widget:self, model:page});
    page.populate();
    docids=page.docids;
    viewhash=pageview.viewdict;
    
    /*
    for (var i = 0, l = self.manager.response.response.docs.length; i < l; i++) {
      var doc = self.manager.response.response.docs[i];
      var year=doc.pubyear_i;

      var result=new PublicationModel(doc);
      var resultview=new PublicationView({
        model:result, 
        widget:self
      });
      $target.append(resultview.render().el);
      //$(this.target).append();
      //AjaxSolr.theme('list_items', $('#links_' + doc.id), keywords, "| ");
      viewhash[doc.id]=resultview;
      docids.push(doc.id);
    }
    */
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
