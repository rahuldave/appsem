(function ($) {

AjaxSolr.theme.prototype.result = function (doc, snippet, thetitlelink, thepivot, thedocthis) {
  console.log("DIC: "+doc);
/*for (ele in doc){
	console.log(';;;;'+ele+';;;;'+doc[ele]);
}*/
  var $thisdiv=$('<div></div>');
  var $h2 = $('<h2></h2>').append(doc.title+" ").append(thetitlelink).append(thepivot);
  //var output = '<div><h2>' + thetitle + '['+thepivot+']</h2>';
  //var output='';
  var $linkoutput=$('<p id="links_' + doc.id + '" class="links"></p>');
  //output += '<p>' + snippet[0] + '</p>';
  var $morea=$('<a href="#" class="less" id="am_'+doc.id+'">more</a>').click(thedocthis.moreHandler(doc));
  var $lessa=$('<a href="#" id="al_'+doc.id+'" style="display:none">less</a>').click(thedocthis.lessHandler(doc));
  var $bookmark=$('<a href="#" class="save" id="savepub_'+doc.id+'">save</a>').click(thedocthis.saveHandler(doc));
  var $unbookmark=$('<a href="#" class="delete" id="delpub_'+doc.id+'" style="display:none">delete</a>').click(thedocthis.deleteHandler(doc));
  var $data=$('<a href="#" class="save" id="data_'+doc.id+'">data</a>').click(thedocthis.dataHandler(doc));
  var $morepara=$('<p id="p_'+doc.id+'" style="display:none"></p>').append(snippet[1]);
  var $lessmore=$('<div class="lessmore"></div>').append($bookmark).append($unbookmark).append($data).append($morea).append($lessa).append($morepara);
  //return output;
  console.log("hi")
  return $thisdiv.append($h2).append($linkoutput).append(snippet[0]).append($lessmore);
}

AjaxSolr.theme.prototype.title = function (doc) {
    var $output=$('<a class="iframe"/>').text('(Link)')
		.attr('href', "http://labs.adsabs.harvard.edu/ui/abs/"+doc.bibcode)
		.fancybox({autoDimensions: false, width:1024, height:768});
    //var $output=$('<a class="colorbox-iframe"/>').text(doc.title).attr('href', "#p_"+doc.id).fancybox();
    return $output;
}

AjaxSolr.theme.prototype.pivot = function (doc, handler){
    var $pivot = $('<a href="#"/>').text(' [P]').click(handler);
    return $pivot;
}
AjaxSolr.theme.prototype.snippet = function (doc) {
  var output = '';
//  if (doc.text.length > 300) {
//    output += doc.dateline + ' ' + doc.text.substring(0, 300);

//  }
//  else {
    output += "<p><b>Authors</b>: "+doc.author.join(' ; ')+"<br/>";
    output += "<b>Year</b>: "+doc.pubyear_i + ' <b>BibCode</b>:' + doc.bibcode + ' <b>Citations</b>:' + doc.citationcount_i+"</p>";
//  }
 //output += '<div class="lessmore"> <span class="abstract" style="display:none;">' + doc.abstract;
 //output += '</span> <a href="#" class="more">more</a></div>';
 var objectnames=doc.objectnames_s;
 var obsids=doc.obsids_s;
//http://simbad.u-strasbg.fr/simbad/sim-id?Ident=NAME+CASSIOPEIA+A&NbIdent=1&Radius=2&Radius.unit=arcmin&submit=submit+id
//http://cda.harvard.edu/chaser/ocatList.do?obsid=3498,3744,4373,4374,4395
 if (objectnames==undefined){
	objectnames="None";
	var objlinks=[];
 } else {
	var objlinks=objectnames.map(function(ele)
		{
			return $('<a class="iframe" href="http://simbad.u-strasbg.fr/simbad/sim-id?Ident='+encodeURIComponent(ele)+'&NbIdent=1&Radius=2&Radius.unit=arcmin&submit=submit+id">'+ele+'</a>').fancybox({autoDimensions: false, width:1024, height:768});
		}
	);
 }
 if (obsids==undefined){
     obsids = "None";
     // var obsarray=[];
     // var obslinks=[];
     var $obsarea = $('<span>None</span>');
     // var $obsall = $('<span>None</span>');
     // var $obsall = $('');
 } else {

     // we sort so that the same missions get grouped together
     var obsarray = obsids.sort().map(function(ele) {
	 return ele.split("/"); // assume '/' does not occur as part of an obsid; not ideal
     } );
     /*
     var obslinks = obsarray.map(function(ele) {
	 if (ele[0] == "CHANDRA") {
	     return $('<a class="iframe" href="http://cda.harvard.edu/chaser/ocatList.do?obsid='+ele[1]+'">'+ele[1]+'</a>').fancybox({autoDimensions: false, width:1024, height:768});
	 } else {
	     return ele[1];
	 }
     } );
     */

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

     // var hasmast = mastmissions.length > 0;

     /***
     // somewhat hacky way to determine what the correct field name is
     var idfieldmap = { "euve": "euve_data_id", 
			// "fuse": "fes_data_set_name"  does not seem to work
			// "iue": "iue_data_id"         does not seem to work
			// I have not bothered checking the other missions
		      };
     ***/
     
     // Currently relying on the fact that only have Chandra or MAST missions,
     // and that Chandra will appear before any MAST mission
     //
     var $obsarea = $('<div class="missiondataarea"></div>');
     // var donemast = false;
     for (var mission in missionmap) {
	 var mobsids = missionmap[mission];
	 
	 var $obsbody = $('<div class="missiondata"></div>').append($('<span class="missionname">' + mission + ':</i>'));

	 // do we want a "download all obsids" link?
	 var nmany = mobsids.length > 1;
	 if (mission == "CHANDRA") {
	     if (nmany) {
		 $obsbody.append($(' <a class="iframe" href="http://cda.harvard.edu/chaser/ocatList.do?obsid='+mobsids.join(',')+'">All ('+mobsids.length+')</a>').fancybox({autoDimensions: false, width:1024, height:768}));
	     }
	 } else if (nmany || nmanymast) {
	     // Assuming MAST, adding an "all" for each MAST mission
	     //
	     // TODO: URI encode the bibcode?
	     $obsbody.append($(' <a class="iframe" href="http://archive.stsci.edu/mastbibref.php?bibcode='+doc.bibcode+'">' + allmasttext +
			       '</a>').fancybox({autoDimentions: false, width: 1024, height: 768}));
	     // donemast = true;
	 }

             /***
	     } else if (idfieldmap[mission]) {
		 // This assumes we only have Chandra or MAST; will need to be fixed.
		 //
		 // Would like the MAST search results to appear in a "fancybox"
		 // but that requires a POST, and so cross-domain issues.
		 //
		 // For now disabling this functionality as have a "all MAST" option
		 //
		 var $all = $('<a href="#">All (' + mobsids.length + ')</a>');
		 $all.click(function() { 
		     $.fancybox.showActivity();
		     var map = { "action": "Search" };
		     map[idfieldmap[mission]] = mobsids.join(',');
		     $.post('http://archive.stsci.edu/' + mission + '/search.php', map, 
			    function(data, textStatus) {
				alert("data=" + String(data));
				$.fancybox(data);
			    },
			    'html'
			   );
		     return false;
		 });
		 $obsbody.append($all);

		 var $form = $('<form action="http://archive.stsci.edu/'+mission+'/search.php" method="post"></form>');
		 $form.append($('<input type="hidden" name="'+idfieldmap[mission]+'" value="'+mobsids.join(',')+'">'));
		 $form.append($('<input type="hidden" name="action" value="Search">'));
		 $form.append($('<input type="submit" value="All ('+mobsids.length+')">'));
		 $obsbody.append($form);
	     }
             ***/

	 $obsbody.append($('<br/>'));

	 // ad-hoc collection of MAST missions for which the data link is known to
	 // not work (we exclude rather than include to allow testing/easy addition of
	 // new missions).
	 var mastmissionmap = { };

	 // now the individual obsids; this should be made more modular
	 if (mission === "CHANDRA") {
	     for (var idx in mobsids) {
		 $obsbody.append($('<a class="iframe" href="http://cda.harvard.edu/chaser/ocatList.do?obsid='+mobsids[idx]+'">'+mobsids[idx]+'</a> ').fancybox({autoDimensions: false, width:1024, height:768}));
	     }
	 } else {
	     // Assuming MAST, which will eventually be wrong
	     // and all this mission-specific knowledge is not ideal
	     
	     if (mission in mastmissionmap) {
		 for (var idx in mobsids) {
		     $obsbody.append('<span class="obsid">' + mobsids[idx] + '</span> ');
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

		     $obsbody.append($('<a class="iframe" href="http://archive.stsci.edu/cgi-bin/mastpreview?mission='+mission+'&dataid='+obsidlnk+'">'+mobsids[idx]+'</a> ').fancybox({autoDimensions: false, width:1024, height:768}));
		 }
	     }
	 }
		 
	 $obsarea.append($obsbody);
     }
	     
 }
 //console.log("output="+output);
 //var output2='<p><b>Objects</b>: '+objectnames+'<br/><b>Datasets</b>: '+obsids+" "+obsall+'<br/><b>Abstract</b>: '+doc.abstract+"</p>";
var $jqlist=$('<p><b>Datasets</b>: </p>');
    $jqlist = $jqlist.append($obsarea);
/*
for (var ele in obslinks){
    $jqlist = $jqlist.append(obslinks[ele]);
}
*/
// TODO: perhaps do not display an objects section if there are no objects associated with the paper?
var $jqlist3 = $('<div class="objectdataarea"></div>');
for (var ele in objlinks){
	$jqlist3.append(objlinks[ele]);
} 
var $jqlist2=$('<p><b>Objects</b>: </p>');
    if (objlinks.length == 0) {
	$jqlist2.append($("<span>None</span>"));
    } else {
	$jqlist2.append($jqlist3);
    }

    // do we need to HTML escape this text?
    // Escaping based on ajax-solr's escapeOnce(); does not work
    var abtext = doc.abstract;
    // abtext += '';
    // abtext.replace(/"/g, '"').replace(/>/g, '>').replace(/</g, '<').replace(/&(?!([a-zA-Z]+|#\d+);)/g, '&');

//alert("Abstract:"+doc.abstract);
// var $output2=$('<p></p>').append($jqlist2).append($('<br/>')).append($jqlist).append($obsall).append($('<p><br/><b>Abstract</b>: '+doc.abstract+'</p>'));
    var $output2=$('<p></p>').append($jqlist2).append($('<br/>')).append($jqlist).append($('<p><br/><b>Abstract</b>: '+abtext+'</p>'));
return [$(output), $output2];
};

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
