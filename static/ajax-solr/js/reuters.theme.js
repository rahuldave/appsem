(function ($) {

    var fancyboxOpts = { 'autoDimensions': false, 'width': 1024, 'height': 768 };

    AjaxSolr.theme.prototype.result = function (doc, snippet, thetitlelink, thepivot, thedocthis) {

	var $morea = $('<a href="#" class="less" id="am_'+doc.id+'">more</a>')
	    .click(thedocthis.moreHandler(doc));
	var $lessa = $('<a href="#" id="al_'+doc.id+'" style="display:none">less</a>')
	    .click(thedocthis.lessHandler(doc));
	var $bookmark = $('<a href="#" class="save" id="savepub_'+doc.id+'">save</a>')
	    .click(thedocthis.saveHandler(doc));
	var $unbookmark = $('<a href="#" class="delete" id="delpub_'+doc.id+'" style="display:none">delete</a>')
	    .click(thedocthis.deleteHandler(doc));

	return $('<div class="publication"/>')
	    .append($('<h2/>').append(doc.title + " ").append(thetitlelink).append(thepivot))
	    .append($('<div class="bookmarks"/>'))
	    .append($('<p class="links"/>').attr('id', 'links_' + doc.id))
	    .append('<p id="links_' + doc.id + '" class="links"></p>')
	    .append(snippet[0])
	    .append(snippet[1]
		    .attr('class', 'extrapaperinfo')
		    .attr('id', 'p_' + doc.id))
	    .append($('<div class="lessmore"></div>').append($bookmark).append($unbookmark).append($morea).append($lessa));
    }

AjaxSolr.theme.prototype.title = function (doc) {
    return $('<a class="iframe"/>').text('(Link)')
	.attr('href', "http://labs.adsabs.harvard.edu/ui/abs/"+doc.bibcode)
	.fancybox(fancyboxOpts);
}

AjaxSolr.theme.prototype.pivot = function (doc, handler){
    var $pivot = $('<a href="#"/>').text(' [P]').click(handler);
    return $pivot;
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

    function pubLabel(label) {
	return $('<span class="pubitem"/>').text(label);
    }

    function addObjectArea(parentarea, objnames) {
	if (objnames === undefined) { return; }

	// We want a sorted list here. We could come up with a sort
	// function to handle sorting "M80" and "M81" but for now
	// live with the current system. It is not clear whether
	// we need to copy the objnames array before sorting it but
	// do so just to be safe.
	//
	objnames = objnames.slice(0).sort();
	var $objarea = $('<div class="objectdataarea"></div>')
	    .append(pubLabel("Objects:"))
	    .append(' ');
	for (var ele in objnames){
	    $objarea.append(makeSimbadLink(objnames[ele]));
	} 
	parentarea.append($objarea);
	parentarea.append($('<br/>'));
    }

    function addDataArea(parentarea, bibcode, obsids) {
	if (obsids === undefined) { return; }

	var $dataarea = $('<div class="missiondataarea"></div>')
	    .append(pubLabel('Datasets:'))
	    .append(' ');
	
	// we sort so that the same missions get grouped together
	var obsarray = obsids.sort().map(function(ele) {
	    return ele.split("/"); // assume '/' does not occur as part of an obsid; not ideal
	} );
	    
	// the following is not intended to be efficient or idiomatic javascript
	//
	var missionmap = {};
	var curmission = "";
	for (var e1 in obsarray) {
	    var mission = obsarray[e1][0];
	    var obsid   = obsarray[e1][1];
	    if (mission === curmission) {
		missionmap[mission].push(obsid);
	    } else {
		curmission = mission;
		missionmap[mission] = [obsid];
	    }
	}
	
	var mastmissions = [];
	for (var mission in missionmap) {
	    if (mission !== "CHANDRA") {
		mastmissions.push(missionmap[mission].length + " " + mission);
	    }
	}
	var nmanymast = mastmissions.length > 1;
	var allmasttest;
	if (nmanymast) {
	    allmasttext = "All MAST (" + mastmissions.join(', ') + ")";
	} else if (mastmissions.length == 1) {
	    allmasttext = "All (" + missionmap[mission].length + ")";
	} else {
	    allmasttext = "";
	}
	
	// Currently relying on the fact that only have Chandra or MAST missions,
	// and that Chandra will appear before any MAST mission
	//
	for (var mission in missionmap) {
	    var mobsids = missionmap[mission];
	    
	    var $missionbody = $('<div class="missiondata"></div>').append($('<span class="missionname">' + mission + ':</i>'));
	    
	    // do we want a "download all obsids" link?
	    var nmany = mobsids.length > 1;
	    if (mission == "CHANDRA") {
		if (nmany) {
		    $missionbody.append($('<a class="iframe"></a>')
					.text('All (' + mobsids.length + ')')
					.attr('href', 'http://cda.harvard.edu/chaser/ocatList.do?obsid='+mobsids.join(','))
					.fancybox(fancyboxOpts));
		}
	    } else if (nmany || nmanymast) {
		// Assuming MAST, adding an "all" for each MAST mission
		//
		$missionbody.append($('<a class="iframe"/>')
				    .text(allmasttext)
				    .attr('href', 'http://archive.stsci.edu/mastbibref.php?bibcode='+encodeURIComponent(bibcode))
				    .fancybox(fancyboxOpts));
	    }
	    
	    $missionbody.append($('<br/>'));
	    
	    // ad-hoc collection of MAST missions for which the data link is known to
	    // not work (we exclude rather than include to allow testing/easy addition of
	    // new missions).
	    var mastmissionmap = { };
	    
	    // now the individual obsids; this should be made more modular
	    if (mission === "CHANDRA") {
		for (var idx in mobsids) {
		    $missionbody
			.append($('<a class="iframe"></a>')
				.text(mobsids[idx])
				.attr('href', 'http://cda.harvard.edu/chaser/ocatList.do?obsid='+mobsids[idx])
				.fancybox(fancyboxOpts));
		}
	    } else {
		// Assuming MAST, which will eventually be wrong
		// and all this mission-specific knowledge is not ideal
		
		if (mission in mastmissionmap) {
		    for (var idx in mobsids) {
			$missionbody.append('<span class="obsid">' + mobsids[idx] + '</span> ');
		    }
		} else {
		    for (var idx in mobsids) {
			// This link is nice because the MAST page includes useful visualization,
			// but it looks like the data links don't match those from the obsid page,
			// for the one obsid from EUVE that Doug looked at.
			
			var obsidlnk = mobsids[idx]; // should we change the text too?
			if (mission === "hpol") {
			    obsidlnk = obsidlnk.slice(8, obsidlnk.length-3);
			} else if (mission === "hut") {
			    // remove the time value, but this doesn't always create a working link
			    obsidlnk = obsidlnk.split("=")[0];
			} else if (mission === "iue") {
			    obsidlnk = obsidlnk.slice(0, obsidlnk.length-4);
			}
			
			$missionbody.append($('<a class="iframe"></a>')
					    .text(mobsids[idx])
					    .attr('href', 'http://archive.stsci.edu/cgi-bin/mastpreview?mission='+mission+'&dataid='+obsidlnk)
					    .fancybox(fancyboxOpts));
		    }
		}
	    }
	    
	    $dataarea.append($missionbody);
	}
	    
	parentarea.append($dataarea);
	parentarea.append($('<br/>'));
	    
    } // addDataArea

    AjaxSolr.theme.prototype.snippet = function (doc, authors) {
	var $output1 = $('<p/>')
	    .append(pubLabel('Authors:'))
	    // .append(' ' + doc.author.join(' ; '))
	    .append(' ').append(authors)
	    .append('<br/>')
	    .append(pubLabel('Year:'))
	    .append(' ' + doc.pubyear_i + ' ')
	    .append(pubLabel('BibCode:'))
	    .append(' ' + doc.bibcode + ' ')
	    .append(pubLabel('Citations:'))
	    .append(' ' + doc.citationcount_i);

	var $output2 = $('<div/>');

	var objectnames = doc.objectnames_s;
	var obsids = doc.obsids_s;

	addObjectArea($output2, doc.objectnames_s);
	addDataArea($output2, doc.bibcode, doc.obsids_s);

	// do we need to HTML escape this text?
	// 
	var abtext = doc.abstract;
	var $abstract = $('<div class="abstracttext"><span class="pubitem">Abstract:</span> '+abtext+'</div>');
	$output2.append($abstract);
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

AjaxSolr.theme.prototype.list_items = function (list, items, separator) {
  //var $list=$('#'+list);
  //console.log(list);
  //console.log($list);
  var $list=$(list);
  $list.empty();
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
      if (separator && i > 0) {
        li.append(separator);
      }
      li.append(items[i]);
    }
    $list.append(li);
  }
  //console.log("C"+$list);
};

})(jQuery);
