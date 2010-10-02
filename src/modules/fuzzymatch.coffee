chunkify = (string) ->
  string
    .replace(/(\d+)/g, '\u0000$1\u0000')
    .replace(/^\u0000|\u0000$/g, '')
    .split('\u0000')
    .map (chunk) -> if isNaN number = parseInt chunk, 10 then chunk else number

naturalCompare = (prev, next) ->
  prev = chunkify ('' + prev).toLowerCase()
  next = chunkify ('' + next).toLowerCase()
  for i in [0...Math.max prev.length, next.length]
    return -1 if i >= prev.length
    return  1 if i >= next.length
    return -1 if prev[i] < next[i]
    return  1 if prev[i] > next[i]
  return 0


class FuzzyMatch

  @threshold: 16

  constructor: (@files) ->
    @files or= []

  find: (query) ->
    # TODO: '_' and '/' should be groupped so 'i/m/p/c_s' should be matched as:
    # 'i', '/m', '/p', '/c', '_s'
    # This should scope higher, while still keeping char-by-char matches
    query  = @normalize query
    result = { file, score } for file in @files when score = @match query, @normalize file
    result.sort (prev, next) ->
      return -1 if prev.score > next.score
      return  1 if prev.score < next.score
      return naturalCompare prev.file, next.file
    match.file for match in result

  match: (query, file) ->
    offset = 0
    score  = 0
    i      = 0
    while i < query.length
      position = file.substring(offset).indexOf query.charAt i
      return false if position < 0 || position > FuzzyMatch.threshold
      offset += position + 1
      score  += Math.pow FuzzyMatch.threshold - position, 2
      i ++
    score -= file.length - offset
    score

  normalize: (path) -> path.replace /\\/g, '/'


EXPORTED_SYMBOLS = ['FuzzyMatch']
