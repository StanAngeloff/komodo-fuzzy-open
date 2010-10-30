if exports?
  @postMessage = (result) -> result
else
  @exports     = this
  @postMessage = postMessage

exports.onmessage = (event) ->
  excludes = event.data.excludes.split ';'
  tests    = (///
    (?:^|\/)
    #{ pattern.trim()
              .replace(/[-[\]{}()+.,\\^$|#\s]/g, '\\$&')
              .replace(/\?/g, '.')
              .replace(/\*/g, '.*') }
    (?:\/|$)
  /// for pattern in excludes)
  result = []
  for file in event.data.files
    pass = yes
    for test in tests when test.exec file
      pass = no
      break
    result.push file if pass
  @postMessage result
