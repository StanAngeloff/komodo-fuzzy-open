window.extensions = {} unless extensions?

( ->
  `const Cc = Components.classes`
  `const Ci = Components.interfaces`
  `const Cr = Components.results`

  modules = {}
  `Components.utils.import('resource://fuzzyopen/filesystem.js',  modules)`
  `Components.utils.import('resource://fuzzyopen/fuzzymatch.js',  modules)`
  `Components.utils.import('resource://fuzzyopen/threading.js',   modules)`


  class DirectoryJob extends modules.AbstractJob
    constructor: (@path, id) -> super id
    execute: -> (new modules.Directory @path).files


  class FuzzyMatchJob extends modules.AbstractJob
    constructor: (@files, @query, id) -> super id
    execute: -> (new modules.FuzzyMatch @files).find @query


  locale       = null
  cachedPath   = null
  cachedFiles  = null
  updateJob    = null
  findJob      = null
  isUpdating   = no
  isFinding    = no

  @update = (uri) ->
    file          = Cc['@activestate.com/koFileEx;1'].createInstance Ci.koIFileEx
    file.URI      = uri
    osPathService = Cc['@activestate.com/koOsPath;1'].getService Ci.koIOsPath
    path          = osPathService.join file.path, ''
    return if cachedPath is path
    updateJob.shutdown() if isUpdating
    updateJob = new DirectoryJob cachedPath = path
    updateJob.on 'complete', (files) ->
      isUpdating  = no
      cachedFiles = files
    updateJob.on 'failure', (error) =>
      isUpdating = no
      @displayError error
    updateJob.spawn()
    isUpdating = yes

  @findFiles = (query, block) ->
    findJob.shutdown() if isFinding
    findJob = new FuzzyMatchJob cachedFiles, query
    findJob.on 'complete', (files) ->
      isFinding = no
      block files
    findJob.on 'failure', (error) =>
      isFinding = no
      @displayError error
    findJob.spawn()
    isFinding = yes

  @displayError = (error) ->
    title   = locale.getString 'uncaughtError'
    message = locale.getFormattedString 'unknownError', [error.path, error.toString()]
    switch error.result
      when Cr.NS_ERROR_FILE_NOT_FOUND
        message = locale.getFormattedString 'pathNotFound', [error.path]
      when Cr.NS_ERROR_FILE_NOT_DIRECTORY
        message = locale.getFormattedString 'pathNotADirectory', [error.path]
    ko.dialogs.alert title, message

  @toggleLeftPane = (event) ->
    ko.commands.doCommandAsync 'cmd_viewLeftPane', event
    setTimeout =>
      element = document.getElementById 'cmd_viewLeftPane'
      return unless element
      box = document.getElementById element.getAttribute 'box'
      return unless box
      return unless box.getAttribute('collapsed') is 'false'
      @ui.focus 'fuzzyopen-query'
    , 125

  @initialize = ->
    # TODO: monitor set_currentPlaces
    locale   = document.getElementById 'locale'
    interval = setInterval =>
      return unless ko.places?.manager?.currentPlace
      clearInterval interval
      setTimeout =>
        @update ko.places.manager.currentPlace
      , 125
    , 125
    @ui.link 'fuzzyopen-query', 'fuzzyopen-results', ['places-files-tree']

  this

).call extensions.fuzzyopen or= {}

window.addEventListener 'load', ( -> extensions.fuzzyopen.initialize()), no
