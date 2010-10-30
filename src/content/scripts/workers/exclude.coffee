@onmessage = (event) ->
  result = []
  tests  = (///
    (?:^|\/)
    #{ pattern.trim()
              .replace(/[-[\]{}()+.,\\^$|#\s]/g, '\\$&')
              .replace(/\?/g, '.')
              .replace(/\*/g, '.*') }
    (?:\/|$)
  /// for pattern in event.data.excludes.split ';')
  for file in event.data.files
    pass = yes
    for test in tests when test.exec file
      pass = no
      break
    result.push file if pass
  postMessage result
