Blogophon
=========

[![Dependency Status](https://david-dm.org/fboes/blogophon/status.svg)](https://david-dm.org/fboes/blogophon)
[![devDependency Status](https://david-dm.org/fboes/blogophon/dev-status.svg)](https://david-dm.org/fboes/blogophon?type=dev)

A small and simple [Static Site Generator](https://davidwalsh.name/introduction-static-site-generators) for blogs. A live example of this blog can be fount at [3960! Journal](http://journal.3960.org).

**Features:**

* Generate static HTML files from Markdown files.
* Siple and fast templating via Mustache.
* Generate all required teaser pages.
* Generate all required tag pages.
* Scale images and remove unneccessary cruft.
* Puts all relevant meta stuff into `<head>` for SEO and social sharing.

Installation
------------

1. Clone this repository to your webserver.
1. Set your web server's document root folder to `htdocs` of this project (as there will be the HTML files generated by the Blogophon Generator).
1. Run `npm install` to install all dependencies.
1. Create the `user/config.json` from `user/_config.json` and fill out the necessary variables.
1. Optional: Change the template files in `theme`.

How it works
------------

Almost all stuff you will be doing with Blogophon is done via command line.

### Create a new article

1. Create a new Markdown file in `user/posts` by using [`./new-page.js`](new-page.js) or doing this manually.
1. Generate HTML files either automatically or manually (see below).

### Generate HTML files automatically

1. Start Gulp watcher via `gulp watch`.
1. Edit your Markdown file, e.g. via [`./edit.js`](edit.js). Gulp will automatically create all HTML files via the Blogophon Generator.

### Generate HTML files manually

1. Edit your Markdown file, e.g. via [`./edit.js`](edit.js).
1. Run [`./index.js`](index.js) to make the Blogophon Generator generate all HTML files.

`index.js` has some options:

* `--force`: Create _all_ articles anew, ignoring cached versions.
* `--deploy`:  Execute `deploy` command found in `user/config.json`.

### Using drafts

If you want to write an article without publishing it, you can append a `~` to your Markdown file. This will hide it from the Blogophon Generator. To publish it, simply remove `~` from your Makrdown filename and follow the generator process above.

### Delete articles

If you want to completly delete an article, run [`./delete-page.js`](delete-page.js). This will delete all HTML- and Markdown files as well as any images associated with the selected article.

Version
-------

Version: 0.0.4 (2016-08-08)

Legal stuff
-----------

Author: [Frank Boës](http://3960.org)

Copyright & license: See [LICENSE.txt](LICENSE.txt)
