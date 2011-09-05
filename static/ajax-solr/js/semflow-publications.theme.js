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

    // for now have pivot that requires a doc argument (unused) and
    // pivot_link that doesn't.
    //
    AjaxSolr.theme.prototype.pivot = function (doc, handler){
	return $('<a href="#"/>').text(' [P]').click(handler);
    }

    AjaxSolr.theme.prototype.pivot_link = function (handler) {
	return $('<a href="#"/>').text(' [P]').click(handler);
    }
    
    AjaxSolr.theme.prototype.facet_link = function (value, handler) {
	return $('<a href="#"/>').text(value).click(handler);
    };

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

    function makePivotHandler(pivot) {
	return function () {
	    // use global Manager which is not ideal
	    Manager.store.remove('fq');
	    Manager.store.addByValue('fq', pivot);
	    Manager.doRequest(0);
	    return false;
	};
    }

    function makePivotLink(pivot) {
	return AjaxSolr.theme('pivot_link', makePivotHandler(pivot));
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

    // sort on exposure length, but we want largest first
    function compareObs(a, b) {
	// return a.obsid.localeCompare(b.obsid);
	var va = a.exptime, vb = b.exptime;
	if (va > vb)      { return -1; }
	else if (va < vb) { return 1; }
	else              { return 0; }
    } 

    // Create the data area for this publication. Some code could probably be
    // cleaned up by processing based on the name of the "mission parent" - e.g.
    // we encode target names as 'MAST/foo' and 'CHANDRA/bar' and so we could
    // use 'MAST' to possibly simplify some logic below
    // 
    function addDataArea(parentarea, docid, bibcode, obsids, exptimes, expdates, targets, ras, decs) {
	if (obsids === undefined) { return; }

	var $dataarea = $('<div class="missiondataarea"/>')
	    .append(pubLabel('Datasets:'))
	    .append(' ');
	
	// Combine the data, as well as cleaning up the obsid value
	var missionmap = {};
	var nobs = obsids.length;
	var mission;
	for (var i = 0; i < nobs; i += 1) {
	    var toks = obsids[i].split('/');
	    mission = toks[0];
	    var out = {"mission": mission,
		       "obsid": toks[1],
		       "exptime": exptimes[i],
		       "obsdate": expdates[i],
		       "target": targets[i].split('/', 2)[1],
		       "ra": ras[i],
		       "dec": decs[i]
		      };
	    if (missionmap[mission] === undefined) {
		missionmap[mission] = [out];
	    } else {
		missionmap[mission].push(out);
	    }
	}

	// Ensure the mission data is sorted; we want the data
	// sorted by exposure time within each mission rather
	// than an overall sort on exposure (as would be provided
	// by tablesorter).
	//
	var missions = [];
	var mastmissions = [];
	for (mission in missionmap) {
	    missionmap[mission].sort(compareObs);
	    missions.push(mission);
	    if (mission !== "CHANDRA") { mastmissions.push(mission); }
	}
	missions.sort();
	mastmissions.sort();
	var nmissions = missions.length;

	// Display any 'download all data' links
	//  - multiple chandra
	//  - multiple MAST
	//
	// At present we only support "all MAST", not
	// per mission within MAST.
	//
	var marray, nm;
	if (missionmap["CHANDRA"] !== undefined) {
	    marray = missionmap["CHANDRA"];
	    nm = marray.length;

	    if (nm > 1) {
		var mobsids = marray.map(function(e) { return e.obsid; });
		$dataarea.append(
		    getChandraObsidlink('All CHANDRA (' + nm + ')',
					mobsids.join(','))
		);
		$dataarea.append(' ');

	    }
	}

	var nmast = mastmissions.length;
	if (nmast > 1 || (nmast == 1 && missionmap[mastmissions[0]].length > 1)) {
	    var label = 'All MAST ('
		+ mastmissions.map(function (m) { return missionmap[m].length + ' ' + m; }).join(', ') 
		+ ')';
	    $dataarea.append(
		$('<a class="iframe"/>')
		    .text(label)
		    .attr('href', 'http://archive.stsci.edu/mastbibref.php?bibcode='+encodeURIComponent(bibcode))
		    .fancybox(fancyboxOpts)
	    );
	}

	// Now the data table containing all the missions. We could split out into mission-specific
	// tables but leave as a single one for now.
	//
	// Could add more rows and clean up or remove the # column
	//
	var colnames = ["Mission", "Observation", "Exposure time (s)",
			"Observation date", "Target name", "RA", "Dec"];
	var $mtable = $('<table class="tablesorter"/>')
	    .attr('id', 'obsdata_' + docid)
	    .append($('<thead/>')
		    .append($('<tr/>')
			    .append(colnames.map(function (c) { return "<th>" + c + "</th>"; }).join('')))
		   );

	var $mbody = $('<tbody/>');

	for (midx = 0; midx < nmissions; midx += 1) {
	    mission = missions[midx];
	    var mvalues = missionmap[mission];
	    var mitems = mvalues.length;

	    // hacky; curently used to create the target-name pivot
	    var parent;
	    if (mission == 'CHANDRA') {
		parent = 'CHANDRA';
	    } else {
		parent = 'MAST';
	    }

	    for (var idx = 0; idx < mitems; idx += 1) {
		var ctr = idx + 1;
		var obsid = mvalues[idx].obsid;
		var obsidpivot = 'obsids_s:' + AjaxSolr.Parameter.escapeValue(mission + '/' + obsid);
		$mbody.append($('<tr/>')
			      .append($('<td/>').text(mission.toUpperCase()))
			      .append($('<td/>')
				      .append(getObslink(mission, obsid))
				      .append(makePivotLink(obsidpivot))
				     )
			      .append($('<td/>').text(mvalues[idx].exptime))
			      .append($('<td/>').text(mvalues[idx].obsdate))
			      .append($('<td/>')
				      .text(mvalues[idx].target)
				      .append(makePivotLink('targets_s:' + 
							    AjaxSolr.Parameter.escapeValue(parent + '/' + mvalues[idx].target)))
				     )
			      .append($('<td/>').text(mvalues[idx].ra)) // may want to try <span value=decimal>text value</span> trick?
			      .append($('<td/>').text(mvalues[idx].dec))
			     );
	    }
	}

	// Ensure we can sort the table; the tablesorter call *could* be made
	// when the 'more' link is activated by the user (as an optimisation for the
	// case when multiple tables are being created but none actually viewed
	// by the user), but worry about that only if profiling shows it is an
	// actual issue.
	// 
	$mtable.append($mbody);
	$mtable.tablesorter();

	//$dataarea.append($('<div class="missiondata"/>').append($mtable));
	$dataarea.append($mtable);

	parentarea.append($dataarea);
	parentarea.append($('<br/>'));
	    
    } // addDataArea

    AjaxSolr.theme.prototype.snippet = function (doc, authors, year) {
	var $output1 = $('<p/>')
	    .append(pubLabel('Authors:'))
	    // .append(' ' + doc.author.join(' ; '))
	    .append(' ').append(authors)
	    .append('<br/>')
	    .append(pubLabel('Year:'))
	    // .append(' ' + doc.pubyear_i + ' ')
	    .append(' ')
	    .append(year)
	    .append(' ')
	    .append(pubLabel('BibCode:'))
	    .append(' ' + doc.bibcode + ' ')
	    .append(pubLabel('Citations:'))
	    .append(' ' + doc.citationcount_i);

	var $output2 = $('<div/>');

	var objectnames = doc.objectnames_s;
	var obsids = doc.obsids_s;

	addObjectArea($output2, doc.id, doc.objectnames_s, doc.objecttypes_s);
	addDataArea($output2, doc.id, doc.bibcode, 
		    doc.obsids_s, doc.exptime_f,
		    doc.obsvtime_d, doc.targets_s,
		    doc.ra_f, doc.dec_f);

	// do we need to HTML escape this text?
	// 
	var abtext = doc.abstract;
	var $abstract = $('<div class="abstracttext"><span class="pubitem">Abstract:</span> '+abtext+'</div>');
	$output2.append($abstract);
	return [$output1, $output2];

    }; // Ajax.theme.prototype.snippet

AjaxSolr.theme.prototype.tag = function (value, thecount, weight, handler, handler2) {
  
  var $thelink=$('<a href="#"/>').text(value).click(handler);
  var $thetext=$('<span/>').text('('+thecount+')');
  //var $thepivot=$('<a href="#""/>').text('P').click(handler2);
  var $span=$('<span class="tagcloud_item"/>').addClass('tagcloud_size_' + weight).append('[').append($thelink).append($thetext).append(']');
  //return [$thelink, $thetext, $thepivot]
  return $span;
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
