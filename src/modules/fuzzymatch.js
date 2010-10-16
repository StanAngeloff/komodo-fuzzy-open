var EXPORTED_SYMBOLS, FuzzyMatch, chunkify, logger, naturalCompare;
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
logger = Cc['@activestate.com/koLoggingService;1'].getService(Ci.koILoggingService).getLogger('fuzzyopen');
logger.setLevel(10);
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
FuzzyMatch = (function() {
  return function FuzzyMatch(_arg) {
    this.files = _arg;
    this.files || (this.files = []);
    return this;
  };
})();
FuzzyMatch.threshold = 16;
FuzzyMatch.prototype.find = function(query) {
  var _i, _len, _ref, _result, file, match, result, score;
  query = this.normalize(query);
  logger.debug(this.files);
  result = (function() {
    _result = [];
    for (_i = 0, _len = (_ref = this.files).length; _i < _len; _i++) {
      file = _ref[_i];
      if (score = this.match(query, this.normalize(file))) {
        _result.push({
          file: file,
          score: score
        });
      }
    }
    return _result;
  }).call(this);
  result.sort(function(prev, next) {
    if (prev.score > next.score) {
      return -1;
    }
    if (prev.score < next.score) {
      return 1;
    }
    return naturalCompare(prev.file, next.file);
  });
  logger.debug(JSON.stringify(result));
  _result = [];
  for (_i = 0, _len = result.length; _i < _len; _i++) {
    match = result[_i];
    _result.push(match.file);
  }
  return _result;
};
FuzzyMatch.prototype.match = function(query, file) {
  var _len, _result, i, index, offset, part, parts, score;
  parts = query.split('');
  for (index = 0, _len = parts.length; index < _len; index++) {
    part = parts[index];
    if (('/' === part || '_' === part || '-' === part || '.' === part) && index < parts.length - 1) {
      parts.push(part + parts[index + 1]);
    }
  }
  offset = 0;
  score = 0;
  i = 0;
  _result = [];
  while (i < parts.length) {
    _result.push(i++);
  }
  return _result;
};
FuzzyMatch.prototype.normalize = function(path) {
  return path.replace(/\\/g, '/');
};
EXPORTED_SYMBOLS = ['FuzzyMatch'];