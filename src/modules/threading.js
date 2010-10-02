var AbstractJob, EXPORTED_SYMBOLS, JOB_EVENTS, JOB_NEXT_ID, JOB_STATUS, JOB_THREADS, JobCompleted;
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
JOB_NEXT_ID = 0;
JOB_EVENTS = {};
JOB_THREADS = {};
JOB_STATUS = {};
AbstractJob = function(_arg) {
  this.id = _arg;
  this.id || (this.id = JOB_NEXT_ID++);
  JOB_EVENTS[this.id] = {};
  JOB_STATUS[this.id] = AbstractJob.CREATED;
  JOB_THREADS[this.id] = null;
  return this;
};
AbstractJob.CREATED = 'created';
AbstractJob.RUNNING = 'running';
AbstractJob.SHUTDOWN = 'shutdown';
AbstractJob.prototype.on = function(name, callback) {
  var _base, _i, _len, _ref;
  (_base = JOB_EVENTS[this.id])[name] || (_base[name] = []);
  if (!(function(){ for (var _i=0, _len=(_ref = JOB_EVENTS[this.id][name]).length; _i<_len; _i++) { if (_ref[_i] === callback) return true; } return false; }).call(this)) {
    JOB_EVENTS[this.id][name].unshift(callback);
  }
  return this;
};
AbstractJob.prototype.remove = function(name, callback) {
  var _ref, i;
  if (name in JOB_EVENTS[this.id]) {
    _ref = JOB_EVENTS[this.id][name].length;
    for (i = 0; (0 <= _ref ? i < _ref : i > _ref); (0 <= _ref ? i += 1 : i -= 1)) {
      if (JOB_EVENTS[this.id][name][i] === callback) {
        return JOB_EVENTS[this.id][name].splice(i, 1);
      }
    }
  }
  return false;
};
AbstractJob.prototype.spawn = function() {
  var backgroundThread;
  backgroundThread = Cc['@mozilla.org/thread-manager;1'].getService().newThread(0);
  backgroundThread.dispatch(this, backgroundThread.DISPATCH_NORMAL);
  JOB_STATUS[this.id] = AbstractJob.RUNNING;
  JOB_THREADS[this.id] = backgroundThread;
  return this;
};
AbstractJob.prototype.execute = function() {
  throw 'Abstract method call in AbstractJob::execute';
};
AbstractJob.prototype.run = function() {
  try {
    return this.done('complete', this.execute());
  } catch (error) {
    Components.utils.reportError(error);
    return this.done('failure', error);
  }
};
AbstractJob.prototype.done = function(eventName, result) {
  var mainThread;
  mainThread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
  return mainThread.dispatch(new JobCompleted(this.id, eventName, result), mainThread.DISPATCH_NORMAL);
};
AbstractJob.prototype.shutdown = function() {
  return this.done('shutdown');
};
AbstractJob.prototype.QueryInterface = function(iid) {
  if (!(iid.equals(Ci.nsIRunnable) || iid.equals(Ci.nsISupports))) {
    throw Cr.NS_ERROR_NO_INTERFACE;
  }
  return this;
};
JobCompleted = function(_arg, _arg2, _arg3) {
  this.result = _arg3;
  this.eventName = _arg2;
  this.id = _arg;
  return this;
};
JobCompleted.prototype.run = function() {
  var _i, _len, _ref, _result, callback;
  if (JOB_STATUS[this.id] === AbstractJob.SHUTDOWN) {
    return false;
  }
  if (!(JOB_THREADS[this.id])) {
    return false;
  }
  try {
    if (this.eventName in JOB_EVENTS[this.id]) {
      _result = []; _ref = JOB_EVENTS[this.id][this.eventName];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        _result.push(callback.call(this, this.result));
      }
      return _result;
    }
  } catch (error) {
    return Components.utils.reportError(error);
  } finally {
    try {
      JOB_STATUS[this.id] = AbstractJob.SHUTDOWN;
      JOB_THREADS[this.id].shutdown();
    } finally {
      JOB_THREADS[this.id] = null;
    }
  }
};
JobCompleted.prototype.QueryInterface = function(iid) {
  if (!(iid.equals(Ci.nsIRunnable) || iid.equals(Ci.nsISupports))) {
    throw Cr.NS_ERROR_NO_INTERFACE;
  }
  return this;
};
EXPORTED_SYMBOLS = ['AbstractJob', 'JobCompleted'];