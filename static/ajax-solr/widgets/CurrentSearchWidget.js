// Display a list of the current facet constraints in a
// vaguely human-readable form.
//
//  If no constraints then display
//     "Viewing all documents!"
//  otherwise
//     - provide a way to remove all constraints if there are
//       multiple constraints
//     - a list of facets as applied by the user, separated
//       out so that instead of
//         (x) keywords_s:"astronomuy uv" [P]
//       we have
//         (x) keywords: "astronomy uv" [P]
//

(function ($) {

    AjaxSolr.CurrentSearchWidget = AjaxSolr.AbstractWidget.extend({

	/**
	 * A mapping from the field names for each facet (as used by Solr)
	 * and the display version. If there is no entry then the facet field
	 * name is used.
	 *
	 * @public
	 * @field
	 * @type Object (map from facet field names to human-readable values)
	 */
	fieldmap: {},

	/**
	 * Those facets that can appear multiple times. If a facet constraint
	 * does not appear in this list then only the last version is used
	 * and the others are removed from the store.
	 * 
	 * Would this be better handled by the ParameterHashStore?
	 * 
	 * @public
	 * @field
	 * @type Array of Strings
	 */
	allowmulti: [],

	// Given a constraint from the store return the components.
	//
	// Note: there is a bug in the system where if you reload a page with an author
	// facet (maybe others) then constraint is actually an object rather than a string?
	//
	splitConstraint: function (constraint) {
	    var i = constraint.indexOf(':'); // assume always succeeds
	    var field = constraint.substr(0, i);
	    var label = constraint.substr(i+1);

	    var l = label.length;
	    var firstChar = label[0];
	    var lastChar = label[l-1];

	    if (firstChar == '"' && lastChar == '"') {
		label = label.substr(1, l-2);
	    } else if (firstChar == '[' && lastChar == ']') {
		var idx = label.indexOf(' TO ');
		if (idx !== -1) {
		    label = label.substr(1, l-2);
		}
	    }

	    return { constraint: constraint,
		     field: field,
		     display: this.fieldmap[field] || field,
		     label: label
		   };
	},

	justthisfacetHandler: function (constraint) {
	    var self = this;
	    return function () {
		self.manager.store.remove('fq');
		self.manager.store.addByValue('fq', constraint);
		self.manager.doRequest(0);
		return false;
	    };
	},

	afterRequest: function () {
	    var self = this;
	    var fq = this.manager.store.values('fq');
	    var nfq = fq.length;

	    // if we looped through the array backwards then would not need
	    // to have the two loops, I think.
	    //
	    var current = []; // may not be needed
	    var oldfqs = {};
	    var likefq = [];
	    for (var i = 0; i < nfq; i += 1) {
		var c = this.splitConstraint(fq[i]);
		current.push(c);

		var $link = $('<a href="#"/>')
		    .text('(x) ' + c.display + ': ' + c.label)
		    .click(self.removeFacet(c.constraint));
		var $pivot = AjaxSolr.theme('pivot', null,
					    this.justthisfacetHandler(c.constraint));
		var $span = $('<span/>')
		    .append($link)
		    .append($pivot);

		if (this.allowmulti.indexOf(c.field) == -1) {
		    oldfqs[c.field] = [i, $span];
		    likefq.push('UNDONE');  
		} else {
		    likefq.push($span);
		}
	    }

	    var links = [];
	    for (var i = 0; i < nfq; i += 1) {

		if (likefq[i] == 'UNDONE') {
		    var sfq = current[i].field;
		    if (oldfqs[sfq][0] == i) {
			links.push(oldfqs[sfq][1]);
		    } else {
			if (self.manager.store.removeByValue('fq', fq[i])) {
			    self.manager.doRequest(0);
			}            
		    }
		} else {
		    links.push(likefq[i]);       
		}
	    }

	    /***
	    var oldfqs={};
	    var likefq=[];
	    for (var i = 0, l = fq.length; i < l; i++) {
		var $link=$('<a href="#"/>').text('(x) ' + fq[i]).click(self.removeFacet(fq[i]));
		var $span=$('<span></span>');
		var splitfq=fq[i].split(':');
		var doc=null;
		var $pivot=AjaxSolr.theme('pivot', doc, this.justthisfacetHandler(splitfq[0], splitfq[1]));

		if (this.ffields.indexOf(splitfq[0])!=-1){
		    likefq.push($span.append($link).append($pivot));
		}
		else {
		    oldfqs[splitfq[0]]=[i,$span.append($link).append($pivot)];
		    likefq.push('UNDONE');  
		}
	    }

	    for (var i = 0, l = fq.length; i < l; i++) {
		var sfq=fq[i].split(':')[0];
		if (likefq[i]=='UNDONE'){
		    if (oldfqs[sfq][0]==i){
			links.push(oldfqs[sfq][1]);
		    }
		    else {
			if (self.manager.store.removeByValue('fq', fq[i])) {
			    self.manager.doRequest(0);
			}            
		    }
		}
		else {
		    links.push(likefq[i]);       
		}
	    }
	    
	    ***/

	    if (links.length > 1) {
		links.unshift($('<a href="#"/>').text('remove all').click(function () {
		    self.manager.store.remove('fq');
		    self.manager.doRequest(0);
		    return false;
		}));
	    }
	    
	    if (links.length) {
		AjaxSolr.theme('list_items', this.target, links);
	    } else {
		$(this.target).html('<div>Viewing all documents!</div>');
	    }
	},
	
	removeFacet: function (facet) {
	    var self = this;
	    return function () {
		if (self.manager.store.removeByValue('fq', facet)) {
		    self.manager.doRequest(0);
		}
		return false;
	    };
	}
    });
    
})(jQuery);
