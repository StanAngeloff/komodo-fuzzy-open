@onmessage = (event) ->
  result   = []
  files    = event.data.split '|'
  excludes = files.shift().split ';'
  tests    = ///
    (?:^|\/|\\)
    #{ pattern.replace(/[-[\]{}()+.,\\^$|#\s]/g, '\\$&')
              .replace(/\?/g, '.')
              .replace(/\*/g, '.*') }
    (?:\\|\/|$)
  /// for pattern in excludes
  for file in files
    pass = yes
    for test in tests when test.exec file
      pass = no
      break
    result.push file if pass
  postMessage result.join '|'
