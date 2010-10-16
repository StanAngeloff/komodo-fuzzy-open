(function() {
  var FuzzyOpen, Process, infoService, observerService, open, prefService, runService, sysUtils;
  var __slice = Array.prototype.slice, __bind = function(func, context) {
    return function() { return func.apply(context, arguments); };
  };
  const Cc = Components.classes;
  const Ci = Components.interfaces;
  const DEFAULT_PATH_EXCLUDES = [
    '*.pyc', '*.pyo', '*.gz', '*.exe', '*.obj', '.DS_Store',
    '.svn', '_svn', '.git', 'CVS', '.hg', '.bzr'
];
  if (!(typeof extensions !== "undefined" && extensions !== null)) {
    this.extensions = {};
  }
  if (!(extensions.fuzzyopen != null)) {
    this.extensions.fuzzyopen = {};
  }
  infoService = Cc['@activestate.com/koInfoService;1'].getService(Ci.koIInfoService);
  runService = Cc['@activestate.com/koRunService;1'].getService(Ci.koIRunService);
  observerService = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);
  sysUtils = Cc['@activestate.com/koSysUtils;1'].getService(Ci.koISysUtils);
  prefService = Cc['@activestate.com/koPrefService;1'].getService(Ci.koIPrefService);
  Process = (function() {
    function Process(_arg, _arg2) {
      this.block = _arg2;
      this.command = _arg;
      if (!(this instanceof Process)) {
        return (function(func, args, ctor) {
          ctor.prototype = func.prototype;
          var child = new ctor, result = func.apply(child, args);
          return typeof result === "object" ? result : child;
        })(Process, arguments, function() {});
      }
      if (this.command instanceof Array) {
        this.command = sysUtils.joinargv(this.command.length, this.command);
      }
      observerService.addObserver(this, this.topic = 'run_terminated', false);
      this.process = runService.RunAndNotify(this.command, null, null, null);
      try {
        this.process.wait(0);
        this.cleanUp();
      } catch (_e) {}
      return this;
    };
    return Process;
  })();
  Process.prototype.observe = function(child, topic, command) {
    if (topic === this.topic && command === this.command) {
      this.cleanUp();
      this.process = null;
    }
    return undefined;
  };
  Process.prototype.cleanUp = function() {
    var exitCode, output;
    if (this.command) {
      observerService.removeObserver(this, this.topic);
      this.command = null;
    }
    if (this.process) {
      exitCode = this.process.wait(-1);
      output = this.process.getStdout() || this.process.getStderr();
      if (this.block) {
        this.block(output, exitCode, this.process);
      }
      this.process = null;
    }
    return undefined;
  };
  Process.prototype.kill = function() {
    if (this.command) {
      observerService.removeObserver(this, this.topic);
      this.command = null;
    }
    if (this.process) {
      this.process.kill(-1);
      this.process = null;
    }
    return undefined;
  };
  this.extensions.fuzzyopen.FuzzyOpen = (function() {
    FuzzyOpen = (function() {
      function FuzzyOpen() {
        if (!(this instanceof FuzzyOpen)) {
          return (function(func, args, ctor) {
            ctor.prototype = func.prototype;
            var child = new ctor, result = func.apply(child, args);
            return typeof result === "object" ? result : child;
          })(FuzzyOpen, arguments, function() {});
        }
        this.file = Cc['@activestate.com/koFileEx;1'].createInstance(Ci.koIFileEx);
        this.events = {};
        this.process = null;
        this.worker = null;
        return this;
      };
      return FuzzyOpen;
    })();
    FuzzyOpen.cache = {};
    FuzzyOpen.tests = {};
    FuzzyOpen.prototype.addEventListener = function(name, block) {
      var _i, _len, _ref;
      if (!(name in this.events)) {
        this.events[name] = [];
      }
      return !(function(){ for (var _i=0, _len=(_ref = this.events[name]).length; _i<_len; _i++) { if (_ref[_i] === block) return true; } return false; }).call(this) ? this.events[name].push(block) : undefined;
    };
    FuzzyOpen.prototype.removeEventListener = function(name, block) {
      var _len, _ref, fn, i;
      if (name in this.events) {
        for (i = 0, _len = (_ref = this.events[name]).length; i < _len; i++) {
          fn = _ref[i];
          if (fn === block) {
            return this.events[name].splice(i, 1);
          }
        }
      }
      return null;
    };
    FuzzyOpen.prototype.dispatchEvent = function(name) {
      var _i, _len, _ref, _result, args, event;
      args = __slice.call(arguments, 1);
      if (!(name in this.events)) {
        return null;
      }
      _result = [];
      for (_i = 0, _len = (_ref = this.events[name]).length; _i < _len; _i++) {
        event = _ref[_i];
        _result.push(event.apply(event, args));
      }
      return _result;
    };
    FuzzyOpen.prototype.scan = function(path, resume) {
      var done;
      done = function(error, files) {
        if (this.worker) {
          this.worker.terminate();
        }
        this.worker = new Worker('chrome://fuzzyopen/content/scripts/workers/exclude.js');
        this.worker.onmessage = function(event) {
          FuzzyOpen.cache[path] = event.data.split('|');
          return resume(error, FuzzyOpen.cache[path]);
        };
        return this.worker.postMessage("" + (FuzzyOpen.getExcludes()) + "|" + (files.join('|')));
      };
      return infoService.platform.indexOf('win') === 0 ? this.scanWindows(path, done) : this.scanUnix(path, done);
    };
    FuzzyOpen.prototype.scanWindows = function(path, resume) {
      if (this.process) {
        this.process.kill();
      }
      return (this.process = Process(['dir', '/A:-D-H', '/B', '/S', '/O:GNE', path], function(output, exitCode) {
        var _i, _len, _ref, _result, file, files;
        if (exitCode > 0) {
          return resume(Error(output));
        }
        files = (function() {
          _result = [];
          for (_i = 0, _len = (_ref = output.trimRight().split(/\r\n|\r|\n/)).length; _i < _len; _i++) {
            file = _ref[_i];
            _result.push(file.substring(path.length + 1));
          }
          return _result;
        })();
        return resume(null, files);
      }));
    };
    FuzzyOpen.prototype.scanUnix = function(path, resume) {
      throw Error('FuzzyOpen.scanUnix(..) is not implemented.');
    };
    FuzzyOpen.prototype.find = function(query, path) {
      var absolutePath, resume;
      this.file.URI = path;
      absolutePath = this.file.dirName;
      resume = __bind(function(error, files) {
        this.dispatchEvent('working');
        if (error) {
          throw error;
        }
        return alert(files);
      }, this);
      if (!(absolutePath in FuzzyOpen.cache)) {
        this.dispatchEvent('loading', [absolutePath]);
        return this.scan(absolutePath, resume);
      } else {
        return resume(null, FuzzyOpen.cache[absolutePath]);
      }
    };
    FuzzyOpen.getExcludes = function() {
      var excludes, key, result;
      result = [];
      if (prefService.prefs.hasStringPref(key = 'fastopen_path_excludes')) {
        excludes = prefService.prefs.getStringPref(key).trim();
      } else {
        excludes = DEFAULT_PATH_EXCLUDES.join(';');
      }
      return excludes;
    };
    return FuzzyOpen;
  }).call(this);
  open = FuzzyOpen();
  open.find('coffee', 'D:\\Workspace\\projects\\psp-payments\\server\\zen-cart');
}).call(this);
