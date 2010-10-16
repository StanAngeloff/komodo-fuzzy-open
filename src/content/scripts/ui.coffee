this.extensions           = {} unless extensions?
this.extensions.fuzzyopen = {} unless extensions.fuzzyopen?

$element = (id) -> document.getElementById id
$on      = (element, event, block) -> element.addEventListener event, block, false
$sleep   = (interval, resume) -> setTimeout resume, interval


this.extensions.fuzzyopen.ui = class UI

  @top: null

  constructor: (queryId, resultsId, hideList) ->
    return new UI arguments... if this not instanceof UI
    @queryElement   = $element queryId
    @resultsElement = $element resultsId
    @hideElements   = $element id for id in hideList if hideList
    @path           = null
    @fuzzyOpen      = extensions.fuzzyopen.FuzzyOpen()
    UI.top          = this unless UI.top
    @addEvents()

  addEvents: ->
    $on @queryElement, 'command', =>
      value = @queryElement.value.trim()
      if value.length
        @open value
      else
        @hide()
    $on @fuzzyOpen, 'loading', =>
      # pass

  update: (places) ->
    @queryElement.value = ''
    @hide()
    @path = places.manager.currentPlace
    if @path and places.manager.currentPlaceIsLocal
      @queryElement.removeAttribute 'disabled'
    else
      @queryElement.setAttribute 'disabled', 'true'

  open: (value) ->
    @fuzzyOpen.find value, @path

  hide: ->
    # pass

  @toggleLeftPane: (event) ->
    ko.commands.doCommandAsync command = 'cmd_viewLeftPane', event
    $sleep 125, =>
      element = $element command
      return unless element
      box     = $element element.getAttribute 'box'
      return unless box
      if box.getAttribute('collapsed') is 'true'
        UI.top.hide()
      else
        if UI.top.queryElement.value.length
          UI.top.queryElement.value = ''
          UI.top.hide()
        UI.top.queryElement.focus()
