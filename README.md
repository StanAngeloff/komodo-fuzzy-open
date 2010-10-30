Quickly locate and open files using fuzzy matching:

![Preview](http://i.imgur.com/RrGqi.png)

How to Install (alpha)
======================

Follow the [Firefox extension proxy file](https://developer.mozilla.org/en/Setting_up_extension_development_environment#Firefox_extension_proxy_file)
instructions. You can find your XRE/extensions directory path [in the docs](http://docs.activestate.com/komodo/5.0/trouble.html#appdata_dir).

Extension ID: `fuzzyopen@psp-webtech.co.uk`

**Platforms supported**: Windows and most *nixes where `find` is available.

What is working?
================

* Semi-large projects are supported (up to 10, 000 files)
* New command `User Interface: Show/Hide Left Pane & Focus Search`
* Displaying results from fuzzy search under Places
* Keyboard navigation using Up/Down arrows and Enter

What is not implemented?
========================

* Indexing
* Better and faster scoring of results
* Reloading from the filesystem (new files not picked up until app is restarted)
