(function() {
  var threshold;
  var __hasProp = Object.prototype.hasOwnProperty;
  threshold = 16;
  this.onmessage = function(event) {
    var _i, _len, _ref, _result, descend, done, file, parts, pending, result;
    result = {};
    done = function() {
      var _i, _j, _len, _len2, _ref, _ref2, _to, _to2, file, files, group, groups, hit, hits, i, j, key, length, score;
      files = [];
      for (key in _ref = result) {
        if (!__hasProp.call(_ref, key)) continue;
        hits = _ref[key];
        file = [];
        for (_i = 0, _len = hits.length; _i < _len; _i++) {
          hit = hits[_i];
          groups = [];
          for (i = 0, _to = (length = hit.groups.length) - 1; i <= _to; i++) {
            j = i;
            while (i < length - 1 && hit.groups[i][1] === hit.groups[i + 1][0]) {
              i++;
            }
            groups.push([hit.groups[j][0], hit.groups[i][1]]);
          }
          score = [0, 0];
          for (_j = 0, _len2 = groups.length; _j < _len2; _j++) {
            group = groups[_j];
            if (0 < (_ref2 = group[1] - group[0]) && _ref2 < threshold * 2) {
              score[0] += Math.pow(2, group[1] - group[0]);
            }
          }
          for (i = 0, _to2 = groups.length - 2; i <= _to2; i++) {
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
        files.push(file[0]);
      }
      return postMessage(files);
    };
    descend = function(parts, file, remaining, offset, groups) {
      var advance, before, first, ignoreCase, key, position;
      remaining || (remaining = file);
      offset || (offset = 0);
      groups || (groups = []);
      first = parts[0];
      if (['/', '_', '-', '.'].indexOf(first) >= 0 && parts.length > 1) {
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
          key = "/" + file;
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
    _ref = event.data.files;
    _result = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      file = _ref[_i];
      _result.push(descend(parts, file));
    }
    return _result;
  };
}).call(this);
