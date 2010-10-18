threshold = 16

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

@onmessage = (event) ->
  files  = event.data.split '|'
  query  = files.shift()
  result = {}
  done = () ->
    temp = file for key, file of result
    temp.sort (prev, next) ->
      return -1 if prev.score > next.score
      return  1 if prev.score < next.score
      return naturalCompare prev.file, next.file
    files = file.file for file in temp
    postMessage files.join '|'
  descend = (parts, file, remaining, score) ->
    first = parts[0]
    if first in ['/', '_', '-', '.'] and parts.length > 1
      pending ++
      descend [first + parts[1]].concat(parts.slice(2)), file, remaining, score
    loop
      position = remaining.indexOf first
      break if position < 0
      remaining = remaining.substring position + 1
      break if remaining.length < parts.length - 1
      score += Math.pow threshold - position, first.length + 1 if position < threshold
      if parts.length is 1
        score -= remaining.length
        key    = "/#{file}"
        result[key] = { file, score } if key not of result or result[key].score < score
      else
        pending ++
        descend parts.slice(1), file, remaining, score
    pending --
    done() if pending is 0
  pending = files.length
  parts   = query.split ''
  descend parts, file, file, 0 for file in files
