`const Cc = Components.classes`
`const Ci = Components.interfaces`
`const Cr = Components.results`


class Directory

  constructor: (@path, @parent) ->
    if @parent
      @base  = @parent.base
      @files = @parent.files
    else
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
          new Directory current.path, this
    catch error
      unwrap = new Error
      unwrap.message = error.message
      unwrap.result  = error.result
      unwrap.path    = @path
      throw unwrap
    this

  normalize: (path) -> path.substring @base.length


EXPORTED_SYMBOLS = ['Directory']
