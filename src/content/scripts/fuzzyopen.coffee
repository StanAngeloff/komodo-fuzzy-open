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
  #     job2 = new FuzzyMatchJob files, 'g/i/conf'
  #     job2.on 'complete', (results) ->
  #       alert results
  #     job2.on 'failure', catchError
  #     job2.spawn()


  @strings      = null
  @cachedPath   = null
  @cachedFiles  = null
  @directoryJob = null
  @isWorking    = no

  @update = (uri) ->
    file          = Cc['@activestate.com/koFileEx;1'].createInstance Ci.koIFileEx
    file.URI      = uri
    osPathService = Cc['@activestate.com/koOsPath;1'].getService Ci.koIOsPath
    path          = osPathService.join file.path, ''
    return if @cachedPath is path
    @directoryJob.shutdown() if @isWorking
    @directoryJob = new DirectoryJob @cachedPath = path
    @directoryJob.on 'complete', (files) =>
      @isWorking   = no
      @cachedFiles = files
    @directoryJob.on 'failure', (error) =>
      @isWorking = no
      @catchError error
    @directoryJob.spawn()
    @isWorking = yes

  @catchError = (error) ->
    title   = @strings.getString 'uncaughtError'
    message = @strings.getFormattedString 'unknownError', [error.path, error.toString()]
    switch error.result
      when Cr.NS_ERROR_FILE_NOT_FOUND
        message = @strings.getFormattedString 'pathNotFound', [error.path]
      when Cr.NS_ERROR_FILE_NOT_DIRECTORY
        message = @strings.getFormattedString 'pathNotADirectory', [error.path]
    ko.dialogs.alert title, message

  @togglePane = (event) ->
    ko.commands.doCommandAsync 'cmd_viewLeftPane', event
    setTimeout =>
      element = document.getElementById 'cmd_viewLeftPane'
      return unless element
      box = document.getElementById element.getAttribute 'box'
      return unless box
      return unless box.getAttribute('collapsed') is 'false'
      query   = document.getElementById 'fuzzyopen-query'
      results = document.getElementById 'fuzzyopen-results'
      @ui.start query, results
      query.focus() if query.getAttribute('disabled') isnt 'true'
    , 125

  this

).call extensions.fuzzyopen or= {}

window.addEventListener 'load', ( ->
  extensions.fuzzyopen.strings = document.getElementById 'strings'
  interval = setInterval ->
    return unless ko.places?.manager?.currentPlace
    clearInterval interval
    query   = document.getElementById 'fuzzyopen-query'
    results = document.getElementById 'fuzzyopen-results'
    extensions.fuzzyopen.ui.start query, results
  , 125
), false
