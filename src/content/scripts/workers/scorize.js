(function() {
  var threshold;
  var __hasProp = Object.prototype.hasOwnProperty;
  threshold = 16;
  this.onmessage = function(event) {
    var _i, _len, _ref, _result, descend, done, file, parts, pending, result;
    result = {};
    done = function() {
      var _i, _ref, files, key;
      files = [];
      for (_i in _ref = result) {
        if (!__hasProp.call(_ref, _i)) continue;
        (function() {
          var _j, _k, _len, _len2, _ref2, _ref3, _ref4, _ref5, file, group, groups, hit, i, j, length, score;
          var key = _i;
          var hits = _ref[_i];
          file = [];
          for (_j = 0, _len = (_ref2 = hits).length; _j < _len; _j++) {
            hit = _ref2[_j];
            groups = [];
            for (i = 0, _ref3 = (length = hit.groups.length); (0 <= _ref3 ? i < _ref3 : i > _ref3); (0 <= _ref3 ? i += 1 : i -= 1)) {
              j = i;
              while (i < length - 1 && hit.groups[i][1] === hit.groups[i + 1][0]) {
                i++;
              }
              groups.push([hit.groups[j][0], hit.groups[i][1]]);
            }
            score = [0, 0];
            for (_k = 0, _len2 = groups.length; _k < _len2; _k++) {
              group = groups[_k];
              if ((0 < (_ref4 = group[1] - group[0])) && (_ref4 < threshold * 2)) {
                score[0] += Math.pow(2, group[1] - group[0]);
              }
            }
            for (i = 0, _ref5 = groups.length - 1; (0 <= _ref5 ? i < _ref5 : i > _ref5); (0 <= _ref5 ? i += 1 : i -= 1)) {
              score[1] += groups[i + 1][0] - groups[i][1];
            }
            file.push({
              file: hit.file,
              score: score,
              groups: groups
            });
          }
          file.sort(function(prev, next) {
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
            return 0;
          });
          return files.push(file[0]);
        })();
      }
      return postMessage(files);
    };
    descend = function(parts, file, remaining, offset, groups) {
      var advance, before, first, ignoreCase, key, position;
      remaining || (remaining = file);
      offset || (offset = 0);
      groups || (groups = []);
      first = parts[0];
      if ((['/', '_', '-', '.'].indexOf(first) >= 0) && parts.length > 1) {
        pending++;
        descend([first + parts[1]].concat(parts.slice(2)), file, remaining, offset, groups);
      }
      ignoreCase = first !== first.toUpperCase();
      while (true) {
        before = remaining;
        position = ignoreCase ? remaining.toLowerCase().indexOf(first) : remaining.indexOf(first);
        if (position < 0) {
          break;
        }
        remaining = remaining.substring(advance = position + first.length);
        if (remaining.length < parts.length - 1) {
          break;
        }
        offset += advance;
        groups.push([offset - first.length, offset]);
        if (parts.length === 1) {
          key = ("/" + file);
          if (!(key in result)) {
            result[key] = [];
          }
          result[key].push({
            offset: offset,
            groups: Array.prototype.slice.call(groups),
            file: file
          });
        } else {
          pending++;
          descend(parts.slice(1), file, remaining, offset, groups);
        }
        groups.pop();
      }
      pending--;
      return pending === 0 ? done() : undefined;
    };
    pending = event.data.files.length;
    parts = event.data.query.split('');
    _result = [];
    for (_i = 0, _len = (_ref = event.data.files).length; _i < _len; _i++) {
      file = _ref[_i];
      _result.push(descend(parts, file));
    }
    return _result;
  };
}).call(this);
