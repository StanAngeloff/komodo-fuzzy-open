(function() {
  var FuzzyOpen, Process, chunkify, infoService, naturalCompare, observerService, prefService, runService, sysUtils;
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
  chunkify = function(string) {
    return string.replace(/(\d+)/g, '\u0000$1\u0000').replace(/^\u0000|\u0000$/g, '').split('\u0000').map(function(chunk) {
      var number;
      return isNaN(number = parseInt(chunk, 10)) ? chunk : number;
    });
  };
  naturalCompare = function(prev, next) {
    var _ref, i;
    prev = chunkify(('' + prev).toLowerCase());
    next = chunkify(('' + next).toLowerCase());
    for (i = 0, _ref = Math.max(prev.length, next.length); (0 <= _ref ? i < _ref : i > _ref); (0 <= _ref ? i += 1 : i -= 1)) {
      if (i >= prev.length) {
        return -1;
      }
      if (i >= next.length) {
        return 1;
      }
      if (prev[i] < next[i]) {
        return -1;
      }
      if (prev[i] > next[i]) {
        return 1;
      }
    }
    return 0;
  };
  Process = (function() {
    function Process(_arg, _arg2) {
      this.resume = _arg2;
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
      if (this.resume) {
        this.resume(output, exitCode, this.process);
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
        var _ref, _result, worker;
        if (!(this instanceof FuzzyOpen)) {
          return (function(func, args, ctor) {
            ctor.prototype = func.prototype;
            var child = new ctor, result = func.apply(child, args);
            return typeof result === "object" ? result : child;
          })(FuzzyOpen, arguments, function() {});
        }
        this.uri = Cc['@activestate.com/koFileEx;1'].createInstance(Ci.koIFileEx);
        this.events = {};
        this.process = null;
        this.worker = null;
        this.pool = (function() {
          _result = [];
          for (worker = 0, _ref = FuzzyOpen.poolSize; (0 <= _ref ? worker < _ref : worker > _ref); (0 <= _ref ? worker += 1 : worker -= 1)) {
            _result.push(null);
          }
          return _result;
        })();
        return this;
      };
      return FuzzyOpen;
    })();
    FuzzyOpen.cache = {};
    FuzzyOpen.poolSize = 8;
    FuzzyOpen.maximum = 100;
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
      var _i, _len, _ref, args, block;
      args = __slice.call(arguments, 1);
      if (!(name in this.events)) {
        return null;
      }
      for (_i = 0, _len = (_ref = this.events[name]).length; _i < _len; _i++) {
        block = _ref[_i];
        block.apply(block, args);
      }
      return undefined;
    };
    FuzzyOpen.prototype.scan = function(path, resume) {
      var done;
      done = function(error, files) {
        if (error) {
          return resume(error);
        }
        if (this.worker) {
          this.worker.terminate();
        }
        this.worker = new Worker('chrome://fuzzyopen/content/scripts/workers/exclude.js');
        this.worker.onmessage = function(event) {
          FuzzyOpen.cache[path] = event.data || [];
          return resume(null, FuzzyOpen.cache[path]);
        };
        this.worker.onerror = function(error) {
          return resume(error);
        };
        return this.worker.postMessage({
          excludes: FuzzyOpen.getExcludes(),
          files: files
        });
      };
      return infoService.platform.indexOf('win') === 0 ? this.scanWindows(path, done) : this.scanUnix(path, done);
    };
    FuzzyOpen.prototype.scanWindows = function(path, resume) {
      if (this.process) {
        this.process.kill();
      }
      return (this.process = Process(['dir', '/A:-D-H', '/B', '/S', '/O:GNE', path], function(output, exitCode) {
        var _i, _len, _ref, _result, file, files;
        if (exitCode !== 0) {
          return resume(Error(output.substring(0, 4096)));
        }
        files = (function() {
          _result = [];
          for (_i = 0, _len = (_ref = output.trimRight().split(/\r\n|\r|\n/)).length; _i < _len; _i++) {
            file = _ref[_i];
            _result.push(file.substring(path.length + 1).replace(/\\/g, '/'));
          }
          return _result;
        })();
        return resume(null, files);
      }));
    };
    FuzzyOpen.prototype.scanUnix = function(path, resume) {
      throw Error('FuzzyOpen.scanUnix(..) is not implemented.');
    };
    FuzzyOpen.prototype.find = function(query, uri, resume) {
      var done, normalized, path;
      this.uri.URI = uri;
      path = this.uri.path;
      normalized = query.replace(/\s+/g, '');
      done = __bind(function(error, files) {
        if (error) {
          return resume(error);
        }
        this.dispatchEvent('working');
        return this.scorize(normalized, files, __bind(function(error, result) {
          this.dispatchEvent('end');
          return resume(error, result);
        }, this));
      }, this);
      if (!(path in FuzzyOpen.cache)) {
        this.dispatchEvent('loading', [path]);
        return this.scan(path, done);
      } else {
        return done(null, FuzzyOpen.cache[path]);
      }
    };
    FuzzyOpen.prototype.scorize = function(query, files, resume) {
      var _i, _j, _len, _ref, _ref2, chunk, done, i, offset, pending, slice, worker, workerError, workerResult;
      for (_i = 0, _len = (_ref = this.pool).length; _i < _len; _i++) {
        worker = _ref[_i];
        if (worker) {
          worker.terminate();
        }
      }
      pending = 0;
      offset = 0;
      chunk = Math.floor(files.length / FuzzyOpen.poolSize) || 1;
      workerError = null;
      workerResult = [];
      done = function(error, result) {
        pending--;
        if (error && !workerError) {
          workerError = error;
        }
        workerResult = workerResult.concat(result);
        if (pending === 0) {
          workerResult.sort(function(prev, next) {
            if (prev.groups.length < next.groups.length) {
              return -1;
            }
            if (prev.groups.length > next.groups.length) {
              return 1;
            }
            if (prev.score[0] > next.score[0]) {
              return -1;
            }
            if (prev.score[0] < next.score[0]) {
              return 1;
            }
            if (prev.score[1] < next.score[1]) {
              return -1;
            }
            if (prev.score[1] > next.score[1]) {
              return 1;
            }
            return naturalCompare(prev.file, next.file);
          });
          return resume(workerError, workerResult.slice(0, FuzzyOpen.maximum));
        }
      };
      for (_j = 0, _ref2 = FuzzyOpen.poolSize; (0 <= _ref2 ? _j < _ref2 : _j > _ref2); (0 <= _ref2 ? _j += 1 : _j -= 1)) {
        var i = _j;
        slice = files.slice(offset, i === FuzzyOpen.poolSize - 1 ? files.length : offset + chunk);
        offset += slice.length;
        this.pool[i] = new Worker('chrome://fuzzyopen/content/scripts/workers/scorize.js');
        this.pool[i].onmessage = function(event) {
          return done(null, event.data || []);
        };
        this.pool[i].onerror = function(error) {
          return done(error);
        };
        pending++;
        this.pool[i].postMessage({
          query: query,
          files: slice
        });
        if (offset >= files.length) {
          break;
        }
      }
      return undefined;
    };
    FuzzyOpen.prototype.stop = function() {
      var _i, _len, _ref, _ref2, _result, worker;
      for (_i = 0, _len = (_ref = this.pool).length; _i < _len; _i++) {
        worker = _ref[_i];
        if (worker) {
          worker.terminate();
        }
      }
      if (this.worker) {
        this.worker.terminate();
      }
      if (this.process) {
        this.process.kill();
      }
      this.pool = (function() {
        _result = [];
        for (worker = 0, _ref2 = FuzzyOpen.poolSize; (0 <= _ref2 ? worker < _ref2 : worker > _ref2); (0 <= _ref2 ? worker += 1 : worker -= 1)) {
          _result.push(null);
        }
        return _result;
      })();
      this.worker = null;
      this.process = null;
      return this.dispatchEvent('stop');
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
}).call(this);
