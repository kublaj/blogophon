Blogophon
=========

[![Dependency Status](https://david-dm.org/fboes/blogophon/status.svg)](https://david-dm.org/fboes/blogophon)
[![devDependency Status](https://david-dm.org/fboes/blogophon/dev-status.svg)](https://david-dm.org/fboes/blogophon?type=dev)

A small and simple Static Site Generator for blogs.

Features
--------

* Generate HTML-Files from Markdown.
* Templating via Mustache.
* Generate teaser page(s).
* Generate tag page(s).
* Will scale images.
* Puts all relevant meta stuff into `<head>`.

Installation
------------

1. Run `npm install` to install all dependencies.
1. Create the `user/config.json` from `user/_config.json` and fill out the necessary variables.
1. Optional: Change the template files in `theme`.

How it works
------------

1. Start Gulp watcher via `gulp watch`.
1. Create new Markdown file in `user/posts` (e.g. by using [`./new-page.js`](new-page.js)). Do not use any other characters for the filename but letters, numbers, dashes and dots.
1. Optional: Create images in a folder having the same name as the Markdow file you just created.
1. Gulp will automatically create all HTML files.
1. Optional: Use `rsync` to move your HTML files to any remote server you like.

If you want to completly delete an article, run [`./delete-page.js`](delete-page.js). This will delete all HTML- and Markdown files as well as any images associated with the selected article.

Todos
-----

* <picture>

Version
-------

Version: 0.0.4 (2016-08-08)

Legal stuff
-----------

Author: [Frank Boës](http://3960.org)

Copyright & license: See [LICENSE.txt](LICENSE.txt)
