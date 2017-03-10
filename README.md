![](docs/blogophon.png) Blogophon
=========

A [Static Site Generator](https://davidwalsh.name/introduction-static-site-generators) supporting [Markdown](docs/markdown.md), [responsive images](docs/markdown.md#images), [RSS and other RESTful files](docs/special-features.md). Built with Node.js and minimal dependencies.

A live example of this blog generator can be found at [3960! Journal](http://journal.3960.org).

**Features**

* The Blogophon generates static HTML files from [Markdown articles](docs/markdown.md). These HTML files can be synchronized to remote servers and are fully independent of the Blogophon generator.
* It uses simple, fast and [hackable templating](docs/theming.md) via Mustache. It also supports multiple themes.
* Generates a bunch of way to find your articles: Regular index pages, tag pages, author pages.
* The Blogophon comes with a built-in image-scaler, which leads to responsive images.
* The default theme puts all relevant meta stuff into `<head>` for SEO and social sharing (via schema.org and OpenGraph).
* A ton of [special features](docs/special-features.md) like RSS/ATOM newsfeeds, Accelerated Mobile Pages (AMP), Facebook Instant Articles, etc.

Requirements
------------

Your _blog pages_ can be hosted on any web hosting service - it only consists of static files. You will need no PHP, MySQL or anything like that.

The Blogophon _generator_ works on every platform with [NodeJs](https://nodejs.org/en/). This includes Windows, Mac OSX and Linux. The Blogophon can also be installed directly on your web host, as long as you have [NodeJs](https://nodejs.org/en/) installed on your web host and SSH access.

Installation
------------

1. Make sure you have [Node.js](https://nodejs.org/) installed by calling `node -v`.
1. Make sure you have [ImageMagick](http://www.imagemagick.org/) installed by calling `magick -help`. ImageMagick is needed for scaling images.
1. Run `npm install -g blogophon` to install the Blogophon on your computer.
1. Change to a folder you want to initialize the Blogophon in.
1. Run `blogophon` to start the configuration dialog and enable [special features](docs/special-features.md).
1. Set your web server's document root folder to `htdocs` of this project (as there will be the HTML files generated by the Blogophon Generator).

How it works
------------

Just call `blogophon` to open the Blogophon command menu in the folder you are in. There you will be able to create, edit, generate and publish Markdown articles.

The basic work-flow is this:

1. Create a Markdown article (see [Blogophon's Markdown reference](docs/markdown.md) on details).
2. Generate HTML files from your Markdown article via the Blogophon generator.
3. Optional: Publish your HTML files to a remote server.

![The main menu in action.](docs/example.png)

If you are a CLI wizard, you may also want to take a look at [Blogophon's special CLI features](docs/advanced-stuff.md).

Status
-------

[![npm version](https://badge.fury.io/js/blogophon.svg)](https://badge.fury.io/js/blogophon)
[![Build Status](https://travis-ci.org/fboes/blogophon.svg?branch=master)](https://travis-ci.org/fboes/blogophon)
[![Dependency Status](https://david-dm.org/fboes/blogophon/status.svg)](https://david-dm.org/fboes/blogophon)
[![devDependency Status](https://david-dm.org/fboes/blogophon/dev-status.svg)](https://david-dm.org/fboes/blogophon?type=dev)

Legal stuff
-----------

Author: [Frank Boës](http://3960.org)

Copyright & license: See [LICENSE.txt](LICENSE.txt)
