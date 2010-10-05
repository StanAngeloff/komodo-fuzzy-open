var Directory, EXPORTED_SYMBOLS;
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
Directory = (function() {
  return function Directory(_arg, _arg2) {
    this.parent = _arg2;
    this.path = _arg;
    if (this.parent) {
      this.base = this.parent.base;
      this.files = this.parent.files;
    } else {
      this.base = this.path;
      this.files = [];
    }
    this.scan();
    return this;
  };
})();
Directory.prototype.scan = function() {
  var current, directory, iterator, unwrap;
  try {
    directory = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
    directory.initWithPath(this.path);
    iterator = directory.directoryEntries;
    while (iterator.hasMoreElements()) {
      current = iterator.getNext().QueryInterface(Ci.nsIFile);
      if (current.isHidden() || !current.isReadable()) {
        continue;
      }
      if (current.isFile()) {
        this.files.push(this.normalize(current.path));
      } else if (current.isDirectory()) {
        new Directory(current.path, this);
      }
    }
  } catch (error) {
    unwrap = new Error;
    unwrap.message = error.message;
    unwrap.result = error.result;
    unwrap.path = this.path;
    throw unwrap;
  }
  return this;
};
Directory.prototype.normalize = function(path) {
  return path.substring(this.base.length);
};
EXPORTED_SYMBOLS = ['Directory'];