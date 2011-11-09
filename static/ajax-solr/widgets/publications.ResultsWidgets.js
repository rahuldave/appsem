/**
 * Widgets for the publications view.
 */

(function ($) {
         

ObservationView=Backbone.View.extend({
    //We'll just initialize with an attribute dict passed into constructor by Collection.
});


ObjectView=Backbone.View.extend({
    //We'll just initialize with an attribute dict passed into constructor by Collection.
});


//Call this with an appropriate el. And appropriate model!
//el must be <div class="missiondataarea"/>
//BUG: is explicit append ok in views?
ObservationCollectionView=Backbone.View.extend({
    tagName: "div",
    className: "missiondataarea",
    initialize: function(){
        this.counter=0;
        this.viewdict={};
        this.collectionexpanded=false;
        //this.model.bind("add", this.addOne, this);
        this.model.bind("populated", this.addAll, this);
        $(this.el).append(AjaxSolr.theme("datapreamble", this.model.nobs));
    },
    addOne: function(observationmodel){
        //alert("hi");
        var view=new ObservationView({model:observationmodel});
        //this.counter=this.counter+1;
        this.viewdict[view.model.get('obsids_s')]=view;
        //alert(view.model.get('mission'));
        //alert(objToString(view.model.toJSON()));
        this.$('.datatbody').append(AjaxSolr.theme("dataline", view.model.toJSON()));
    },
    testAddOne: function(observationmodel){
          var view=new ObservationView({model:observationmodel});
          this.testlist.push(view.model.get('mission'));
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
        //render additional stuff

	    // Display any 'download all data' links
	    //  - multiple chandra
	    //  - multiple MAST
	    //
	    // At present we only support "all MAST", not
	    // per mission within MAST.
	    //
	    var marray, nm;
	    var missionmap=this.model.missionmap;
	    var missions=this.model.missions;
	    var mastmissions=this.model.mastmissions;
	    var nmissions = missions.length;
        
	    if (missionmap["CHANDRA"] !== undefined) {
	        marray = missionmap["CHANDRA"];
	        nm = marray.length;

	        if (nm > 1) {
		        var mobsids = marray.map(function(e) { return e.obsid; });
		        this.$('.extrapara').append(AjaxSolr.theme.prototype.mission_link('', 'All CHANDRA (' + nm + ')',
		            getChandraObsidlink('',mobsids.join(',')))
		        ).append(' ');
	        }
	    }

	    var nmast = mastmissions.length;
	    if (nmast > 1 || (nmast == 1 && missionmap[mastmissions[0]].length > 1)) {
	        var label = 'All MAST ('
		    + mastmissions.map(function (m) { return missionmap[m].length + ' ' + m; }).join(', ') 
		    + ')';
	        this.$('.extrapara').append(
		        AjaxSolr.theme.prototype.mission_link('', label, getMASTBibrefLink(this.model.doc.bibcode))
	        );
	    }
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

PublicationView=Backbone.View.extend({
   tagName:  "div",
   className: "publication",
   initialize: function (viewhash){
       this.widget=viewhash.widget;
       this.objcollectionview=null;
       this.obsvcollectionview=null;
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
           if (this.obsvcollectionview.collectionexpanded===false){
               this.model.observationcollection.trigger('populated');
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
       var objcollection=this.model.objectcollection;
       this.obsvcollectionview=new ObservationCollectionView({model:obsvcollection});
       this.objcollectionview=new ObjectCollectionView({model:objcollection});
       //This will fire things and add things to view? What about ordering?
       obsvcollection.populate();
       objcollection.populate();
      
       var ajrtheme=AjaxSolr.theme('result',
            doc, 
            AjaxSolr.theme('title', doc),
            AjaxSolr.theme('list_items', AjaxSolr.theme('keywords'), keywords, "| "),
            AjaxSolr.theme('additional', 
                doc,
                AjaxSolr.theme('list_items', AjaxSolr.theme('authors'), authors, "; "),
                AjaxSolr.theme('facet_link', year, 'pubyear_i', '['+year+' TO ' + year +']')
            ),
            AjaxSolr.theme('lessmore', doc, this.objcollectionview.render().el, this.obsvcollectionview.render().el),
            this.widget
      );
      //obsvcollection.trigger("populated");
      //objcollection.trigger("populated");
      $(this.el).html(ajrtheme);

      return this;
   },
});


PublicationCollectionView=Backbone.View.extend({
    initialize: function(options){
        this.widget=options.widget;
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
    
    var page=new PublicationCollection([],{ajaxsolrmanager:self.manager, from_publications:true});
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
