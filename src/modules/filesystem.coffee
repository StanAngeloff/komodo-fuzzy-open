`const Cc = Components.classes`
`const Ci = Components.interfaces`
`const Cr = Components.results`


class Directory

  constructor: (@path) ->
    @base  = @path
    @files = []
    @scan()

  scan: ->
    try
      directory = Cc['@mozilla.org/file/local;1'].createInstance Ci.nsILocalFile
      directory.initWithPath @path
      iterator = directory.directoryEntries
      while iterator.hasMoreElements()
        current = iterator.getNext().QueryInterface Ci.nsIFile
        continue if current.isHidden() or not current.isReadable()
        if current.isFile()
          @files.push @normalize current.path
        else if current.isDirectory()
          prevPath = @path
          @path    = current.path
          @scan()
          @path    = prevPath
    catch error
      unwrap = new Error
      unwrap.message = error.message
      unwrap.result  = error.result
      unwrap.path    = @path
      throw unwrap
    finally
      directory = null
    this

  normalize: (path) -> path.substring @base.length


EXPORTED_SYMBOLS = ['Directory']
