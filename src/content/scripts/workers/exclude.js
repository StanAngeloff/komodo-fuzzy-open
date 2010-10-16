(function() {
  this.onmessage = function(event) {
    var _i, _j, _len, _len2, _result, excludes, file, files, pass, pattern, result, test, tests;
    result = [];
    files = event.data.split('|');
    excludes = files.shift().split(';');
    tests = (function() {
      _result = [];
      for (_i = 0, _len = excludes.length; _i < _len; _i++) {
        pattern = excludes[_i];
        _result.push(RegExp("(?:^|\\/|\\\\)" + (pattern.replace(/[-[\]{}()+.,\\^$|#\s]/g, '\\$&').replace(/\?/g, '.').replace(/\*/g, '.*')) + "(?:\\\\|\\/|$)"));
      }
      return _result;
    })();
    for (_i = 0, _len = files.length; _i < _len; _i++) {
      file = files[_i];
      pass = true;
      for (_j = 0, _len2 = tests.length; _j < _len2; _j++) {
        test = tests[_j];
        if (test.exec(file)) {
          pass = false;
          break;
        }
      }
      if (pass) {
        result.push(file);
      }
    }
    return postMessage(result.join('|'));
  };
}).call(this);
