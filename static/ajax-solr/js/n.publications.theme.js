/*
 * Theme for publications page
 */
(function ($) {

    var fancyboxOpts = { 'autoDimensions': false, 'width': 1024, 'height': 768 };
    
    AjaxSolr.theme.prototype.loader = function(){
        return $('<img/>').attr('src', SITEPREFIX+'/static/images/ajax-loader.gif');
    };
    //HANDLER
    AjaxSolr.theme.prototype.result = function (doc, $thetitlestuff, $keywordstuff, $additional, $lessmore, thedocthis) {
	    var $morea = $('<a href="#" class="morelink label" id="am_'+doc.id+'">more</a>');
	        //.click(thedocthis.moreHandler(doc));
	    var $lessa = $('<a href="#" class="lesslink label" id="al_'+doc.id+'" style="display:none">less</a>');
	        //.click(thedocthis.lessHandler(doc));
	    var $bookmark = $('<a href="#" class="savelink" id="savepub_'+doc.id+'">save</a>');
	        //.click(thedocthis.saveHandler(doc));
	    var $unbookmark = $('<a href="#" class="deletelink" id="delpub_'+doc.id+'" style="display:none">delete</a>');
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
		                .attr('id', 'p_' + doc.id)
		            );
    }
    var doADSProxy2 = function(urlpath, datastring, callback) {
      console.log(urlpath, datastring);    
      return $.post("" + SITEPREFIX + "/adsproxy2", JSON.stringify({
        urlpath: urlpath,
        method: 'POST',
        data: {bibcode: datastring, data_type: 'HTML'}
      }), callback);
    };
    AjaxSolr.theme.prototype.title = function (doc) {
        var $titlelink=$('<a class="iframe" href="#"/>').text('(Link)')
            .attr('href', "http://labs.adsabs.harvard.edu/ui/abs/"+doc.bibcode)
            .fancybox(fancyboxOpts);
        var $titlepivot=AjaxSolr.theme.prototype.pivot('bibcode');
        var poststring=doc.bibcode;
        var atpthandler = function(){
            console.log("before in atpt", dastaticprefix+'/hiddenform.html', $('#tempform').html());
            var hiddenformdiv="<div id=\"tempform\" style=\"display:none\"><form method=\"post\" action=\"http://adsabs.harvard.edu/tools/metrics\">\
              <input type=\"hidden\" name=\"bibcode\" value=\""+poststring+"\">\
              <input type=\"hidden\" name=\"service\" value=\"yes\">\
              <input type=\"submit\" name=\"submit\" id=\"tempformsubmit\" value=\"submit\"/></form></div>";
            console.log('in atpt', hiddenformdiv);
            $('body').append(hiddenformdiv);
            $.fancybox({type: 'iframe',href:dastaticprefix+'/hiddenform.html',autoDimensions: false,width: 1024,height: 768,scrolling: 'yes'})
            return false;
        };
        return $('<h5/>').append(doc.title + " ")
                         .append($titlelink)
                         .append($titlepivot)
                         .append($('<a class="label"/>').text("Metrics").unbind('click').bind('click', atpthandler));
    }


    AjaxSolr.theme.prototype.titlelink = function (doc) {
        return $('<a class="iframe"/>').text('(Link)')
            .attr('href', "http://labs.adsabs.harvard.edu/ui/abs/"+doc.bibcode)
            .fancybox(fancyboxOpts);
    }

    // for now have pivot that requires a doc argument (unused) and
    // pivot_link that doesn't.
    //
    AjaxSolr.theme.prototype.pivot = function (pivotclass){
        return $('<a facet_field="'+pivotclass+'" class="label pivotlink '+pivotclass+'" href="#"/>').text('P');
    }
    //HANDLER
    AjaxSolr.theme.prototype.pivot_link = function (handler) {
        return $('<a class="label pivotlink" href="#"/>').text('P').click(handler);
    }
    //HANDLER
    //if value has quotes or single quotes, escape it BUG not done yet just do it.
    //AjaxSolr.theme.prototype.facet_link = function (value, pivotclass, handler) { .click(handler)
    AjaxSolr.theme.prototype.facet_link = function (value, pivotclass, valuestring) {
        if (valuestring===undefined){
            valuestring=value;
        }
        return $('<a facet_field="'+pivotclass+'" facet_value="'+valuestring+'" class="facetlink '+pivotclass+'" href="#"/>').text(value);
    };
    AjaxSolr.theme.prototype.facet_link2 = function (value, pivotclass, valuestring) {
        if (valuestring===undefined){
            valuestring=value;
        }
        return $('<a facet_field="'+pivotclass+'" facet_value="'+valuestring+'" class="label facetlink '+pivotclass+'" href="#"/>').text(value);
    };
    AjaxSolr.theme.prototype.authors = function(){
        return $('<span class="authors"/>');
    };
    AjaxSolr.theme.prototype.keywords = function(){
        return $('<p class="links"/>');
    };
    AjaxSolr.theme.prototype.additional = function(doc, authors, year){
	    var $output1 = $('<p class="links"/>')
	        .append(pubLabel('Authors:'))
	        // .append(' ' + doc.author.join(' ; '))
	        .append(' ')
	        .append(authors)
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
	        return $output1;
	};
    AjaxSolr.theme.prototype.lessmore = function (doc, objcollectionview_el, obsvcollectionview_el) {


	    var $output2 = $('<div/>');

	    var objectnames = doc.objectnames_s;
	    var obsids = doc.obsids_s;
	    var abtext = doc.abstract;
	    var $abstract = $('<div class="abstracttext"><span class="pubitem">Abstract:</span> '+abtext+'</div>');
	    $output2.append($abstract);
	    //addObjectArea($output2, doc.id, doc.objectnames_s, doc.objecttypes_s);
	    //$output2.append(AjaxSolr.theme.prototype.objectarea(doc.id, doc.objectnames_s, doc.objecttypes_s));
	    $output2.append(objcollectionview_el);
	    /*
	    $output2.append(AjaxSolr.theme.prototype.dataarea(doc.id, doc.bibcode, 
		        doc.obsids_s, doc.exptime_f,
		        doc.obsvtime_d, doc.targets_s,
		        doc.ra_f, doc.dec_f));
		*/
		$output2.append(obsvcollectionview_el);
	    /*addDataArea($output2, doc.id, doc.bibcode, 
		        doc.obsids_s, doc.exptime_f,
		        doc.obsvtime_d, doc.targets_s,
		        doc.ra_f, doc.dec_f);*/

	    // do we need to HTML escape this text?
	    // 

	    return $output2;

    }; // Ajax.theme.prototype.snippet
    //HANDLER: need this as not in resultwidget system
    AjaxSolr.theme.prototype.tag = function (value, thecount, weight, handler) {
      
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

    AjaxSolr.theme.prototype.list_items = function ($list,items, separator) {
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
      return $list;
      //console.log("C"+$list);
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


    // Need mission specific info to determine what to link to here
    //


    function pubLabel(label) {
        return $('<span class="pubitem"/>').text(label);
    }

   
    
    AjaxSolr.theme.prototype.objectarea = function (docid, objnames, objtypes){
        var $objectarea=$('<div class="objectdataarea"/>')
			      .append(pubLabel("Objects:"))
			      .append(' ');
        if (objnames === undefined) { 
            return $objectarea.append("None").append($('<br/>')); 
             
        }

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
	        //.attr("class", "zebra-striped")
	        .append($('<thead/>')
		        .append('<tr><th>Name</th><th>Type</th></tr>'));

	    var $obody = $('<tbody/>');
	    for (i = 0, l = objinfo.length; i < l; i += 1) {
	        var oname = objinfo[i].name;
	        var otype = objinfo[i].objtype;
	        $obody.append($('<tr/>')
			      .append($('<td/>')
				      .append(AjaxSolr.theme.prototype.simbad_link(oname))
				      .append(AjaxSolr.theme.prototype.facet_link2('P', 'objectnames_s', oname))
				  )
			      .append($('<td/>')
				      .text(otype)
				      .append(AjaxSolr.theme.prototype.facet_link2('P', 'objecttypes_s', otype))
				  )
			);
	    } 

	    $otable.append($obody);

	    // as with the data area, this should only be needed when the table
	    // is actually viewed.
	    //$otable.tablesorter();
	    return $objectarea.append($otable).append($('<br/>'));
    }
    //HANDLER: do later
    
    
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
	    //$otable.tablesorter();

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
				      .append(AjaxSolr.theme.prototype.facet_link2('P', 'objectnames_s', oname))
				  )
			      .append($('<td/>')
				      .html(otype+"&nbsp;")
				      .append(AjaxSolr.theme.prototype.facet_link2('P', 'objecttypes_s', otype))
				  )
		return $obody;
      };
    
    
    
    
    
    // sort on exposure length, but we want largest first
    function compareObs(a, b) {
	    // return a.obsid.localeCompare(b.obsid);
	    var va = a.exptime, vb = b.exptime;
	    if (va > vb)      { return -1; }
	    else if (va < vb) { return 1; }
	    else              { return 0; }
    } 

    AjaxSolr.theme.prototype.datapreamble=function(nobsv){
        //alert(nobsv);
        var $start=$('<div class="insidemissionarea"/>').append(pubLabel('Datasets')).append('<p class="extrapara"/>').append(' ');
        if (nobsv===0){
            $start.append('None');
            return $start.append($('<br/>'));
        }
        var colnames = ["Mission", "Observation", "Exposure time (s)",
			    "Observation date", "Target name", "RA", "Dec"];
	    var $mtable = $('<table class="tablesorter"/>')
	        .append($('<thead/>')
		        .append($('<tr/>')
			        .append(colnames.map(function (c) { return "<th>" + c + "</th>"; }).join('')))
		       );

	    var $mbody = $('<tbody class="datatbody"/>');
	    $mtable.append($mbody);
	    //$mtable.tablesorter();

	    //$dataarea.append($('<div class="missiondata"/>').append($mtable));
	    $start.append($mtable);
	    return $start.append($('<br/>'));
    };
    
    function objToString (obj) {
        var str = '';
        for (var p in obj) {
            if (obj.hasOwnProperty(p)) {
                str += p + '::' + obj[p] + '\n';
            }
        }
        return str;
    }   
    
    AjaxSolr.theme.prototype.dataline=function(doc){
        // hacky; curently used to create the target-name pivot
        var parent;
        var $mbody=$("<tr/>");
        if (doc.mission == 'CHANDRA') {
	        parent = 'CHANDRA';
        } else {
	        parent = 'MAST';
        }
        $mbody.append($('<td/>').text(doc.mission.toUpperCase()))
		    .append($('<td/>')
			          .append(AjaxSolr.theme.prototype.mission_link(doc.mission, doc.obsids_s))
			          .append(AjaxSolr.theme.prototype.facet_link2('P', 'obsids_s', doc.mission + '/' + doc.obsids_s))
			          .append($('<a class="label" href="'+SITEPREFIX+'/explorer/observations#fq=obsids_s%3A'+doc.mission+'%2F'+doc.obsids_s+'&q=*%3A*"/>').text('View'))
			)
		    .append($('<td/>').text(doc.exptime_f))
		    .append($('<td/>').text(doc.obsvtime_d))
		    .append($('<td/>')
			          .html(doc.targets_s+"&nbsp;")
			          .append(AjaxSolr.theme.prototype.facet_link2('P', 'targets_s',parent + '/' + doc.targets_s))
			)
		    .append($('<td/>').text(doc.ra_f)) // may want to try <span value=decimal>text value</span> trick?
		    .append($('<td/>').text(doc.dec_f));
        return $mbody;
    };
    
    
/*
    AjaxSolr.theme.prototype.dataarea = function(docid, bibcode, obsids, exptimes, expdates, targets, ras, decs){
        var $dataarea = $('<div class="missiondataarea"/>')
	    .append(pubLabel('Datasets:'))
	    .append(' ');
	    if (obsids === undefined) { return $dataarea.append('None').append($('<br/>')); }
	    
	    
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
		    $dataarea.append(AjaxSolr.theme.prototype.mission_link('', 'All CHANDRA (' + nm + ')',
		        getChandraObsidlink('',mobsids.join(',')))
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
		        AjaxSolr.theme.prototype.mission_link('', label, getMASTBibrefLink(bibcode))
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
				          .append(AjaxSolr.theme.prototype.mission_link(mission, obsid))
				          .append(AjaxSolr.theme.prototype.facet_link('[P]', 'obsids_s', mission + '/' + obsid))
				         )
			          .append($('<td/>').text(mvalues[idx].exptime))
			          .append($('<td/>').text(mvalues[idx].obsdate))
			          .append($('<td/>')
				          .text(mvalues[idx].target)
				          .append(AjaxSolr.theme.prototype.facet_link('[P]', 'targets_s',parent + '/' + mvalues[idx].target))
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
	    return $dataarea.append($('<br/>'));
    }
    // Create the data area for this publication. Some code could probably be
    // cleaned up by processing based on the name of the "mission parent" - e.g.
    // we encode target names as 'MAST/foo' and 'CHANDRA/bar' and so we could
    // use 'MAST' to possibly simplify some logic below
    // HANDLER: do later

*/


})(jQuery);
