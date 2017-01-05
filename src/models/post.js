'use strict';

var crypto          = require('crypto');
var contentor       = require('../helpers/contentor');
var SuperString     = require('../helpers/super-string');
var postUrl         = require('../helpers/post-url');
var tagUrl          = require('../helpers/tag-url');
var authorUrl       = require('../helpers/author-url');
var shareLinks      = require('../helpers/share-links');
var blogophonDate   = require('../models/blogophon-date');

/**
 * This class holds Markdown and converts it into a proper post.
 * @constructor
 * @param {String} filename [description]
 * @param {String} markdown [description]
 * @param {Object} meta     [description]
 * @param {Object} config   [description]
 */
var Post = function(filename, markdown, meta, config) {
  config = config || require('../config');
  var external = {};
  var internal = {};

  /**
   * Convert input data into final object
   * @param  {String} filename [description]
   * @param  {String} markdown [description]
   * @param  {Object} meta     [description]
   * @return {Post}            [description]
   */
  external.makeMeta = function(filename, markdown, meta) {
    if (!filename) {
      throw new Error('filename is empty');
    }
    if (!meta) {
      throw new Error('meta is empty in post '+filename);
    }
    if (!markdown) {
      throw new Error('markdown is empty in post '+filename);
    }
    if (!meta.Date) {
      throw new Error('meta.Date not supplied in post '+filename);
    }
    if (!meta.Title) {
      meta.Title = markdown.split(/\n/)[0];
    }
    if (!meta.Description) {
      meta.Description = markdown;
    }
    if (!meta.DateModified) {
      meta.DateModified = meta.Date;
    }
    if (!meta.Language) {
      meta.Language = config.locale.language;
    }

    if (!meta.Direction) {
      if (meta.Language === config.locale.Language) {
        meta.Direction = config.locale.direction;
      } else {
        meta.Direction = (meta.Language.match(/^(ar|zh|fa|he)/) ? 'rtl' : 'ltr');
      }
    }

    meta.isDefaultLanguage = (meta.Language === config.locale.language && meta.Direction === config.locale.direction);

    if (!meta.Id) {
      meta.Id = filename.replace(new RegExp('^' + process.cwd() + '/'), '');
    }

    meta.Created     = blogophonDate(meta.Date, meta.Language);
    meta.Modified    = blogophonDate(meta.DateModified, meta.Language);
    if (meta.Created.timestamp > meta.Modified.timestamp) {
      meta.Modified  = meta.Created;
    }

    var path = config.htdocs.posts;
    if (config.postPathMode){
      switch (config.postPathMode) {
        case 'Year':
          path = meta.Created.year;
          break;
        case 'Year/Month':
          path = meta.Created.year + '/' + meta.Created.month;
          break;
        case 'Year/Month/Day':
          path = meta.Created.year + '/' + meta.Created.month + '/' + meta.Created.day;
          break;
      }
    }

    meta.urlObj = postUrl(filename, path);
    if (meta.urlObj) {
      meta.Url = meta.urlObj.relativeUrl();
      meta.AbsoluteUrl = meta.urlObj.absoluteUrl();
      meta.Filename = meta.urlObj.filename();
      if (config.specialFeatures.acceleratedmobilepages) {
        meta.AbsoluteUrlAmp = meta.urlObj.absoluteUrl('amp');
      }
    }
    meta.hasExternalLink = (meta.Link && meta.Link !== meta.Url);
    meta.AbsoluteLink = meta.Link || meta.AbsoluteUrl;
    meta.Link = meta.Link || meta.Url;

    if (meta.Keywords) {
      meta.Tags = meta.Keywords.trim().split(/,\s*/).map(function(tag){
        var tagUrlObj = tagUrl(tag, config.htdocs.tag);
        return {
          title: tag,
          id: SuperString(tag).asciify(),
          url: tagUrlObj.relativeUrl(),
          urlObj: tagUrlObj
        };
      });
    }
    if (!meta.Classes) {
      meta.Classes = 'Normal article';
    }
    meta.Classes = meta.Classes.trim().split(/,\s*/).map(function(c) {
      return SuperString(c).asciify();
    });

    if (!meta.Author) {
      meta.Author = config.defaultAuthor.name + ' <' + config.defaultAuthor.email + '>';
    }
    var metaAuthor = meta.Author.match(/^(.+?)(?:\s<(.+)>)?$/);
    if (metaAuthor) {
      meta.AuthorName   = metaAuthor[1];
      meta.AuthorEmail  = metaAuthor[2] ? metaAuthor[2].trim() : config.defaultAuthor.email;
      meta.AuthorImage  = 'https://www.gravatar.com/avatar/' + crypto.createHash('md5').update(meta.AuthorEmail.toLowerCase()).digest('hex');
    }
    meta.authorUrlObj = authorUrl(meta.AuthorName, config.htdocs.author);
    if (!meta.Twitter) {
      meta.Twitter = meta.Title;
    } else {
      meta.Twitter = meta.Twitter.replace(/\\(#)/g, '$1');
    }
    if (meta.Rating) {
      var match2 = meta.Rating.match(/^(\d)\/(\d)$/);
      if (match2) {
        meta.RatingObj = {
          worst: 1,
          best: match2[2],
          value: match2[1]
        };
      }
    }

    external.filename       = filename;
    external.title          = contentor(meta.Title, meta.Url, config);
    external.description    = contentor(meta.Description, meta.Url, config);
    external.description.plain = SuperString(external.description.plain).niceShorten(320);
    external.body           = contentor(markdown, meta.Url, config);

    if (!meta.Image) {
      var match = external.body.html.match(/<(?:!\-\- )?img.+?src="(.+?)"/);
      if (match) {
        meta.Image = match[1];
      }
    }
    if (meta.Image) {
      meta.ProperImage = meta.Image;
    }
    if (!meta.Image && config.themeConf.ogImage) {
      meta.Image = config.themeConf.ogImage;
    }
    if (meta.Image && !meta.Image.match(/^http/)) {
      meta.Image = config.baseUrl + meta.Image;
    }
    if (meta.Classes.indexOf('images') >= 0) {
      external.description.html = internal.galleryHtml(external.description.html);
      external.body.html        = internal.galleryHtml(external.body.html);
    }

    external.meta           = meta;
    external.share          = shareLinks( meta.Title, meta.AbsoluteUrl, meta.Twitter, config.name);
    external.hash           = crypto.createHash('md5').update(JSON.stringify([
      external.body.markdown,
      external.share,
      external.meta,
      external.body.html,
      external.description.markdown
    ])).digest('hex');

    return external;
  };

  /**meta.Url,
   * [galleryHtml description]
   * @param  {String} html [description]
   * @return {String}      [description]
   */
  internal.galleryHtml = function(html) {
    return html
      .replace(/(<img[^>]+src="([^"]+)(?:\-\d+x\d+)(\.(?:jpg|png|gif))"[^>]*>)/g, '<a href="$2$3" class="image">$1</a>')
    ;
  };

  /**
   * [toString description]
   * @return {String} [description]
   */
  external.toString = function() {
    return external.hash;
  };

  /**
   * [toJSON description]
   * @return {Object} [description]
   */
  external.toJSON = function() {
    var json = external;
    if (json.next && json.next.Id) {
      json.next = json.next.urlObj.relativeUrl('index', 'json');
    }
    if (json.prev && json.prev.Id) {
      json.prev = json.prev.urlObj.relativeUrl('index', 'json');
    }
    return json;
  };

  /**
   * Get all images using image styles. This list may come in handy for the image resizer.
   * @return {Array} of {filename, style}
   */
  external.getAllImagesWithStyle = function() {
    var singleImage;
    var allMarkdown = external.title.markdown * "\n" + external.description.markdown + "\n" + external.body.markdown;
    var all = allMarkdown.match(/!\[.*?\]\(([^\s\/]+?)(?:#(\S+))?\)/g) || [];
    return all.map(function(i) {
      singleImage = i.match(/!\[.*?\]\(([^\s\/]+?)(?:#(\S+))?\)/);
      if (singleImage[2] && singleImage[2].match(/^\d+x\d+$/)) {
        singleImage[2] = null;
      }
      return {
        filename: singleImage[1] || null,
        style: singleImage[2] || null
      };
    });
  };

  external.getAllImagesWithStyleObject = function() {
    var styles = external.getAllImagesWithStyle();
    var returnObject = {};
    styles.forEach(function(s) {
      if (s.style) {
        if (!returnObject[s.filename]) {
          returnObject[s.filename] = [];
        }
        if (returnObject[s.filename].indexOf(s.style) === -1) {
          returnObject[s.filename].push(s.style);
        }
      }
    });
    return returnObject;
  };

  return external.makeMeta(filename, markdown, meta);
};

module.exports = Post;
