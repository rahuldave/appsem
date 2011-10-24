function encodeObsuri(obsuri){
    var splist=obsuri.split('/');
    return splist[0]+'-'+splist[1];
}

(function ($) {

    var fancyboxOpts = { 'autoDimensions': false, 'width': 1024, 'height': 768 };

    
    AjaxSolr.theme.prototype.loader = function(){
        return $('<img/>').attr('src', '/semantic2/alpha/static/images/ajax-loader.gif');
    };
    
    AjaxSolr.theme.prototype.result = function (doc, snippet, thetitlelink, thepivot, thedocthis) {

	var $morea = $('<a href="#" class="less" id="am_'+encodeObsuri(doc.obsids_s)+'">more</a>')
	    .click(thedocthis.moreHandler(doc));
	var $lessa = $('<a href="#" id="al_'+encodeObsuri(doc.obsids_s)+'" style="display:none">less</a>')
	    .click(thedocthis.lessHandler(doc));
	var $bookmark = $('<a href="#" class="savelink" id="saveobsv_'+encodeObsuri(doc.obsids_s)+'">save</a>')
	    .click(thedocthis.saveHandler(doc));
	var $unbookmark = $('<a href="#" class="deletelink" id="delobsv_'+encodeObsuri(doc.obsids_s)+'" style="display:none">delete</a>')
	    .click(thedocthis.deleteHandler(doc));
    console.log("SNIP1", snippet[1].text());
	return $('<div class="publication"/>')
	    .append($('<h5/>').append(doc.obsv_mission_s + ": ").append(thetitlelink).append(thepivot))
	    //.append("<b>Target</b>: " + doc.targets_s).
	    .append($('<div class="bookmarks"/>'))
	    //.append($('<p class="links"/>').attr('id', 'links_' + encodeObsuri(doc.obsids_s)))
	    .append('<p id="links_' + encodeObsuri(doc.obsids_s) + '" class="links"></p>')
	    .append(snippet[0])
	    .append($('<div class="lessmore"></div>').append($bookmark).append($unbookmark).append($morea).append($lessa))
	    .append(snippet[1]
		    .attr('class', 'extrapaperinfo')
		    .attr('id', 'p_' + encodeObsuri(doc.obsids_s)));
    }

    AjaxSolr.theme.prototype.result2 = function (doc, $thetitlestuff, $keywordstuff, $additional, $lessmore, thedocthis) {
	    var $morea = $('<a href="#" class="morelink" id="am_'+encodeObsuri(doc.obsids_s)+'">more</a>');
	        //.click(thedocthis.moreHandler(doc));
	    var $lessa = $('<a href="#" class="lesslink" id="al_'+encodeObsuri(doc.obsids_s)+'" style="display:none">less</a>');
	        //.click(thedocthis.lessHandler(doc));
	    var $bookmark = $('<a href="#" class="savelink" id="savepub_'+encodeObsuri(doc.obsids_s)+'">save</a>');
	        //.click(thedocthis.saveHandler(doc));
	    var $unbookmark = $('<a href="#" class="deletelink" id="delpub_'+encodeObsuri(doc.obsids_s)+'" style="display:none">delete</a>');
	        //.click(thedocthis.deleteHandler(doc));

	    return $("<div/>")
	                .append($thetitlestuff)
	                .append($keywordstuff)
	                .append($additional)
	                .append($('<div class="lessmore" state="less"></div>')
	                    .append($bookmark)
	                    .append($unbookmark)
	                    .append($morea)
	                    .append($lessa)
	                )
	                .append($lessmore
		                .attr('class', 'extrapaperinfo')
		                .attr('id', 'p_' + encodeObsuri(doc.obsids_s))
		            );
    }

//Bottom should use obslink
    AjaxSolr.theme.prototype.emdomains = function(){
        return $('<p class="links"/>');
    };
    AjaxSolr.theme.prototype.additional = function(doc, year){
	    var $output1 = $('<p class="links"/>')
	        .append(pubLabel('Observed at:'))
	        // .append(' ' + doc.pubyear_i + ' ')
	        .append(' ')
	        .append(year)
	        .append('<br/>')
	        .append(pubLabel('Target:'))
	        .append(' ')
	        .append(AjaxSolr.theme.prototype.facet_link2(doc.targets_s, 'targets_s',doc.targets_s))
	        .append(' ')
	        .append(pubLabel('Instruments:')).append(' ')
	        .append(AjaxSolr.theme.prototype.facet_link2(doc.instruments_s[0], 'instruments_s',doc.instruments_s[0]))
	        .append(' ');
	        return $output1;
	};
	 AjaxSolr.theme.prototype.lessmore = function (doc, objcollectionview_el, pubcollectionview_el) {


	    var $output2 = $('<div/>');
        var abtext = doc.telescopes_s;
	    var $abstract = $('<div class="abstracttext"/>');
	    $abstract.append(pubLabel('RA:')).append(' ').append(doc.ra_f).append('<br/>');
	    $abstract.append(pubLabel('DEC:')).append(' ').append(doc.dec_f).append('<br/>');
	    $output2.append($abstract);

	    //$output2.append(objcollectionview_el);

		$output2.append(pubcollectionview_el);
		$output2.append(objcollectionview_el);

	    // 

	    return $output2;

    }; // Ajax.theme.prototype.snippet
    
    AjaxSolr.theme.prototype.publicationpreamble=function(npub){
        //alert(nobj);
        var $start=$('<div class="insideobjectarea"/>').append(pubLabel('Papers')).append('<p class="extrapara"/>').append(' ');
        if (nobj===0){
            $start.append('None');
            return $start.append($('<br/>'));
        }
        var $otable = $('<table class="tablesorter"/>')
	        //.attr("class", "zebra-striped")
	        .append($('<thead/>')
		        .append('<tr><th>Bibcode</th><th>Year</th></tr>'));
		var $obody = $('<tbody class="objecttbody"/>');
	    $otable.append($obody);
	    $otable.tablesorter();

	    //$dataarea.append($('<div class="missiondata"/>').append($mtable));
	    $start.append($otable);
	    return $start.append($('<br/>'));
    };
    AjaxSolr.theme.prototype.publicationline=function(doc){
        var $obody=$("<tr/>");
        var bcode=doc.bibcode;
        var byear=doc.year;
        $obody.append($('<td/>')
				      .append(AjaxSolr.theme.prototype.facet_link2(bcode, 'bibcode', bcode))
				  )
			      .append($('<td/>')
				      .append(AjaxSolr.theme.prototype.facet_link2(byear, 'pubyear_i', '['+byear+' TO ' + byear +']'))
				  )
		return $obody;
      };

    AjaxSolr.theme.prototype.objectpreamble=function(nobj){
        //alert(nobj);
        var $start=$('<div class="insideobjectarea"/>').append(pubLabel('Objects')).append('<p class="extrapara"/>').append(' ');
        if (nobj===0){
            $start.append('None');
            return $start.append($('<br/>'));
        }
        var $otable = $('<table class="tablesorter"/>')
	        //.attr("class", "zebra-striped")
	        .append($('<thead/>')
		        .append('<tr><th>Name</th><th>Type</th></tr>'));
		var $obody = $('<tbody class="objecttbody"/>');
	    $otable.append($obody);
	    $otable.tablesorter();

	    //$dataarea.append($('<div class="missiondata"/>').append($mtable));
	    $start.append($otable);
	    return $start.append($('<br/>'));
     };
    
     AjaxSolr.theme.prototype.objectline=function(doc){
        var $obody=$("<tr/>");
        var oname=doc.name;
        var otype=doc.objtype;
        $obody.append($('<td/>')
				      .append(AjaxSolr.theme.prototype.simbad_link(oname))
				      .append(AjaxSolr.theme.prototype.facet_link('[P]', 'objectnames_s', oname))
				  )
			      .append($('<td/>')
				      .text(otype)
				      .append(AjaxSolr.theme.prototype.facet_link('[P]', 'objecttypes_s', otype))
				  )
		return $obody;
      };     
AjaxSolr.theme.prototype.title = function (doc) {
    var splitobsid=doc.obsv_mission_s.split('/')
    var missionname=splitobsid[splitobsid.length -1]
    var obsidwithoutmission=doc.obsids_s.split('/')
    //return $('<a class="iframe"/>').text('(Link)')
	//.attr('href', getObslink(missionname,doc.obsids_s))
	//.fancybox(fancyboxOpts);
	//alert(doc.obsids_s);
	return getObslink(missionname,obsidwithoutmission[obsidwithoutmission.length -1]);
}

AjaxSolr.theme.prototype.title2 = function (doc) {
    var splitobsid=doc.obsv_mission_s.split('/');
    var missionname=splitobsid[splitobsid.length -1];
    var obsidwithoutmission=doc.obsids_s.split('/');
	var $thetitlelink=getObslink(missionname,obsidwithoutmission[obsidwithoutmission.length -1]);
   
    var $titlepivot=AjaxSolr.theme.prototype.pivot2('obsids_s');
    return $('<h5/>').append(doc.obsv_mission_s + ": ")
                         .append($titlelink)
                         .append($titlepivot);
}

    AjaxSolr.theme.prototype.pivot2 = function (pivotclass){
        return $('<a facet_field="'+pivotclass+'" class="pivotlink '+pivotclass+'" href="#"/>').text(' [P]');
    }

    AjaxSolr.theme.prototype.facet_link2 = function (value, pivotclass, valuestring) {
        if (valuestring===undefined){
            valuestring=value;
        }
        return $('<a facet_field="'+pivotclass+'" facet_value="'+valuestring+'" class="facetlink '+pivotclass+'" href="#"/>').text(value);
    };
    
    
AjaxSolr.theme.prototype.pivot = function (doc, handler){
    var $pivot = $('<a href="#"/>').text(' [P]').click(handler);
    return $pivot;
}

AjaxSolr.theme.prototype.pivot_link = function (handler) {
        return $('<a href="#"/>').text(' [P]').click(handler);
    }
    
    function getSimbadURI(ele) {
	return 'http://simbad.u-strasbg.fr/simbad/sim-id?Ident='
	    + encodeURIComponent(ele)
	    + '&NbIdent=1&Radius=2&Radius.unit=arcmin&submit=submit+id';
    }

    function makeSimbadLink(ele) {
	return $('<a class="iframe"></a>')
	    .text(ele)
	    .attr('href', getSimbadURI(ele))
	    .fancybox(fancyboxOpts);
    }

    // Need mission specific info to determine what to link to here
    //
    function getChandraObsidlink (label, link) {
	if (link === undefined) {
	    link = label;
	}

	return $('<a class="iframe"/>')
	    .text(label)
	    .attr('href', 'http://cda.harvard.edu/chaser/ocatList.do?obsid='+link)
	    .fancybox(fancyboxOpts);
    }

    function getMASTObsidlink (mission, label, link) {
	if (link === undefined) {
	    link = label;
	}

	return $('<a class="iframe"></a>')
	    .text(label)
	    .attr('href', 'http://archive.stsci.edu/cgi-bin/mastpreview?mission='+mission+'&dataid='+link)
	    .fancybox(fancyboxOpts);
    }

    var obslinks = {
	'CHANDRA': getChandraObsidlink,

	'euve': function (obsid) { return getMASTObsidlink('euve', obsid); },
	'fuse': function (obsid) { return getMASTObsidlink('fuse', obsid); },
	'hpol': function (obsid) { return getMASTObsidlink('hpol', obsid, obsid.slice(8, obsid.length-3)); },
	'hut':  function (obsid) { return getMASTObsidlink('hut',  obsid, obsid.split('=')[0]); },
	'iue':  function (obsid) { return getMASTObsidlink('iue',  obsid, obsid.slice(0, obsid.length-4)); },
	'wuppe': function (obsid) { return getMASTObsidlink('wuppe', obsid); }

    };

    function getObslink(mission, obsid) {
	if (obslinks[mission] === undefined) {
	    alert("Internal error: no idea how to get link to mission=" + mission + " obsid=" + obsid);
	} else {
	    return obslinks[mission](obsid);
	}
    }

    function pubLabel(label) {
	return $('<span class="pubitem"/>').text(label);
    }

    function addObjectArea(parentarea, docid, objnames, objtypes) {
	    if (objnames === undefined) { return; }

	    // We want a sorted list here. We could come up with a sort
	    // function to handle sorting "M80" and "M81" but for now
	    // live with the current system.
	    //
	    var objinfo = [];
	    var i, l;
	    for (i = 0, l = objnames.length; i < l; i+= 1) {
	        objinfo.push({"name": objnames[i], "objtype": objtypes[i]});
	    }
	    objinfo.sort(function(a,b) { return a.name.localeCompare(b.name); });

	    var $otable = $('<table class="tablesorter"/>')
	        .attr('id', 'objs_' + docid)
	        .append($('<thead/>')
		        .append('<tr><th>Name</th><th>Type</th></tr>'));

	    var $obody = $('<tbody/>');
	    for (i = 0, l = objinfo.length; i < l; i += 1) {
	        var oname = objinfo[i].name;
	        var otype = objinfo[i].objtype;
	        $obody.append($('<tr/>')
			      .append($('<td/>')
				      .append(makeSimbadLink(oname))
				      .append(makePivotLink('objectnames_s:' + AjaxSolr.Parameter.escapeValue(oname)))
				  )
			      .append($('<td/>')
				      .text(otype)
				      .append(makePivotLink('objecttypes_s:' + AjaxSolr.Parameter.escapeValue(otype)))
				  )
			);
	    } 

	    $otable.append($obody);
	    parentarea.append($('<div class="objectdataarea"/>')
			      .append(pubLabel("Objects:"))
			      .append(' ')
			      .append($otable));
	    parentarea.append($('<br/>'));

	    // as with the data area, this should only be needed when the table
	    // is actually viewed.
	    $otable.tablesorter();
    }

function makePivotHandler(pivot) {
	    return function () {
	        // use global Manager which is not ideal
	        ObservationsManager.store.remove('fq');
	        ObservationsManager.store.addByValue('fq', pivot);
	        ObservationsManager.doRequest(0);
	        return false;
	    };
    }

    function makePivotLink(pivot) {
        return AjaxSolr.theme('pivot_link', makePivotHandler(pivot));
    }
    function makeFacetLink(value, pivot){
        return AjaxSolr.theme('facet_link', value, makePivotHandler(pivot));
    }
    function makeFacetLink2(ftype, value){
    //alert(AjaxSolr.Parameter.escapeValue(value));
        return AjaxSolr.theme('facet_link', value, makePivotHandler(ftype+":"+AjaxSolr.Parameter.escapeValue(value)));
    }
    // sort on exposure length, but we want largest first
    function compareObs(a, b) {
	// return a.obsid.localeCompare(b.obsid);
	var va = a.exptime, vb = b.exptime;
	if (va > vb)      { return -1; }
	else if (va < vb) { return 1; }
	else              { return 0; }
    } 

    function facetLinks (facet_field, facet_values) {
    var links = [];
    //alert(facet_values.length);
    if (facet_values) {
        for (var i = 0, l = facet_values.length; i < l; i++) {
            links.push(makeFacetLink2(facet_field, facet_values[i]));
        }
    }
    //alert(links);
    return links;
  }
  
    AjaxSolr.theme.prototype.listers=function(doc, ftype, fvalue, $jq){
      var gaga=facetLinks(ftype, fvalue);
      //items.concat(gaga);
      //alert(gaga.length+","+items.length);
      //alert(items);
      //var $jq=$('#links_' +ftype+'_'+ encodeObsuri(doc.obsids_s));
      return AjaxSolr.theme('list_items', $jq, gaga, "| ");
    }

    AjaxSolr.theme.prototype.snippet = function (doc, obsvtime) {
    //alert(doc.targets_s);
    //alert('['+doc.instruments_s+']');
	var $output1 = $('<p/>')
	    //.append(pubLabel('Authors:'))
	    // .append(' ' + doc.author.join(' ; '))
	    //.append(' ').append(authors)
	    //.append('<br/>')
	    .append(pubLabel('Observed at:'))
	    // .append(' ' + doc.pubyear_i + ' ')
	    .append(' ')
	    .append(obsvtime)
	    .append(' ')
	    .append(pubLabel('Target:')).append(' ')
	    .append(makeFacetLink2('targets_s',doc.targets_s)).append(' ')
	    .append(pubLabel('Instruments:')).append(' ')
	    .append(makeFacetLink2('instruments_s',doc.instruments_s[0])).append(' ');
    //INSTRUMENTS IS MULTIVALUED. NEEDS TO CHANGE. BUG
	var $output2 = $('<div/>');

	//var objectnames = doc.objectnames_s;
	//var obsids = doc.obsids_s;

	
	//addDataArea($output2, doc.id, doc.bibcode, doc.obsids_s, doc.exptime_f, doc.obsvtime_d, doc.targets_s);

	// do we need to HTML escape this text?
	// 
	var abtext = doc.telescopes_s;
	var $abstract = $('<div class="abstracttext"/>');
	$abstract.append(pubLabel('RA:')).append(' ').append(doc.ra_f).append('<br/>');
	$abstract.append(pubLabel('DEC:')).append(' ').append(doc.dec_f).append('<br/>');
	if (doc.bibcode !== undefined && doc.bibcode.length >0){
	    var $para=$('<p class="links"/>');
	    //alert(doc.bibcode.length);
	    $abstract.append(pubLabel('Papers:')).append(' ').append(AjaxSolr.theme("listers", doc, "bibcode", doc.bibcode, $para)).append('<br/>');
	}
	
	$output2.append($abstract);
	
	addObjectArea($output2, encodeObsuri(doc.obsids_s), doc.objectnames_s, doc.objecttypes_s);
	return [$output1, $output2];

    }; // Ajax.theme.prototype.snippet

AjaxSolr.theme.prototype.tag = function (value, thecount, weight, handler, handler2) {
  
  var $thelink=$('<a href="#"/>').text(value).click(handler);
  var $thetext=$('<span></span>').text('('+thecount+')');
  //var $thepivot=$('<a href="#""/>').text('P').click(handler2);
  var $span=$('<span class="tagcloud_item"></span>').addClass('tagcloud_size_' + weight).append('[').append($thelink).append($thetext).append(']');
  //return [$thelink, $thetext, $thepivot]
  return $span;
};

AjaxSolr.theme.prototype.facet_link = function (value, handler) {
  return $('<a href="#"/>').text(value).click(handler);
};

AjaxSolr.theme.prototype.no_items_found = function () {
  return 'no items found in current selection';
};

AjaxSolr.theme.prototype.list_items = function ($list, items, separator) {
  //var $list=$('#'+list);
  //console.log(list);
  //console.log($list);
  //var $list=$(list);
  $list.empty();
  //alert(items);
  for (var i = 0, l = items.length; i < l; i++) {
    var li = jQuery('<li/>');
    //console.log("li"+li);
    if (AjaxSolr.isArray(items[i])) {
      for (var j = 0, m = items[i].length; j < m; j++) {
        if (separator && j > 0) {
          li.append(separator);
        }
        li.append(items[i][j]);
      }
    }
    else {
      //console.log("here");
      //alert(items[i]);
      if (separator && i > 0) {
        li.append(separator);
      }
      li.append(items[i]);
    }
    $list.append(li);
  }
  //console.log("C"+$list);
  return $list;
};

})(jQuery);
