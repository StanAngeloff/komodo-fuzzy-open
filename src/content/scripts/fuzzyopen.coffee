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

chunkify = (string) ->
  string
    .replace(/(\d+)/g, '\u0000$1\u0000')
    .replace(/^\u0000|\u0000$/g, '')
    .split('\u0000')
    .map (chunk) -> if isNaN number = parseInt chunk, 10 then chunk else number

naturalCompare = (prev, next) ->
  prev = chunkify ('' + prev).toLowerCase()
  next = chunkify ('' + next).toLowerCase()
  for i in [0...Math.max prev.length, next.length]
    return -1 if i >= prev.length
    return  1 if i >= next.length
    return -1 if prev[i] < next[i]
    return  1 if prev[i] > next[i]
  return 0


class Process

  constructor: (@command, @resume) ->
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
      @resume output, exitCode, @process if @resume
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

  @cache:    {}
  @poolSize: 8
  @maximum:  100

  constructor: ->
    return new FuzzyOpen arguments... if this not instanceof FuzzyOpen
    @uri     = Cc['@activestate.com/koFileEx;1'].createInstance Ci.koIFileEx
    @events  = {}
    @process = null
    @worker  = null
    @pool    = null for worker in [0...FuzzyOpen.poolSize]

  addEventListener: (name, block) ->
    @events[name] = [] if name not of @events
    @events[name].push block if block not in @events[name]

  removeEventListener: (name, block) ->
    (return @events[name].splice i, 1) for fn, i in @events[name] when fn is block if name of @events
    return null

  dispatchEvent: (name, args...) ->
    return null if name not of @events
    block args... for block in @events[name]
    undefined

  scan: (path, resume) ->
    done = (error, files) ->
      return resume error if error
      @worker.terminate() if @worker
      @worker = new Worker 'chrome://fuzzyopen/content/scripts/workers/exclude.js'
      @worker.onmessage = (event) ->
        FuzzyOpen.cache[path] = event.data or []
        resume null, FuzzyOpen.cache[path]
      @worker.onerror = (error) ->
        resume error
      @worker.postMessage { excludes: FuzzyOpen.getExcludes(), files }
    if infoService.platform.indexOf('win') is 0
      @scanWindows path, done
    else
      @scanUnix path, done

  scanWindows: (path, resume) ->
    @process.kill() if @process
    @process = Process ['dir', '/A:-D-H', '/B', '/S', '/O:GNE', path], (output, exitCode) ->
      return resume Error output.substring 0, 4096 if exitCode isnt 0
      files = file.substring(path.length + 1).replace(/\\/g, '/') for file in output.trimRight().split /\r\n|\r|\n/
      resume null, files

  scanUnix: (path, resume) ->
    throw Error 'FuzzyOpen.scanUnix(..) is not implemented.'

  find: (query, uri, resume) ->
    @uri.URI   = uri
    path       = @uri.path
    normalized = query.replace /\s+/g, ''
    done       = (error, files) =>
      return resume error if error
      @dispatchEvent 'working'
      @scorize normalized, files, (error, result) =>
        @dispatchEvent 'end'
        resume error, result
    if path not of FuzzyOpen.cache
      @dispatchEvent 'loading', [path]
      @scan path, done
    else
      done null, FuzzyOpen.cache[path]

  scorize: (query, files, resume) ->
    worker.terminate() for worker in @pool when worker
    pending      = 0
    offset       = 0
    chunk        = Math.floor(files.length / FuzzyOpen.poolSize) or 1
    workerError  = null
    workerResult = []
    done         = (error, result) ->
      pending --
      workerError  = error if error and not workerError
      workerResult = workerResult.concat result
      if pending is 0
        workerResult.sort (prev, next) ->
          return -1 if prev.groups.length < next.groups.length
          return  1 if prev.groups.length > next.groups.length
          return -1 if prev.score[0] > next.score[0]
          return  1 if prev.score[0] < next.score[0]
          return -1 if prev.score[1] < next.score[1]
          return  1 if prev.score[1] > next.score[1]
          return  naturalCompare prev.file, next.file
        resume workerError, workerResult.slice 0, FuzzyOpen.maximum
    for i in [0...FuzzyOpen.poolSize]
      slice   = files.slice offset, if i is FuzzyOpen.poolSize - 1 then files.length else offset + chunk
      offset += slice.length
      @pool[i] = new Worker 'chrome://fuzzyopen/content/scripts/workers/scorize.js'
      @pool[i].onmessage = (event) ->
        done null, event.data or []
      @pool[i].onerror = (error) ->
        done error
      pending ++
      @pool[i].postMessage { query, files: slice }
      break if offset >= files.length
    undefined

  stop: ->
    worker.terminate()  for worker in @pool when worker
    @worker.terminate() if @worker
    @process.kill()     if @process
    @pool    = null     for worker in [0...FuzzyOpen.poolSize]
    @worker  = null
    @process = null
    @dispatchEvent 'stop'

  @getExcludes: ->
    result = []
    if prefService.prefs.hasStringPref key = 'fastopen_path_excludes'
      excludes = prefService.prefs.getStringPref(key).trim()
    else
      excludes = DEFAULT_PATH_EXCLUDES.join ';'
    excludes
