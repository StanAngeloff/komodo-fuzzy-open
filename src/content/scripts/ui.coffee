this.extensions           = {} unless extensions?
this.extensions.fuzzyopen = {} unless extensions.fuzzyopen?

`const Cc = Components.classes`
`const Ci = Components.interfaces`

`const HTML_NS = 'http://www.w3.org/1999/xhtml'`

$element = (id) -> document.getElementById id
$on      = (element, event, block) -> element.addEventListener event, block, false
$sleep   = (interval, resume) -> setTimeout resume, interval
$new     = (tagName, attrs) ->
  element = document.createElementNS(HTML_NS, tagName)
  (element[key] = value) for key, value of attrs if attrs
  element

strings = Cc['@mozilla.org/intl/stringbundle;1'].getService(Ci.nsIStringBundleService).createBundle 'chrome://fuzzyopen/locale/fuzzyopen.properties'


this.extensions.fuzzyopen.ui = class UI

  @top: null

  constructor: (queryId, resultsId, hideList) ->
    return new UI arguments... if this not instanceof UI
    @queryElement   = $element queryId
    @resultsElement = $element resultsId
    @hideElements   = if hideList then $element id for id in hideList else []
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
      @empty()
      loading = $new 'div', className: 'loading'
      loading.innerHTML = "<p><span>#{ strings.GetStringFromName 'loading' }</span></p>"
      @resultsElement.appendChild loading
    $on @fuzzyOpen, 'working', =>
      @isWorking yes
      @empty()

  update: (places) ->
    @hide()
    @path = places.manager.currentPlace
    if @path and places.manager.currentPlaceIsLocal
      @queryElement.removeAttribute 'disabled'
    else
      @queryElement.setAttribute 'disabled', 'true'

  open: (value) ->
    @toggle yes
    @fuzzyOpen.find value, @path, (error, result) =>
      @isWorking no
      return @displayError error if error

  hide: ->
    @fuzzyOpen.stop()
    @queryElement.value = ''
    @toggle no
    @isWorking no
    @empty()

  toggle: (visible) ->
    @resultsElement.setAttribute 'collapsed', not visible
    element.setAttribute 'collapsed', visible for element in @hideElements

  isWorking: (flag) ->
    return unless button = $element 'placesRootButton'
    if flag
      button.className = "#{ button.className or '' } fuzzyopen-working"
    else
      button.className = (button.className or '').replace /\s*fuzzyopen-working/, ''

  empty: ->
    @resultsElement.removeChild first while first = @resultsElement.childNodes[0]

  displayError: (error) ->
    @empty()
    message = $new 'div', className: 'exception'
    message.innerHTML = "<h2><span>#{ strings.GetStringFromName 'uncaughtError' }</span></h2><pre><code></code></pre>"
    message.getElementsByTagName('code')[0].appendChild document.createTextNode error.message
    @resultsElement.appendChild message

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
          UI.top.hide()
        UI.top.queryElement.focus()
