( ->

  `const HTML_NS = 'http://www.w3.org/1999/xhtml'`

  @ui or= {}

  @ui.collapse = (elementId, collapse) ->
    element = document.getElementById elementId
    if collapse ? yes
      element.setAttribute 'collapsed', 'true'
      eventName = 'collapse'
    else
      element.removeAttribute 'collapsed'
      eventName = 'show'
    uiEvent = document.createEvent 'UIEvents'
    uiEvent.initUIEvent eventName, canBubble = no, cancelable = no, window, null
    element.dispatchEvent uiEvent

  @ui.focus = (queryId) =>
    query = document.getElementById queryId
    if query.value.length
      query.value = ''
      @ui.collapse query.getAttribute 'fuzzyopen-results'
    query.focus() if query.getAttribute('disabled') isnt 'true'

  @ui.link = (queryId, resultsId, collapseIds) =>
    query   = document.getElementById queryId
    query.setAttribute 'fuzzyopen-results', resultsId
    query.addEventListener 'command', =>
      value = query.value.trim()
      if value.length
        @ui.collapse resultsId, no
        @findFiles value, (files) =>
          @ui.displayResults resultsId, files
      else
        @ui.collapse resultsId, yes
    , capture = no
    if collapseIds?.length
      collapseElements = (collapse) =>
        @ui.collapse elementId, collapse for elementId in collapseIds
      results = document.getElementById resultsId
      results.addEventListener 'show',     ( -> collapseElements yes), capture = no
      results.addEventListener 'collapse', ( -> collapseElements no),  capture = no

  @ui.displayResults = (resultsId, files) ->
    results = document.getElementById resultsId
    append  = (parent, tagName, attributes, block) ->
      child = document.createElementNS HTML_NS, tagName
      if typeof attributes is 'object' then for key, value of attributes
        if key is 'innerHTML'
          child.appendChild document.createTextNode value
        else
          child.setAttribute key, value
      block = attributes if not block?
      if typeof block is 'function'
        block (tagName, attributes, block) -> append child, tagName, attributes, block
      parent.appendChild child
    results.removeChild firstChild while firstChild = results.childNodes[0]
    append results, 'ol', id: 'fuzzyopen-list', (append) ->
      for file in files
        append 'li', (append) ->
          append 'div', class: 'extension', (append) ->
            append 'strong', innerHTML: 'TODO'
          append 'div', class: 'file', (append) ->
            append 'div', class: 'name', innerHTML: 'file.TODO', (append) ->
              append 'span', class: 'icon'
            append 'div', class: 'path', innerHTML: 'boo/TODO/foo'
            ###
            <html:span class="directory">includes</html:span><html:span class="separator">→<html:wbr /></html:span>
            ###

  this

).call extensions.fuzzyopen
