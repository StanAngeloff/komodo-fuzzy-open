(function() {
  var $element, $new, $on, $sleep, UI, strings;
  var __hasProp = Object.prototype.hasOwnProperty, __bind = function(func, context) {
    return function() { return func.apply(context, arguments); };
  };
  if (!(typeof extensions !== "undefined" && extensions !== null)) {
    this.extensions = {};
  }
  if (!(extensions.fuzzyopen != null)) {
    this.extensions.fuzzyopen = {};
  }
  const Cc = Components.classes;
  const Ci = Components.interfaces;
  const HTML_NS = 'http://www.w3.org/1999/xhtml';
  $element = function(id) {
    return document.getElementById(id);
  };
  $on = function(element, event, block) {
    return element.addEventListener(event, block, false);
  };
  $sleep = function(interval, resume) {
    return setTimeout(resume, interval);
  };
  $new = function(tagName, attrs) {
    var element, key, value;
    element = document.createElementNS(HTML_NS, tagName);
    if (attrs) {
      for (key in attrs) {
        if (!__hasProp.call(attrs, key)) continue;
        value = attrs[key];
        (element[key] = value);
      }
    }
    return element;
  };
  strings = Cc['@mozilla.org/intl/stringbundle;1'].getService(Ci.nsIStringBundleService).createBundle('chrome://fuzzyopen/locale/fuzzyopen.properties');
  this.extensions.fuzzyopen.ui = (function() {
    UI = (function() {
      function UI(queryId, resultsId, workingId, hideList) {
        var _i, _len, _result, id;
        if (!(this instanceof UI)) {
          return (function(func, args, ctor) {
            ctor.prototype = func.prototype;
            var child = new ctor, result = func.apply(child, args);
            return typeof result === "object" ? result : child;
          })(UI, arguments, function() {});
        }
        this.queryElement = $element(queryId);
        this.resultsElement = $element(resultsId);
        this.workingElement = $element(workingId);
        this.hideElements = (function() {
          if (hideList) {
            _result = [];
            for (_i = 0, _len = hideList.length; _i < _len; _i++) {
              id = hideList[_i];
              _result.push($element(id));
            }
            return _result;
          } else {
            return [];
          }
        })();
        this.path = null;
        this.fuzzyOpen = extensions.fuzzyopen.FuzzyOpen();
        if (!UI.top) {
          UI.top = this;
        }
        this.addEvents();
        return this;
      };
      return UI;
    })();
    UI.top = null;
    UI.maximum = 100;
    UI.prototype.addEvents = function() {
      $on(this.queryElement, 'command', __bind(function() {
        var value;
        value = this.queryElement.value.trim();
        return value.length ? this.open(value) : this.hide();
      }, this));
      $on(this.fuzzyOpen, 'loading', __bind(function() {
        var loading;
        this.empty();
        loading = $new('div', {
          className: 'loading'
        });
        loading.innerHTML = ("<p><span>" + (strings.GetStringFromName('loading')) + "</span></p>");
        return this.resultsElement.appendChild(loading);
      }, this));
      return $on(this.fuzzyOpen, 'working', __bind(function() {
        this.isWorking(true);
        return this.empty();
      }, this));
    };
    UI.prototype.update = function(places) {
      this.hide();
      this.path = places.manager.currentPlace;
      return this.path && places.manager.currentPlaceIsLocal ? this.queryElement.removeAttribute('disabled') : this.queryElement.setAttribute('disabled', 'true');
    };
    UI.prototype.open = function(value) {
      this.toggle(true);
      this.isWorking(false);
      this.fuzzyOpen.stop();
      return this.fuzzyOpen.find(value, this.path, __bind(function(error, result) {
        this.isWorking(false);
        this.empty();
        if (error) {
          return this.displayError(error);
        }
        return this.displayResult(result.slice(0, UI.maximum));
      }, this));
    };
    UI.prototype.hide = function() {
      this.fuzzyOpen.stop();
      this.queryElement.value = '';
      this.toggle(false);
      this.isWorking(false);
      return this.empty();
    };
    UI.prototype.toggle = function(visible) {
      var _i, _len, _ref, _result, element;
      this.resultsElement.setAttribute('collapsed', !visible);
      _result = [];
      for (_i = 0, _len = (_ref = this.hideElements).length; _i < _len; _i++) {
        element = _ref[_i];
        _result.push(element.setAttribute('collapsed', visible));
      }
      return _result;
    };
    UI.prototype.isWorking = function(flag) {
      var className;
      className = 'fuzzyopen-working';
      return flag ? (this.workingElement.className = ("" + (this.workingElement.className || '') + " " + className).trimLeft()) : (this.workingElement.className = (this.workingElement.className || '').replace(RegExp("\\s*" + className + "\\b"), ''));
    };
    UI.prototype.empty = function() {
      var _result, first;
      _result = [];
      while (first = this.resultsElement.childNodes[0]) {
        _result.push(this.resultsElement.removeChild(first));
      }
      return _result;
    };
    UI.prototype.displayError = function(error) {
      var message;
      message = $new('div', {
        className: 'exception'
      });
      message.innerHTML = ("<h2><span>" + (strings.GetStringFromName('uncaughtError')) + "</span></h2><pre><code></code></pre>");
      message.getElementsByTagName('code')[0].appendChild(document.createTextNode(error.message));
      return this.resultsElement.appendChild(message);
    };
    UI.prototype.displayResult = function(files) {
      var _i, _len, _len2, _result, baseName, dirName, escape, extension, file, html, i, list, part;
      if (!files.length) {
        return;
      }
      escape = function(string) {
        return string.replace(/&/g, '&amp;');
      };
      list = $new('ol', {
        id: 'fuzzyopen-list'
      });
      html = '';
      for (i = 0, _len = files.length; i < _len; i++) {
        file = files[i];
        extension = file.indexOf('.') < 0 ? '' : file.split('.').pop();
        if (extension.length > 7) {
          extension = extension.substring(0, 7) + '…';
        }
        dirName = file.split('/');
        baseName = dirName.pop();
        html += ("<li" + (i === 0 ? ' class="selected"' : '') + ">\n  <div class=\"extension\"><strong>" + (escape(extension)) + "</strong></div>\n  <div class=\"file\">\n    <div class=\"name\"><span class=\"icon\" />" + (escape(baseName)) + "</div>\n    <div class=\"path\"><span class=\"directory\">" + ((function() {
          _result = [];
          for (_i = 0, _len2 = dirName.length; _i < _len2; _i++) {
            part = dirName[_i];
            _result.push(escape(part));
          }
          return _result;
        })().join('</span><span class="separator">→<wbr /></span><span class="directory">')) + "</span></div>\n  </div>\n</li>");
      }
      list.innerHTML = html;
      return this.resultsElement.appendChild(list);
    };
    UI.toggleLeftPane = function(event) {
      var command;
      ko.commands.doCommandAsync(command = 'cmd_viewLeftPane', event);
      return $sleep(125, __bind(function() {
        var box, element;
        element = $element(command);
        if (!element) {
          return;
        }
        box = $element(element.getAttribute('box'));
        if (!box) {
          return;
        }
        if (box.getAttribute('collapsed') === 'true') {
          return UI.top.hide();
        } else {
          if (UI.top.queryElement.value.length) {
            UI.top.hide();
          }
          return UI.top.queryElement.focus();
        }
      }, this));
    };
    return UI;
  }).call(this);
}).call(this);
