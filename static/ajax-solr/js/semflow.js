var Manager;
var SITEPREFIX='';
var SITEPREFIX='/semantic2/alpha';
(function() {
   function nop() {}
   if (! ("console" in window) || !("firebug" in console)) {
      var names = ["log", "debug", "info", "warn", "error", "assert", "dir",
		   "dirxml", "group", "groupEnd", "time", "timeEnd", "count",
		   "trace", "profile", "profileEnd"];
      window.console = {};
      for (var i = 0; i < names.length; ++i) {
	 window.console[names[i]] = nop;
      }
   }
})();

(function ($) {
  $(function () {
    console.log("WHEN IS THIS CALLED?");
    var userhasbeengot=false;
    Manager = new AjaxSolr.Manager({
      //solrUrl: 'http://boom.dyndns.org:8983/solr/'
	  //solrUrl: 'http://adslabs.nareau.com:8983/solr/'
	  //solrUrl: 'http://labs.adsabs.harvard.edu/semanticsolr2/solr/'
	  solrUrl: SITEPREFIX+'/solr/'
    });
    Manager.addWidget(new AjaxSolr.ResultWidget({
      id: 'result',
      target: '#docs'
    }));
    Manager.addWidget(new AjaxSolr.PagerWidget({
      id: 'pager',
      target: '#pager',
      prevLabel: '&lt;',
      nextLabel: '&gt;',
      innerWindow: 1,
      renderHeader: function (perPage, offset, total) {
          $('#pager-header').html($('<span/>').text('displaying ' + Math.min(total, offset + 1) + ' to ' + Math.min(total, offset + perPage) + ' of ' + total+' ')).append($('<a class="save" id="save-search" href="#">save search</a>')).append($('<a class="delete" id="delete-search" style="display:none" href="#">delete search</a>')).append($('<a class="save" id="get-data" href="#">get data</a>'));
        $('#save-search').click(function(){
            $.post(SITEPREFIX+'/savesearch', JSON.stringify({'savedsearch':location.href.split("#")[1]}), function(data){
                //should we decode uri component above? We do it on server so perhaps not.
                if (data['success']==='defined'){
		    $('#save-search').hide();
		    $('#delete-search').show();
                }
            });  
            return false;
        });
        $('#delete-search').click(function(){
            $.post(SITEPREFIX+'/deletesearch', JSON.stringify({'savedsearch':location.href.split("#")[1]}), function(data){
                //should we decode uri component above? We do it on server so perhaps not.
                if (data['success']==='defined'){
		    $('#delete-search').hide();
		    $('#save-search').show();
                }
            });  
            return false;
        });
        $('#get-data').click(function(){
            alert("not yet implemented");
            return false;
        });
        console.log("HAHAHAHAHAHAHAHAHA");
        //this gets called all the time. How to avoid this?
        $.getJSON(SITEPREFIX+'/savedsearches', function(data){
            var thissearchurl=location.href.split("#")[1];
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
                $('#get-data').hide();
            }
        });
      }
    }));
    /* Doug has taken out papertype
    var fields = [ 'keywords', 'author', 'papertype', 'objecttypes', 'objectnames', 'obsvtypes', 'obsids', 'instruments', 'missions', 'emdomains', 'targets', 'datatypes', 'propids', 'proposaltype', 'proposalpi'];
    var facet_fields= [ 'keywords_s', 'author_s', 'papertype_s' , 'objecttypes_s', 'objectnames_s', 'obsvtypes_s', 'obsids_s', 'instruments_s', 'missions_s', 'emdomains_s', 'targets_s', 'datatypes_s', 'propids_s', 'proposaltype_s', 'proposalpi_s'];
    */
    var fields = [ 'keywords', 'author', 'objecttypes', 'objectnames', 'obsvtypes', 'obsids', 'instruments', 'missions', 'emdomains', 'targets', 'datatypes', 'propids', 'proposaltype', 'proposalpi'];
    var facet_fields= [ 'keywords_s', 'author_s', 'objecttypes_s', 'objectnames_s', 'obsvtypes_s', 'obsids_s', 'instruments_s', 'missions_s', 'emdomains_s', 'targets_s', 'datatypes_s', 'propids_s', 'proposaltype_s', 'proposalpi_s'];
    for (var i = 0, l = fields.length; i < l; i++) {
      Manager.addWidget(new AjaxSolr.TagcloudWidget({
        id: fields[i],
        target: '#' + fields[i],
        field: facet_fields[i]
      }));
    }
    
    Manager.addWidget(new AjaxSolr.CurrentSearchWidget({
        id: 'currentsearch',
        target: '#selection',
        ffields: facet_fields
    }));
    /*Manager.addWidget(new AjaxSolr.TextWidget({
    id: 'text',
    target: '#search',
    field: 'text'
    }));*/
    Manager.addWidget(new AjaxSolr.AutocompleteWidget({
        id: 'text',
        target: '#search',
        field: 'text',
        fields: facet_fields
    }));
    Manager.addWidget(new AjaxSolr.YearWidget({
        id: 'pubyear',
        target: '#pubyear',
        field: 'pubyear_i'
    }));
    numericfields=['ra', 'dec', 'exptime'];
    facet_numericfields=['ra_f', 'dec_f', 'exptime_f'];
    min_numericfields=[0.0, -90.0, 0.0];
    max_numericfields=[360.0, 90.0, 10.0];
    step_numericfields=[15.0, 10.0, 1.0];
    for (var i = 0, l = numericfields.length; i < l; i++) {
        Manager.addWidget(new AjaxSolr.DualSliderWidget({
            id: numericfields[i],
            target: '#'+numericfields[i],
            field: facet_numericfields[i],
            themin: min_numericfields[i],
            themax: max_numericfields[i],
            thestep: step_numericfields[i]
        }));
    }
    Manager.addWidget(new AjaxSolr.DateRangerWidget({
        id: 'obsvtime',
        target: '#obsvtime',
        field: 'obsvtime_d',
        themin: 1988,
        themax: 2010,
        thestep: 10
    }));
    Manager.setStore(new AjaxSolr.ParameterHashStore());
    Manager.store.exposed = [ 'fq', 'q' ];
    Manager.init();
    Manager.store.addByValue('q', '*:*');
    console.log("facet_fields:", facet_fields);
    var params = {
      'facet': true,
      'facet.field': facet_fields,
      'facet.pubyear': 'pubyear_i',
      'facet.pubyear.start':1990,
      'facet.pubyear.end':2010,
      'facet.pubyear.step':1,
      'facet.limit': 20,/* change this to set autocompletion limits differently...or solr 1.5*/
      'facet.mincount': 1,
      'f.topics.facet.limit': 50,
      'json.nl': 'map',
      'sort':'citationcount_i desc',
      'rows':20
    };
    for (var name in params) {
      Manager.store.addByValue(name, params[name]);
    }
    Manager.doRequest();
    //alert(encodeURI(window.location));
	//  $('a.iframe').fancybox({autoDimensions: false, width:1024, height:768});
    //Stuff which should be refactored as WIDGETS: TODO
    
    function myjsonp(data){
        return data; //so that we dont handle url on server
    }
    $('#gosearch').click(function(){
        alert("not yet implemented");
    });
    $('a#loginhref').click(function(){
        var loc=encodeURIComponent(window.location);
        //alert(loc);
        //window.location.href="http://adsabs.harvard.edu/cgi-bin/nph-manage_account?man_cmd=login&man_url="+loc;
        //window.location.href="/login?currenturl="+loc;
        $.ajax({
            url: "http://labs.adsabs.harvard.edu"+SITEPREFIX+"/adsjsonp?callback=?",
            dataType: 'jsonp',
            jsonpcallback: myjsonp,
            success:    function(data) {
                if (data['email']!=''){
                    $('a#loginhref').text(data['email']);
                    $('a#loginhref').text(data['email']).attr('href', SITEPREFIX+'/explorer/saved');
                    $.post(SITEPREFIX+'/addtoredis', JSON.stringify(data), function(){
                        //not correct as it dosent do anything on nonpublication pages
                        var thisloc=window.location;
                        //Manager.doRequest();
                        //alert(thisloc.href);
                        window.location.reload();
                    });
                } else {//we aint logged in
                    $('a#loginhref').click(function(){
                        var thispage=window.location;
                        var prefix=thispage.protocol+'//'+location.host;
                        var loc=encodeURIComponent(prefix+SITEPREFIX+"/login?redirect="+window.location);
                        window.location.href="http://adsabs.harvard.edu/cgi-bin/nph-manage_account?man_cmd=login&man_url="+loc;
                        //window.location.href="/login?redirect="+loc;
                    });
                    //$.cookie('startup', 'anyvalue', { expires: new Date(Date.now()+300000), path: '/' });
                    $('a#loginhref').trigger('click');
                }
            }
        });
    });
    $('a#logouthref').click(function(){
        var loc=encodeURIComponent(window.location);
        console.log("loc",loc);
        window.location.href=SITEPREFIX+"/logout?redirect="+loc;
    });

    console.log('Hi');

        $.getJSON(SITEPREFIX+'/getuser', function(data){
            console.log("DADATA",data);
            if (data['email']!='null' && data['email'] != 'undefined'){
                $('a#loginhref').text(data['email']).attr('href', SITEPREFIX+'/explorer/saved');
                userhasbeengot=true;
                
            }
            else{//shouldnt we distinguish null from undefined? null is for no db entry, undefined for no cookie
                //only go in if local cookie found
                //console.log("$$$$$$$$$$$$$$$$$$$COOK",$.cookie('logincookie'));
                //if ($.cookie('startup')=='anyvalue'){
                console.log("making ajax call to jsonp callback");
                if (data['startup']!='undefined'){
                $.ajax({
                    url: "http://labs.adsabs.harvard.edu"+SITEPREFIX+"/adsjsonp?callback=?",
                    dataType: 'jsonp',
                    jsonpcallback: myjsonp,
                    success:    function(data) {
                        //$.cookie('startup', null);//should it be only on success?
                        if (data['email']!=''){
                            $('a#loginhref').text(data['email']);
                            $('a#loginhref').text(data['email']).attr('href', SITEPREFIX+'/explorer/saved');
                            $.post(SITEPREFIX+'/addtoredis', JSON.stringify(data));
                        }
                        
                    }
                });
                }
            
            }
        });
    
    /*
    $.ajax({
        url: "http://labs.adsabs.harvard.edu/semantic2/adsjsonp?callback=?",
        dataType: 'jsonp',
        jsonpcallback: myjsonp,
        success:    function(data) {
                        $('a#loginhref').text(data['email']);
                        $.post('/addtoredis', JSON.stringify(data));
                    }
        }
    );
    */
  });
})(jQuery);
