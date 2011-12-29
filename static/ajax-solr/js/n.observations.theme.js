function encodeObsuri(obsuri){
    var splist=obsuri.split('/');
    return splist[0]+'-'+splist[1];
}

(function ($) {

    var fancyboxOpts = { 'autoDimensions': false, 'width': 1024, 'height': 768 };

    
    AjaxSolr.theme.prototype.loader = function(){
        return $('<img/>').attr('src', SITEPREFIX+'/static/images/ajax-loader.gif');
    };


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
    AjaxSolr.theme.prototype.additional = function(doc, year, exptime){
	    var $output1 = $('<p class="links"/>')
	        .append(pubLabel('Observed at:'))
	        // .append(' ' + doc.pubyear_i + ' ')
	        .append(' ')
	        .append(year)
	        .append(pubLabel('Exposure Time:'))
	        // .append(' ' + doc.pubyear_i + ' ')
	        .append(' ')
	        .append(exptime)
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
        var $start=$('<div class="insidepublicationarea"/>').append(pubLabel('Papers')).append('<p class="extrapara"/>').append(' ');
        if (npub===0){
            $start.append('None');
            return $start.append($('<br/>'));
        }
        var $otable = $('<table class="tablesorter"/>')
	        //.attr("class", "zebra-striped")
	        .append($('<thead/>')
		        .append('<tr><th>Bibcode</th><th>Year</th></tr>'));
		var $obody = $('<tbody class="publicationtbody"/>');
	    $otable.append($obody);
	    //$otable.tablesorter();

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
        console.log("World"+nobj);
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
	    //$otable.tablesorter();

	    //$dataarea.append($('<div class="missiondata"/>').append($mtable));
	    $start.append($otable);
	    return $start.append($('<br/>'));
     };
     AjaxSolr.theme.prototype.simbad_link = function(ele){
         return $('<a class="iframe"></a>')
 	        .text(ele)
 	        .attr('href', getSimbadURI(ele))
 	        .fancybox(fancyboxOpts);
     }
     AjaxSolr.theme.prototype.mission_link = function(mission, labelisobsid, formatlink){
         if (formatlink===undefined || formatlink===null){
             formatlink=getObslink(mission, labelisobsid);
         }
         //alert("LIO: "+labelisobsid);
         return $('<a class="iframe"></a>')
 	        .text(labelisobsid)
 	        .attr('href', formatlink)
 	        .fancybox(fancyboxOpts);
     }
     AjaxSolr.theme.prototype.objectline=function(doc){
        //console.log("here");
        var $obody=$("<tr/>");
        var oname=doc.name;
        var otype=doc.objtype;
        $obody.append($('<td/>')
				      .append(AjaxSolr.theme.prototype.simbad_link(oname))
				      .append(AjaxSolr.theme.prototype.facet_link2('[P]', 'objectnames_s', oname))
				  )
			      .append($('<td/>')
				      .text(otype)
				      .append(AjaxSolr.theme.prototype.facet_link2('[P]', 'objecttypes_s', otype))
				  )
		return $obody;
      };     


AjaxSolr.theme.prototype.title2 = function (doc) {
    var splitobsid=doc.obsv_mission_s.split('/');
    var missionname=splitobsid[splitobsid.length -1];
    var obsidwithoutmission=doc.obsids_s.split('/');
    console.log(splitobsid, missionname, obsidwithoutmission);
    var titlehref=getObslink(missionname,obsidwithoutmission[obsidwithoutmission.length -1]);
    var $titlelink=$('<a class="iframe"/>').text('(Link)')
            .attr('href', titlehref)
            .fancybox(fancyboxOpts);

   
    var $titlepivot=AjaxSolr.theme.prototype.pivot2('obsids_s');
    return $('<h5/>').append(doc.obsv_mission_s + ": "+obsidwithoutmission[obsidwithoutmission.length -1])
                         .append($titlelink)
                         .append($titlepivot);
}

    AjaxSolr.theme.prototype.pivot2 = function (pivotclass){
        return $('<a facet_field="'+pivotclass+'" class="label pivotlink '+pivotclass+'" href="#"/>').text('P');
    }

    AjaxSolr.theme.prototype.facet_link2 = function (value, pivotclass, valuestring) {
        if (valuestring===undefined){
            valuestring=value;
        }
        return $('<a facet_field="'+pivotclass+'" facet_value="'+valuestring+'" class="facetlink '+pivotclass+'" href="#"/>').text(value);
    };
    
    


    function pubLabel(label) {
	return $('<span class="pubitem"/>').text(label);
    }



/*    function facetLinks (facet_field, facet_values) {
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
*/


AjaxSolr.theme.prototype.tag = function (value, thecount, weight, handler, handler2) {
  
  var $thelink=$('<a href="#"/>').text(value).click(handler);
  var $thetext=$('<span></span>').text('('+thecount+')');
  //var $thepivot=$('<a href="#""/>').text('P').click(handler2);
  var $span=$('<span class="tagcloud_item"></span>').addClass('tagcloud_size_' + weight).append('[').append($thelink).append($thetext).append(']');
  //return [$thelink, $thetext, $thepivot]
  return $span;
};

AjaxSolr.theme.prototype.pivot_link = function (handler) {
    return $('<a class="label pivotlink" href="#"/>').text('P').click(handler);
}

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
