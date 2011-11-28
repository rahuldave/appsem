# Display a list of the current facet constraints in a
# vaguely human-readable form.
#
#  If no constraints then display
#     "Viewing all documents!"
#  otherwise
#     - provide a way to remove all constraints if there are
#       multiple constraints
#     - a list of facets as applied by the user, separated
#       out so that instead of
#         (x) keywords_s:"astronomuy uv" [P]
#       we have
#         (x) Keywords: astronomy uv [P]

$ = jQuery

AjaxSolr.CurrentSearchWidget = AjaxSolr.AbstractWidget.extend

  # A mapping from the field names for each facet (as used by Solr)
  # and the display version. If there is no entry then the facet field
  # name is used.
  #
  # @public
  # @field
  # @type Object (map from facet field names to human-readable values)

  fieldmap: {}

  # Those facets that can appear multiple times. If a facet constraint
  # does not appear in this list then only the last version is used
  # and the others are removed from the store.
  #
  # Would this be better handled by the ParameterHashStore?
  #
  # @public
  # @field
  # @type Array of Strings

  allowmulti: []

  # Given a constraint from the store return the components.

  splitConstraint: (constraint) ->
    # Note: no error checking
    i = constraint.indexOf ':'
    field = constraint.substr 0, i
    label = cleanFacetValue constraint.substr(i+1)

    constraint: constraint
    field: field
    display: cleanFacetName(field, this.fieldmap)
    label: label

  pivotHandler: (constraint) ->
    self = this
    () ->
      self.manager.store.remove 'fq'
      self.manager.store.addByValue 'fq', constraint
      self.manager.doRequest 0
      return false

  afterRequest: () ->
    self = this
    fq = self.manager.store.values 'fq'

    # Since we only want the last constraint for those
    # facets not in this.allowmulti we loop over the
    # items backwards. This means that we don't quite get
    # the ordering of multiple facets correct, but I
    # think that is acceptable.
    order = []
    store = {}

    for c in (self.splitConstraint(cstr) for cstr in fq)
      $span = $('<span class="facetvalue"/>')
      $link = $('<a href="#"/>')
        .text("(x) #{c.label}")
        .click(self.removeFacet c.constraint)
      $pivot = AjaxSolr.theme 'pivot_link',
        self.pivotHandler(c.constraint)
      $span.append($link).append($pivot)

      if c.display not in order
        order.push c.display
        store[c.display] = []

      if c.field in self.allowmulti or store[c.display].length is 0
        store[c.display].push $span
      else
        if self.remove c.field
          self.manager.doRequest 0

    list = []
    for field in order
      $span = $('<div class="facetconstraints"/>')
        .append($('<span class="facetname"/>').text("#{field} "))

      for i in [store[field].length-1 .. 0]
        $span.append store[field][i]
        if i > 0
          $span.append '; '

      list.push $span

    if list.length is 0
      $(self.target).html '<div>Viewing all documents!</div>'
    else
      if list.length > 1
        list.push $('<a href="#"/>').text('remove all').click(() ->
          self.manager.store.remove 'fq'
          self.manager.doRequest 0
          return false)

      AjaxSolr.theme 'list_items', self.target, list

    return true

  # This is similar to AbstractFacetWidget.unclickHandler

  removeFacet: (facet) ->
    self = this
    () ->
      if self.manager.store.removeByValue 'fq', facet
        self.manager.doRequest 0
      return false

