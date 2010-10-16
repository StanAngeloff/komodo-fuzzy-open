`const Cc = Components.classes`
`const Ci = Components.interfaces`

`const DEFAULT_PATH_EXCLUDES = [
    '*.pyc', '*.pyo', '*.gz', '*.exe', '*.obj', '.DS_Store',
    '.svn', '_svn', '.git', 'CVS', '.hg', '.bzr'
]`

this.extensions = {} unless extensions?
this.extensions.fuzzyopen = {} unless extensions.fuzzyopen?

infoService     = Cc['@activestate.com/koInfoService;1'].getService Ci.koIInfoService
runService      = Cc['@activestate.com/koRunService;1'].getService Ci.koIRunService
observerService = Cc['@mozilla.org/observer-service;1'].getService Ci.nsIObserverService
sysUtils        = Cc['@activestate.com/koSysUtils;1'].getService Ci.koISysUtils
prefService     = Cc['@activestate.com/koPrefService;1'].getService Ci.koIPrefService


class Process

  constructor: (@command, @block) ->
    return new Process arguments... if this not instanceof Process
    @command = sysUtils.joinargv @command.length, @command if @command instanceof Array
    observerService.addObserver this, @topic = 'run_terminated', false
    @process = runService.RunAndNotify @command, null, null, null
    try
      @process.wait 0
      @cleanUp()

  observe: (child, topic, command) ->
    if topic is @topic and command is @command
      @cleanUp()
      @process = null
    undefined

  cleanUp: ->
    if @command
      observerService.removeObserver this, @topic
      @command = null
    if @process
      exitCode = @process.wait(-1)
      output   = @process.getStdout() or @process.getStderr()
      @block output, exitCode, @process if @block
      @process = null
    undefined

  kill: ->
    if @command
      observerService.removeObserver this, @topic
      @command = null
    if @process
      @process.kill(-1)
      @process = null
    undefined


this.extensions.fuzzyopen.FuzzyOpen = class FuzzyOpen

  @cache: {}
  @tests: {}

  constructor: ->
    return new FuzzyOpen arguments... if this not instanceof FuzzyOpen
    @file    = Cc['@activestate.com/koFileEx;1'].createInstance Ci.koIFileEx
    @events  = {}
    @process = null
    @worker  = null

  addEventListener: (name, block) ->
    @events[name] = [] if name not of @events
    @events[name].push block if block not in @events[name]

  removeEventListener: (name, block) ->
    (return @events[name].splice i, 1) for fn, i in @events[name] when fn is block if name of @events
    return null

  dispatchEvent: (name, args...) ->
    return null if name not of @events
    event args... for event in @events[name]

  scan: (path, resume) ->
    done = (error, files) ->
      @worker.terminate() if @worker
      @worker = new Worker 'chrome://fuzzyopen/content/scripts/workers/exclude.js'
      @worker.onmessage = (event) ->
        FuzzyOpen.cache[path] = event.data.split '|'
        resume error, FuzzyOpen.cache[path]
      @worker.postMessage "#{ FuzzyOpen.getExcludes() }|#{ files.join '|' }"
    if infoService.platform.indexOf('win') is 0
      @scanWindows path, done
    else
      @scanUnix path, done

  scanWindows: (path, resume) ->
    @process.kill() if @process
    @process = Process ['dir', '/A:-D-H', '/B', '/S', '/O:GNE', path], (output, exitCode) ->
      return resume Error output if exitCode > 0
      files = file.substring path.length + 1 for file in output.trimRight().split /\r\n|\r|\n/
      resume null, files

  scanUnix: (path, resume) ->
    throw Error 'FuzzyOpen.scanUnix(..) is not implemented.'

  find: (query, path) ->
    @file.URI    = path
    absolutePath = @file.dirName
    resume = (error, files) =>
      @dispatchEvent 'working'
      throw error if error
      alert files
    if absolutePath not of FuzzyOpen.cache
      @dispatchEvent 'loading', [absolutePath]
      @scan absolutePath, resume
    else
      resume null, FuzzyOpen.cache[absolutePath]

  @getExcludes: ->
    result = []
    if prefService.prefs.hasStringPref key = 'fastopen_path_excludes'
      excludes = prefService.prefs.getStringPref(key).trim()
    else
      excludes = DEFAULT_PATH_EXCLUDES.join ';'
    excludes


open = FuzzyOpen()
open.find 'coffee', 'D:\\Workspace\\projects\\psp-payments\\server\\zen-cart' # ko.places.manager.currentPlace
