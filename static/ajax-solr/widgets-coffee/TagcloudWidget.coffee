# Tag cloud widget

AjaxSolr.TagcloudWidget = AjaxSolr.AbstractFacetWidget.extend

  # Pivot on this selection

  justfacetHandler: (value) ->
    self = this
    () ->
      self.manager.store.remove 'fq'
      self.add value
      self.manager.doRequest 0
      return false

  afterRequest: () ->
    maxCount = 0
    objectedItems = []
    for facet, value of this.manager.response.facet_counts.facet_fields[this.field]
      count = parseInt value
      if count > maxCount
        maxCount = count
      objectedItems.push facet: facet, count: count

    if objectedItems.length is 0
      $(this.target).html AjaxSolr.theme('no_items_found')
      return

    # Alphabetic sort; could allow sort on count and reverse options,
    # ideally without re-querying Solr

    objectedItems.sort (a,b) -> if a.facet < b.facet then -1 else 1

    $(this.target).empty()
    for { facet, count } in objectedItems
      $tag = AjaxSolr.theme 'tag', facet, count,
        parseInt(count / maxCount * 10),
        this.clickHandler(facet),
        this.justfacetHandler(facet)

      $(this.target).append $tag

    return true
