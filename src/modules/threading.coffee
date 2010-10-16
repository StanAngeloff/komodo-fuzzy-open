`const Cc = Components.classes`
`const Ci = Components.interfaces`
`const Cr = Components.results`

JOB_NEXT_ID = 0
JOB_EVENTS  = {}
JOB_THREADS = {}
JOB_STATUS  = {}


class AbstractJob

  @CREATED:  'created'
  @RUNNING:  'running'
  @SHUTDOWN: 'shutdown'

  constructor: (@id) ->
    @id or= JOB_NEXT_ID ++
    JOB_EVENTS[@id]  = {}
    JOB_STATUS[@id]  = AbstractJob.CREATED
    JOB_THREADS[@id] = null

  on: (name, callback) ->
    JOB_EVENTS[@id][name] or= []
    JOB_EVENTS[@id][name].unshift callback if callback not in JOB_EVENTS[@id][name]
    this

  remove: (name, callback) ->
    (return JOB_EVENTS[@id][name].splice i, 1) for i in [0...JOB_EVENTS[@id][name].length] when JOB_EVENTS[@id][name][i] is callback if name of JOB_EVENTS[@id]
    false

  spawn: ->
    backgroundThread = Cc['@mozilla.org/thread-manager;1'].getService().newThread 0
    backgroundThread.dispatch this, backgroundThread.DISPATCH_NORMAL
    JOB_STATUS[@id]  = AbstractJob.RUNNING
    JOB_THREADS[@id] = backgroundThread
    this

  execute: -> throw 'Abstract method call in AbstractJob::execute'

  run: ->
    try
      @done 'complete', @execute()
    catch error
      Components.utils.reportError error
      @done 'failure', error

  done: (eventName, result) ->
    mainThread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread
    mainThread.dispatch new JobCompleted(@id, eventName, result), mainThread.DISPATCH_NORMAL

  shutdown: ->
    @done 'shutdown'

  QueryInterface: (iid) ->
    throw Cr.NS_ERROR_NO_INTERFACE if not (iid.equals(Ci.nsIRunnable) or iid.equals(Ci.nsISupports))
    this


class JobCompleted

  constructor: (@id, @eventName, @result) ->
    # pass

  run: ->
    return false if     JOB_STATUS[@id] is AbstractJob.SHUTDOWN
    return false unless JOB_THREADS[@id]
    try
      JOB_THREADS[@id].shutdown()
    finally
      JOB_THREADS[@id] = null
      JOB_STATUS[@id]  = AbstractJob.SHUTDOWN
    try
      callback.call this, @result for callback in JOB_EVENTS[@id][@eventName] if @eventName of JOB_EVENTS[@id]
    catch error
      Components.utils.reportError error

  QueryInterface: (iid) ->
    throw Cr.NS_ERROR_NO_INTERFACE if not (iid.equals(Ci.nsIRunnable) or iid.equals(Ci.nsISupports))
    this


EXPORTED_SYMBOLS = ['AbstractJob', 'JobCompleted']
