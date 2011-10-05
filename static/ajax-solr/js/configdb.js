//Config related Javascript Stuff
//Later define these in configdb rather than global namespace
    function getSimbadURI(ele) {
        return 'http://simbad.u-strasbg.fr/simbad/sim-id?Ident='
            + encodeURIComponent(ele)
            + '&NbIdent=1&Radius=2&Radius.unit=arcmin&submit=submit+id';
    }


    // Need mission specific info to determine what to link to here
    //
    function getChandraObsidlink (label, link) {
	    if (link === undefined) {
	        link = label;
	    }

	    return 'http://cda.harvard.edu/chaser/ocatList.do?obsid='+link;
    }

    function getMASTObsidlink (mission, label, link) {
	    if (link === undefined) {
	        link = label;
	    }

	    return 'http://archive.stsci.edu/cgi-bin/mastpreview?mission='+mission+'&dataid='+link;
    }
    function getMASTBibrefLink(bibcode){
        return 'http://archive.stsci.edu/mastbibref.php?bibcode='+encodeURIComponent(bibcode);
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
    
    
    
