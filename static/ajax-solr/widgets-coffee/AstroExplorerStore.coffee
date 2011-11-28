# Extends the ParameterHashStore class to:
#
#   a - allow stats.field to contain multiple parameters when querying
#       Solr
#
#   b - work around an issue whereby using a facet constraint which has
#       a comma in it - e.g. an Author name - will cause problems when
#       the page is reloaded.

$ = jQuery

AjaxSolr.AstroExplorerStore = AjaxSolr.ParameterHashStore.extend

  # Add 'stats.field' to the list of parameters that can contain
  # multiple values.

	isMultiple: (name) ->
    name.match(/^(?:bf|bq|facet\.date|facet\.date\.other|facet\.date\.include|facet\.field|facet\.pivot|facet\.range|facet\.range\.other|facet\.range\.include|facet\.query|fq|group\.field|group\.func|group\.query|stats\.field|pf|qf)$/)

  # Overriding the default behavior to try and fix the issue
	# with constraints of author names - which contain commas - being
	# broken up when reloaded and so not parsed correctly.
	# This may be a sledgehammer aimed at the wrong nut.

  parseString: (str) ->
    for pair in str.split '&'
      if pair
        param = new AjaxSolr.Parameter()
        param.parseString pair
        if AjaxSolr.isArray param.value
          param.value = param.value.join ','
        this.add param.name, param

    return true
