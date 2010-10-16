var __bind = function(func, context) {
  return function() { return func.apply(context, arguments); };
}, __hasProp = Object.prototype.hasOwnProperty;
(function() {
  const HTML_NS = 'http://www.w3.org/1999/xhtml';
  this.ui || (this.ui = {});
  this.ui.collapse = function(elementId, collapse) {
    var canBubble, cancelable, element, eventName, uiEvent;
    element = document.getElementById(elementId);
    if ((collapse != null) ? collapse : true) {
      element.setAttribute('collapsed', 'true');
      eventName = 'collapse';
    } else {
      element.removeAttribute('collapsed');
      eventName = 'show';
    }
    uiEvent = document.createEvent('UIEvents');
    uiEvent.initUIEvent(eventName, canBubble = false, cancelable = false, window, null);
    return element.dispatchEvent(uiEvent);
  };
  this.ui.focus = __bind(function(queryId) {
    var query;
    query = document.getElementById(queryId);
    if (query.value.length) {
      query.value = '';
      this.ui.collapse(query.getAttribute('fuzzyopen-results'));
    }
    return query.getAttribute('disabled') !== 'true' ? query.focus() : undefined;
  }, this);
  this.ui.link = __bind(function(queryId, resultsId, collapseIds) {
    var capture, collapseElements, query, results;
    query = document.getElementById(queryId);
    query.setAttribute('fuzzyopen-results', resultsId);
    query.addEventListener('command', __bind(function() {
      var value;
      value = query.value.trim();
      if (value.length) {
        this.ui.collapse(resultsId, false);
        return this.findFiles(value, __bind(function(files) {
          return this.ui.displayResults(resultsId, files);
        }, this));
      } else {
        return this.ui.collapse(resultsId, true);
      }
    }, this), capture = false);
    if (((collapseIds != null) ? collapseIds.length : undefined)) {
      collapseElements = __bind(function(collapse) {
        var _i, _len, _ref, _result, elementId;
        _result = [];
        for (_i = 0, _len = (_ref = collapseIds).length; _i < _len; _i++) {
          elementId = _ref[_i];
          _result.push(this.ui.collapse(elementId, collapse));
        }
        return _result;
      }, this);
      results = document.getElementById(resultsId);
      results.addEventListener('show', function() {
        return collapseElements(true);
      }, capture = false);
      return results.addEventListener('collapse', function() {
        return collapseElements(false);
      }, capture = false);
    }
  }, this);
  this.ui.displayResults = function(resultsId, files) {
    var append, firstChild, results;
    results = document.getElementById(resultsId);
    append = function(parent, tagName, attributes, block) {
      var child, key, value;
      child = document.createElementNS(HTML_NS, tagName);
      if (typeof attributes === 'object') {
        for (key in attributes) {
          if (!__hasProp.call(attributes, key)) continue;
          value = attributes[key];
          if (key === 'innerHTML') {
            child.appendChild(document.createTextNode(value));
          } else {
            child.setAttribute(key, value);
          }
        }
      }
      if (!(block != null)) {
        block = attributes;
      }
      if (typeof block === 'function') {
        block(function(tagName, attributes, block) {
          return append(child, tagName, attributes, block);
        });
      }
      return parent.appendChild(child);
    };
    while (firstChild = results.childNodes[0]) {
      results.removeChild(firstChild);
    }
    return append(results, 'ol', {
      id: 'fuzzyopen-list'
    }, function(append) {
      var _i, _len, _ref, _result;
      _result = [];
      for (_i = 0, _len = (_ref = files).length; _i < _len; _i++) {
        (function() {
          var file = _ref[_i];
          return _result.push(append('li', function(append) {
            append('div', {
              "class": 'extension'
            }, function(append) {
              return append('strong', {
                innerHTML: 'TODO'
              });
            });
            return append('div', {
              "class": 'file'
            }, function(append) {
              append('div', {
                "class": 'name',
                innerHTML: 'file.TODO'
              }, function(append) {
                return append('span', {
                  "class": 'icon'
                });
              });
              return append('div', {
                "class": 'path',
                innerHTML: 'boo/TODO/foo'
                /*
                <html:span class="directory">includes</html:span><html:span class="separator">→<html:wbr /></html:span>
                */
              });
            });
          }));
        })();
      }
      return _result;
    });
  };
  return this;
}).call(extensions.fuzzyopen);