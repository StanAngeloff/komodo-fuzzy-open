(function() {
  var chunkify, naturalCompare, threshold;
  var __hasProp = Object.prototype.hasOwnProperty;
  threshold = 16;
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
  this.onmessage = function(event) {
    var _i, _len, _result, descend, done, file, files, parts, pending, query, result;
    files = event.data.split('|');
    query = files.shift();
    result = {};
    done = function() {
      var _i, _len, _ref, _result, file, key, temp;
      temp = (function() {
        _result = [];
        for (key in _ref = result) {
          if (!__hasProp.call(_ref, key)) continue;
          file = _ref[key];
          _result.push(file);
        }
        return _result;
      })();
      temp.sort(function(prev, next) {
        if (prev.score > next.score) {
          return -1;
        }
        if (prev.score < next.score) {
          return 1;
        }
        return naturalCompare(prev.file, next.file);
      });
      files = (function() {
        _result = [];
        for (_i = 0, _len = temp.length; _i < _len; _i++) {
          file = temp[_i];
          _result.push(file.file);
        }
        return _result;
      })();
      return postMessage(files.join('|'));
    };
    descend = function(parts, file, remaining, score) {
      var first, ignoreCase, key, position;
      first = parts[0];
      if ((first === '/' || first === '_' || first === '-' || first === '.') && parts.length > 1) {
        pending++;
        descend([first + parts[1]].concat(parts.slice(2)), file, remaining, score);
      }
      ignoreCase = first !== first.toUpperCase();
      while (true) {
        position = ignoreCase ? remaining.toLowerCase().indexOf(first) : remaining.indexOf(first);
        if (position < 0) {
          break;
        }
        remaining = remaining.substring(position + 1);
        if (remaining.length < parts.length - 1) {
          break;
        }
        if (position < threshold) {
          score += Math.pow(threshold - position, first.length + 1);
        }
        if (parts.length === 1) {
          score -= remaining.length;
          key = ("/" + file);
          if (!(key in result) || result[key].score < score) {
            result[key] = {
              file: file,
              score: score
            };
          }
        } else {
          pending++;
          descend(parts.slice(1), file, remaining, score);
        }
      }
      pending--;
      return pending === 0 ? done() : undefined;
    };
    pending = files.length;
    parts = query.split('');
    _result = [];
    for (_i = 0, _len = files.length; _i < _len; _i++) {
      file = files[_i];
      _result.push(descend(parts, file, file, 0));
    }
    return _result;
  };
}).call(this);
