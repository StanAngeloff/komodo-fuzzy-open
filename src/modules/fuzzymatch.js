var EXPORTED_SYMBOLS, FuzzyMatch, chunkify, naturalCompare;
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
  _result = [];
  for (_i = 0, _len = result.length; _i < _len; _i++) {
    match = result[_i];
    _result.push(match.file);
  }
  return _result;
};
FuzzyMatch.prototype.match = function(query, file) {
  var i, offset, position, score;
  offset = 0;
  score = 0;
  i = 0;
  while (i < query.length) {
    position = file.substring(offset).indexOf(query.charAt(i));
    if (position < 0 || position > FuzzyMatch.threshold) {
      return false;
    }
    offset += position + 1;
    score += Math.pow(FuzzyMatch.threshold - position, 2);
    i++;
  }
  score -= file.length - offset;
  return score;
};
FuzzyMatch.prototype.normalize = function(path) {
  return path.replace(/\\/g, '/');
};
EXPORTED_SYMBOLS = ['FuzzyMatch'];