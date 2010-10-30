assert = require 'assert'
fs     = require 'fs'
module = require '../src/modules/exclude'

start = new Date().getTime()

result = module.onmessage data:
  excludes: '*.pyc;.sass-cache;.svn;desktop.ini'
  files: [
    '.pyc',
    'file.py'
    'file.pyc'
    'file.pycc'
    '.sass-cache/file.cache'
    '.svn/file.svn'
    'desktop.ini'
    'file'
  ]

assert.deepEqual result, ['file.py', 'file.pycc', 'file']

sampleSize     = 10
sampleTime     = []
cachedListings = {}
for i from 0 to sampleSize - 1
  sampleTime[i] = 0
  for name in ['zen_cart', 'typo3', 'joomla+svn']
    cachedListings[name] = fs.readFileSync("#{__dirname}/fixtures/#{name}.listing", 'utf-8').split '\n' unless name of cachedListings
    waypoint = new Date().getTime()
    result  = module.onmessage data:
      excludes: '*.pyc;*.pyo;*.gz;*.exe;*.obj;.DS_Store;.svn;_svn;.git;CVS;.hg;.bzr'
      files:    cachedListings[name]
    sampleTime[i] = sampleTime[i] + (new Date().getTime() - waypoint)
executionTime = 0
executionTime = executionTime + time for time in sampleTime
executionTime = executionTime / sampleSize

assert.ok executionTime < allowed = 100, "failed to process all fixtures within the allowed time (#{executionTime}ms > #{allowed}ms)."

console.log "Finished in #{ new Date().getTime() - start }ms\n  fixtures: #{executionTime}ms"
