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
  var DirectoryJob, FuzzyMatchJob, cachedFiles, cachedPath, findJob, isFinding, isUpdating, locale, modules, updateJob;
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
  locale = null;
  cachedPath = null;
  cachedFiles = null;
  updateJob = null;
  findJob = null;
  isUpdating = false;
  isFinding = false;
  this.update = function(uri) {
    var file, osPathService, path;
    file = Cc['@activestate.com/koFileEx;1'].createInstance(Ci.koIFileEx);
    file.URI = uri;
    osPathService = Cc['@activestate.com/koOsPath;1'].getService(Ci.koIOsPath);
    path = osPathService.join(file.path, '');
    if (cachedPath === path) {
      return;
    }
    if (isUpdating) {
      updateJob.shutdown();
    }
    updateJob = new DirectoryJob(cachedPath = path);
    updateJob.on('complete', function(files) {
      isUpdating = false;
      return (cachedFiles = files);
    });
    updateJob.on('failure', __bind(function(error) {
      isUpdating = false;
      return this.displayError(error);
    }, this));
    updateJob.spawn();
    return (isUpdating = true);
  };
  this.findFiles = function(query, block) {
    if (isFinding) {
      findJob.shutdown();
    }
    findJob = new FuzzyMatchJob(cachedFiles, query);
    findJob.on('complete', function(files) {
      isFinding = false;
      return block(files);
    });
    findJob.on('failure', __bind(function(error) {
      isFinding = false;
      return this.displayError(error);
    }, this));
    findJob.spawn();
    return (isFinding = true);
  };
  this.displayError = function(error) {
    var message, title;
    title = locale.getString('uncaughtError');
    message = locale.getFormattedString('unknownError', [error.path, error.toString()]);
    switch (error.result) {
      case Cr.NS_ERROR_FILE_NOT_FOUND:
        message = locale.getFormattedString('pathNotFound', [error.path]);
        break;
      case Cr.NS_ERROR_FILE_NOT_DIRECTORY:
        message = locale.getFormattedString('pathNotADirectory', [error.path]);
        break;
    }
    return ko.dialogs.alert(title, message);
  };
  this.toggleLeftPane = function(event) {
    ko.commands.doCommandAsync('cmd_viewLeftPane', event);
    return setTimeout(__bind(function() {
      var box, element;
      element = document.getElementById('cmd_viewLeftPane');
      if (!element) {
        return;
      }
      box = document.getElementById(element.getAttribute('box'));
      if (!box) {
        return;
      }
      if (box.getAttribute('collapsed') !== 'false') {
        return;
      }
      return this.ui.focus('fuzzyopen-query');
    }, this), 125);
  };
  this.initialize = function() {
    var interval;
    locale = document.getElementById('locale');
    interval = setInterval(__bind(function() {
      var _ref, _ref2;
      if (!(((_ref = ko.places) != null) ? (((_ref2 = _ref.manager) != null) ? _ref2.currentPlace : undefined) : undefined)) {
        return;
      }
      clearInterval(interval);
      return setTimeout(__bind(function() {
        return this.update(ko.places.manager.currentPlace);
      }, this), 125);
    }, this), 125);
    return this.ui.link('fuzzyopen-query', 'fuzzyopen-results', ['places-files-tree']);
  };
  return this;
}).call(extensions.fuzzyopen || (extensions.fuzzyopen = {}));
window.addEventListener('load', function() {
  return extensions.fuzzyopen.initialize();
}, false);