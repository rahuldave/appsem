(function ($) {

    AjaxSolr.TagcloudWidget = AjaxSolr.AbstractFacetWidget.extend({
	
	/**
	 * Pivot on this selection. Currently unused.
	 */
	justthisfacetHandler: function (value) {
	    var self = this;
	    return function () {
		self.manager.store.remove('fq');
		self.add(value);
		self.manager.doRequest(0);
		return false;
	    };
	},

	afterRequest: function () {
	    var maxCount = 0;
	    var objectedItems = [];
	    for (var facet in this.manager.response.facet_counts.facet_fields[this.field]) {
		var count = parseInt(this.manager.response.facet_counts.facet_fields[this.field][facet]);
		if (count > maxCount) {
		    maxCount = count;
		}
		objectedItems.push({ facet: facet, count: count });
	    }

	    if (objectedItems.length == 0) {
		$(this.target).html(AjaxSolr.theme('no_items_found'));
		return;
	    }

	    // alphabetic sort; could allow sort on count and reverse options,
	    // ideally without re-querying Solr
	    objectedItems.sort(function (a, b) {
		return a.facet < b.facet ? -1 : 1;
	    });
	    
	    $(this.target).empty();
	    for (var i = 0, l = objectedItems.length; i < l; i++) {
		var facet = objectedItems[i].facet;
		var count = objectedItems[i].count;
		var $tagthemelist = AjaxSolr.theme('tag', facet, count, parseInt(count / maxCount * 10),
						   this.clickHandler(facet),
						   this.justthisfacetHandler(facet));
		$(this.target).append($tagthemelist);
	    }
	}
    });
    
})(jQuery);
