( ->

  @ui or= {}

  @ui.start = (query, results) =>
    if ko.places.manager.currentPlaceIsLocal
      query.removeAttribute 'disabled'
    else
      query.setAttribute 'disabled', true
    @update ko.places.manager.currentPlace
    @ui.addEvents query if query.getAttribute('fuzzyopen-initialized') isnt 'true'

  @ui.addEvents = (element) ->
    element.setAttribute 'fuzzyopen-initialized', 'true'
    alert 'Adding events...'

  this

).call extensions.fuzzyopen
