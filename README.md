Quickly locate and open files using fuzzy matching:

![Preview](http://i.imgur.com/RrGqi.png)

How to Install (alpha)
======================

Follow the [Firefox extension proxy file](https://developer.mozilla.org/en/Setting_up_extension_development_environment#Firefox_extension_proxy_file)
instructions. You can find your XRE/extensions directory path [in the docs](http://docs.activestate.com/komodo/5.0/trouble.html#appdata_dir).

Extension ID: `fuzzyopen@psp-webtech.co.uk`

**Platforms supported**: Windows  (XP, Vista, 7), Linux (Fedora)

What is working?
================

* Semi-large projects are supported (up to 10, 000 files)
* New command `User Interface: Show/Hide Left Pane & Focus Search`
* Displaying results from fuzzy search under Places
* Keyboard navigation using Up/Down arrows and Enter

What is not implemented?
========================

* Unix support on some distributions..
  - should be easy enough if `ls` behaves consistently across distros
  - Fast Open is another good place to look at for multi-platform directory traversal
