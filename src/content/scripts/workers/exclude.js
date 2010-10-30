(function() {
  this.onmessage = function(event) {
    var _i, _j, _len, _len2, _ref, _result, file, pass, pattern, result, test, tests;
    result = [];
    tests = ((function() {
      _ref = event.data.excludes.split(';');
      _result = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pattern = _ref[_i];
        _result.push(RegExp("(?:^|\\/)" + (pattern.trim().replace(/[-[\]{}()+.,\\^$|#\s]/g, '\\$&').replace(/\?/g, '.').replace(/\*/g, '.*')) + "(?:\\/|$)"));
      }
      return _result;
    })());
    _ref = event.data.files;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      file = _ref[_i];
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
    return postMessage(result);
  };
}).call(this);
