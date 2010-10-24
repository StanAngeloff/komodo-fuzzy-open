threshold = 16

@onmessage = (event) ->
  result = {}
  done   = ->
    files   = []
    for key, hits of result
      file = []
      for hit in hits
        groups = []
        for i from 0 to (length = hit.groups.length) - 1
          j = i
          i++ while i < length - 1 and hit.groups[i][1] is hit.groups[i + 1][0]
          groups.push [hit.groups[j][0], hit.groups[i][1]]
        score = [0, 0]
        for group in groups when 0 < group[1] - group[0] < threshold * 2
          score[0] += Math.pow 2, group[1] - group[0]
        for i from 0 to groups.length - 2
          score[1] += groups[i + 1][0] - groups[i][1]
        file.push { file: hit.file, score, groups }
      file.sort (prev, next) ->
        return -1 if prev.score[0] > next.score[0]
        return  1 if prev.score[0] < next.score[0]
        return -1 if prev.score[1] < next.score[1]
        return  1 if prev.score[1] > next.score[1]
        return  0
      files.push file[0]
    postMessage files
  descend = (parts, file, remaining, offset, groups) ->
    remaining or= file
    offset    or= 0
    groups    or= []
    first       = parts[0]
    if ['/', '_', '-', '.'].indexOf(first) >= 0 and parts.length > 1
      pending++
      descend [first + parts[1]].concat(parts.slice 2), file, remaining, offset, groups
    ignoreCase = first isnt first.toUpperCase()
    loop
      before    = remaining
      position  = if ignoreCase then remaining.toLowerCase().indexOf first else remaining.indexOf first
      break if position < 0
      remaining = remaining.substring advance = position + first.length
      break if remaining.length < parts.length - 1
      offset   += advance
      groups.push [offset - first.length, offset]
      if parts.length is 1
        key = "/#{file}"
        result[key] = [] if key not of result
        result[key].push offset: offset, groups: Array::slice.call(groups), file
      else
        pending++
        descend parts.slice(1), file, remaining, offset, groups
      groups.pop()
    pending--
    done() if pending is 0
  pending = event.data.files.length
  parts   = event.data.query.split ''
  descend parts, file for file in event.data.files
