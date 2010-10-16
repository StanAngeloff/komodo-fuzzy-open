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
    var _i, _len, _len2, _result, descend, done, file, files, i, part, parts, pending, query, result;
    files = event.data.split('|');
    query = files.shift();
    result = {};
    done = function(result) {
      var _i, _len, _result, file, score, temp;
      temp = [];
      for (file in result) {
        if (!__hasProp.call(result, file)) continue;
        score = result[file];
        temp.push({
          file: file.substring(1),
          score: score
        });
      }
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
      var first, key, position;
      first = parts[0];
      while (true) {
        position = remaining.indexOf(first);
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
          if (!(key in result) || result[key] < score) {
            result[key] = score;
          }
        } else {
          pending++;
          descend(parts.slice(1), file, remaining, score);
        }
      }
      pending--;
      return pending === 0 ? done(result) : undefined;
    };
    pending = files.length;
    parts = query.split('');
    for (i = 0, _len = parts.length; i < _len; i++) {
      part = parts[i];
      if ((part === '/' || part === '_' || part === '-' || part === '.') && i < parts.length - 1) {
        parts.splice(i, 2, "" + part + (parts[i + 1]));
      }
    }
    _result = [];
    for (_i = 0, _len2 = files.length; _i < _len2; _i++) {
      file = files[_i];
      _result.push(descend(parts, file, file, 0));
    }
    return _result;
  };
}).call(this);
