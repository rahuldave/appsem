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
//         (x) Keywords: astronomy uv [P]
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

	pivotHandler: function (constraint) {
	    var self = this;
	    return function () {
		self.manager.store.remove('fq');
		self.add(constraint);
		self.manager.doRequest(0);
		return false;
	    };
	},

	afterRequest: function () {
	    var self = this;
	    var fq = this.manager.store.values('fq');
	    var nfq = fq.length;

	    /*
	     * Since we only want the last constraint for those
	     * facets not in this.allowmulti we loop over the
	     * items backwards.
	     */
	    var list = [];
	    var seen = [];
	    for (var i = nfq - 1; i >= 0; i--) {
		var c = this.splitConstraint(fq[i]);

		var $link = $('<a href="#"/>')
		    .text('(x) ' + c.display + ': ' + c.label)
		    .click(self.removeFacet(c.constraint));
		var $pivot = AjaxSolr.theme('pivot_link',
					    this.pivotHandler(c.constraint));
		var $span = $('<span/>')
		    .append($link)
		    .append($pivot);

		if (this.allowmulti.indexOf(c.field) == -1) {
		    if (seen.indexOf(c.field) == -1) {
			seen.push(c.field);
			list.push($span);
		    } else {
			if (self.remove(c.field)) {
			    // if (self.manager.store.removeByValue('fq', c.constraint)) {
			    // TODO: optimize and only do after processing all elements
			    // or is this pointless given the behavior of the store?
			    self.manager.doRequest(0);
			}            
		    }
		} else {
		    list.push($span);
		}
	    }

	    if (list.length > 1) {
		list.push($('<a href="#"/>').text('remove all').click(function () {
		    self.manager.store.remove('fq');
		    self.manager.doRequest(0);
		    return false;
		}));
	    }
	    
	    if (list.length) {
		list.reverse();
		AjaxSolr.theme('list_items', this.target, list);
	    } else {
		$(this.target).html('<div>Viewing all documents!</div>');
	    }
	},
	
	// This is similar to AbstractFacetWidget.unclickHandler
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
