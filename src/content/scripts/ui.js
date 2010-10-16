(function() {
  var $element, $on, $sleep, UI;
  var __bind = function(func, context) {
    return function() { return func.apply(context, arguments); };
  };
  if (!(typeof extensions !== "undefined" && extensions !== null)) {
    this.extensions = {};
  }
  if (!(extensions.fuzzyopen != null)) {
    this.extensions.fuzzyopen = {};
  }
  $element = function(id) {
    return document.getElementById(id);
  };
  $on = function(element, event, block) {
    return element.addEventListener(event, block, false);
  };
  $sleep = function(interval, resume) {
    return setTimeout(resume, interval);
  };
  this.extensions.fuzzyopen.ui = (function() {
    UI = (function() {
      function UI(queryId, resultsId, hideList) {
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
        if (hideList) {
          this.hideElements = (function() {
            _result = [];
            for (_i = 0, _len = hideList.length; _i < _len; _i++) {
              id = hideList[_i];
              _result.push($element(id));
            }
            return _result;
          })();
        }
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
    UI.prototype.addEvents = function() {
      $on(this.queryElement, 'command', __bind(function() {
        var value;
        value = this.queryElement.value.trim();
        return value.length ? this.open(value) : this.hide();
      }, this));
      return $on(this.fuzzyOpen, 'loading', __bind(function() {}, this));
    };
    UI.prototype.update = function(places) {
      this.queryElement.value = '';
      this.hide();
      this.path = places.manager.currentPlace;
      return this.path && places.manager.currentPlaceIsLocal ? this.queryElement.removeAttribute('disabled') : this.queryElement.setAttribute('disabled', 'true');
    };
    UI.prototype.open = function(value) {
      return this.fuzzyOpen.find(value, this.path);
    };
    UI.prototype.hide = function() {};
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
            UI.top.queryElement.value = '';
            UI.top.hide();
          }
          return UI.top.queryElement.focus();
        }
      }, this));
    };
    return UI;
  }).call(this);
}).call(this);
