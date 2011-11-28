# Date range picker without a date picker but using sliders

# Note: using date.js

$ = jQuery

zeroDate = new Date 1977, 0, 1

AjaxSolr.DateRangerWidget = AjaxSolr.DualSliderWidget.extend
  # The start date to use for the widget.
  # For internal use only.
  #
  # @field
  # @private
  # @type Date
  zeroDate: null

  # The start of the slider, as a year.
  #
  # @field
  # @public
  # @type Integer
  startYear: null

  # Sets up the datamin and datamax fields of the widget.
  # This over-rides any user-supplied values.
  init: () ->
    dy = 0
    zeroDate = new Date this.startYear, 0, 1
    year0 = zeroDate.getUTCFullYear()
    yearMax = Date.today().getUTCFullYear() + 1

    # Can we use TimeSpan for this?
    y = year0
    while y < yearMax
      for m in [0...12]
        dy += Date.getDaysInMonth y, m

      y++

    @datamin = 0
    @datamax = dy
    @zeroDate = zeroDate
    return true

  dayToDate: (theday) -> @zeroDate.clone().addDays theday

  fromFacet: (value) ->
    date = new Date value
    new TimeSpan(date - @zeroDate).getDays()

  toFacet: (value) -> @dayToDate(value).toISOString()

  toDisplay: (value) -> @dayToDate(value).toString("d-MMM-yyyy")

