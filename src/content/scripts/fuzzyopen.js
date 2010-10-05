var __extends = function(child, parent) {
  var ctor = function() {};
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
  child.prototype.constructor = child;
  if (typeof parent.extended === "function") parent.extended(child);
  child.__super__ = parent.prototype;
}, __bind = function(func, context) {
  return function() { return func.apply(context, arguments); };
};
if (!(typeof extensions !== "undefined" && extensions !== null)) {
  window.extensions = {};
}
(function() {
  var DirectoryJob, FuzzyMatchJob, modules;
  const Cc = Components.classes;
  const Ci = Components.interfaces;
  const Cr = Components.results;
  modules = {};
  Components.utils.import('resource://fuzzyopen/filesystem.js',  modules);
  Components.utils.import('resource://fuzzyopen/fuzzymatch.js',  modules);
  Components.utils.import('resource://fuzzyopen/threading.js',   modules);
  DirectoryJob = (function() {
    return function DirectoryJob(_arg, id) {
      this.path = _arg;
      DirectoryJob.__super__.constructor.call(this, id);
      return this;
    };
  })();
  __extends(DirectoryJob, modules.AbstractJob);
  DirectoryJob.prototype.execute = function() {
    return (new modules.Directory(this.path)).files;
  };
  FuzzyMatchJob = (function() {
    return function FuzzyMatchJob(_arg, _arg2, id) {
      this.query = _arg2;
      this.files = _arg;
      FuzzyMatchJob.__super__.constructor.call(this, id);
      return this;
    };
  })();
  __extends(FuzzyMatchJob, modules.AbstractJob);
  FuzzyMatchJob.prototype.execute = function() {
    return (new modules.FuzzyMatch(this.files)).find(this.query);
  };
  this.strings = null;
  this.cachedPath = null;
  this.cachedFiles = null;
  this.directoryJob = null;
  this.isWorking = false;
  this.update = function(uri) {
    var file, osPathService, path;
    file = Cc['@activestate.com/koFileEx;1'].createInstance(Ci.koIFileEx);
    file.URI = uri;
    osPathService = Cc['@activestate.com/koOsPath;1'].getService(Ci.koIOsPath);
    path = osPathService.join(file.path, '');
    if (this.cachedPath === path) {
      return;
    }
    if (this.isWorking) {
      this.directoryJob.shutdown();
    }
    this.directoryJob = new DirectoryJob(this.cachedPath = path);
    this.directoryJob.on('complete', __bind(function(files) {
      this.isWorking = false;
      return (this.cachedFiles = files);
    }, this));
    this.directoryJob.on('failure', __bind(function(error) {
      this.isWorking = false;
      return this.catchError(error);
    }, this));
    this.directoryJob.spawn();
    return (this.isWorking = true);
  };
  this.catchError = function(error) {
    var message, title;
    title = this.strings.getString('uncaughtError');
    message = this.strings.getFormattedString('unknownError', [error.path, error.toString()]);
    switch (error.result) {
      case Cr.NS_ERROR_FILE_NOT_FOUND:
        message = this.strings.getFormattedString('pathNotFound', [error.path]);
        break;
      case Cr.NS_ERROR_FILE_NOT_DIRECTORY:
        message = this.strings.getFormattedString('pathNotADirectory', [error.path]);
        break;
    }
    return ko.dialogs.alert(title, message);
  };
  this.togglePane = function(event) {
    ko.commands.doCommandAsync('cmd_viewLeftPane', event);
    return setTimeout(__bind(function() {
      var box, element, query, results;
      element = document.getElementById('cmd_viewLeftPane');
      if (!(element)) {
        return;
      }
      box = document.getElementById(element.getAttribute('box'));
      if (!(box)) {
        return;
      }
      if (box.getAttribute('collapsed') !== 'false') {
        return;
      }
      query = document.getElementById('fuzzyopen-query');
      results = document.getElementById('fuzzyopen-results');
      this.ui.start(query, results);
      return query.getAttribute('disabled') !== 'true' ? query.focus() : undefined;
    }, this), 125);
  };
  return this;
}).call(extensions.fuzzyopen || (extensions.fuzzyopen = {}));
window.addEventListener('load', function() {
  var interval;
  extensions.fuzzyopen.strings = document.getElementById('strings');
  return (interval = setInterval(function() {
    var _ref, _ref2, query, results;
    if (!((((_ref = ko.places) != null) ? (((_ref2 = _ref.manager) != null) ? _ref2.currentPlace : undefined) : undefined))) {
      return;
    }
    clearInterval(interval);
    query = document.getElementById('fuzzyopen-query');
    results = document.getElementById('fuzzyopen-results');
    return extensions.fuzzyopen.ui.start(query, results);
  }, 125));
}, false);