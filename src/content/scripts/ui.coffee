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

  @top:     null
  @maximum: 100

  constructor: (queryId, resultsId, workingId, hideList) ->
    return new UI arguments... if this not instanceof UI
    @queryElement   = $element queryId
    @resultsElement = $element resultsId
    @workingElement = $element workingId
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
    @isWorking no
    @fuzzyOpen.stop()
    @fuzzyOpen.find value, @path, (error, result) =>
      @isWorking no
      @empty()
      return @displayError error if error
      @displayResult result.slice 0, UI.maximum

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
    className = 'fuzzyopen-working'
    if flag
      @workingElement.className = "#{ @workingElement.className or '' } #{className}".trimLeft()
    else
      @workingElement.className = (@workingElement.className or '').replace ///\s*#{className}\b///, ''

  empty: ->
    @resultsElement.removeChild first while first = @resultsElement.childNodes[0]

  displayError: (error) ->
    message = $new 'div', className: 'exception'
    message.innerHTML = "<h2><span>#{ strings.GetStringFromName 'uncaughtError' }</span></h2><pre><code></code></pre>"
    message.getElementsByTagName('code')[0].appendChild document.createTextNode error.message
    @resultsElement.appendChild message

  displayResult: (files) ->
    return unless files.length
    escape = (string) -> string.replace /&/g, '&amp;'
    list   = $new 'ol', id: 'fuzzyopen-list'
    html   = ''
    for file, i in files
      extension = if file.indexOf('.') < 0 then '' else file.split('.').pop()
      extension = extension.substring(0, 7) + '…' if extension.length > 7
      dirName   = file.split '/'
      baseName  = dirName.pop()
      html += """
      <li#{ if i is 0 then ' class="selected"' else '' } data-uri="#{ escape "#{@path}/#{file}" }">
        <div class="extension"><strong>#{ escape extension }</strong></div>
        <div class="file">
          <div class="name"><span class="icon" />#{ escape baseName }</div>
          <div class="path"><span class="directory">#{ (escape part for part in dirName).join '</span><span class="separator">→<wbr /></span><span class="directory">' }</span></div>
        </div>
      </li>
      """
    list.innerHTML = html
    $on list, 'click', (event) =>
      parent = event.target
      while parent and parent isnt list
        uri = parent.getAttribute 'data-uri'
        if uri
          list.querySelector('.selected').className = ''
          ko.open.URI uri
          parent.className = 'selected'
          break
        parent = parent.parentNode
    @resultsElement.appendChild list

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
