var __bind = function(func, context) {
  return function() { return func.apply(context, arguments); };
};
(function() {
  this.ui || (this.ui = {});
  this.ui.start = __bind(function(query, results) {
    if (ko.places.manager.currentPlaceIsLocal) {
      query.removeAttribute('disabled');
    } else {
      query.setAttribute('disabled', true);
    }
    this.update(ko.places.manager.currentPlace);
    return query.getAttribute('fuzzyopen-initialized') !== 'true' ? this.ui.addEvents(query) : undefined;
  }, this);
  this.ui.addEvents = function(element) {
    element.setAttribute('fuzzyopen-initialized', 'true');
    return alert('Adding events...');
  };
  return this;
}).call(extensions.fuzzyopen);