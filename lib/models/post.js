'use strict';

const markdownConvert = require('8fold-marked');
const crypto          = require('crypto');
const SuperString     = require('../helpers/super-string');
const markyMark       = require('../helpers/marky-mark');
const ampify          = require('../helpers/ampify')();
const postUrl         = require('../helpers/post-url');
const tagUrl          = require('../helpers/tag-url');
const categoryUrl     = require('../helpers/category-url');
const authorUrl       = require('../helpers/author-url');
const shareLinks      = require('../helpers/share-links');
const blogophonDate   = require('../models/blogophon-date');
const imageStyles     = require('../helpers/image-styles');
const removeMarkdown  = require('remove-markdown');

/**
 * This class holds Markdown and converts it into a proper post.
 * @constructor
 * @param {String} filename [description]
 * @param {String} markdown [description]
 * @param {Object} meta     [description]
 * @param {Object} config   [description]
 */
const Post = function(filename, markdown, meta, config) {
  config = config || require('../config');
  const external = {};
  const internal = {};

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
    if (!meta.Description) {
      meta.Description = markdown;
    }
    if (!meta.DateModified) {
      meta.DateModified = meta.Date;
    }
    if (!meta.Language) {
      meta.Language = config.locale.language;
    }
    meta.isMicropost = (meta.Classes && /Micro post/.test(meta.Classes)) || false;

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
    if (meta.Category) {
      const categoryUrlObj = categoryUrl(meta.Category, config.htdocs.category);
      meta.CategoryObj = {
        title: meta.Category,
        id: SuperString(meta.Category).asciify(),
        url: categoryUrlObj.relativeUrl(),
        urlObj: categoryUrlObj
      };
    }

    let path = config.htdocs.posts;
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
        case 'Category':
          if (meta.CategoryObj) {
            path = meta.CategoryObj.urlObj.relativeDirname();
          }
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

    external.htmlTeaser   = internal.markyMark(meta.Description.trim(), meta.Url);
    external.html         = internal.markyMark(markdown, meta.Url);

    if (!meta.Title) {
      meta.Title = markdown.split(/\n/)[0];
    }
    meta.MarkdownTitle = meta.Title;
    meta.Title = SuperString(internal.removeMarkdown(meta.Title)).niceShorten(320);

    if (meta.Keywords || meta.Tags) {
      meta.Keywords = (meta.Tags && !meta.Keywords)
        ? internal.listToArray(meta.Tags)
        : internal.listToArray(meta.Keywords)
      ;
      meta.Tags = meta.Keywords.map(function(tag){
        let tagUrlObj = tagUrl(tag, config.htdocs.tag);
        return {
          title: tag,
          id: SuperString(tag).asciify(),
          url: tagUrlObj.relativeUrl(),
          urlObj: tagUrlObj
        };
      });
    }
    if (!meta.Classes) {
      meta.Classes = ['Normal article'];
    }
    meta.Classes = internal.listToArray(meta.Classes);
    meta.Classes = meta.Classes.map(function(c) {
      return SuperString(c).asciify();
    });
    if (meta.Classes.indexOf('images') >= 0) {
      external.htmlTeaser   = internal.galleryHtml(external.htmlTeaser);
      external.html         = internal.galleryHtml(external.html);
    }
    // else if (meta.Classes.indexOf('recipe') >= 0) {
    //  external.html         = internal.recipeHtml(external.html);
    //}
    if (meta.Description) {
      meta.MarkdownDescription = meta.Description;
      meta.Description = SuperString(internal.removeMarkdown(meta.Description)).niceShorten(320);
    }
    if (!meta.Author) {
      meta.Author = config.defaultAuthor.name + ' <' + config.defaultAuthor.email + '>';
    }
    let metaAuthor = meta.Author.match(/^(.+?)(?:\s<(.+)>)?$/);
    if (metaAuthor) {
      meta.AuthorName   = metaAuthor[1];
      meta.AuthorEmail  = metaAuthor[2] ? metaAuthor[2].trim() : config.defaultAuthor.email;
      meta.AuthorImage  = 'https://www.gravatar.com/avatar/' + crypto.createHash('md5').update(meta.AuthorEmail.toLowerCase()).digest('hex');
    }
    meta.authorUrlObj = authorUrl(meta.AuthorName, config.htdocs.author);
    if (!meta.Image) {
      let match = external.html.match(/<(?:!-- )?img.+?src="(.+?)"/);
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
    if (!meta.Twitter) {
      meta.Twitter = meta.Title;
    } else {
      meta.Twitter = meta.Twitter.replace(/\\(#)/g, '$1');
    }
    if (meta.Rating) {
      let match2 = meta.Rating.match(/^(\d)\/(\d)$/);
      if (match2) {
        meta.RatingObj = {
          worst: 1,
          best: match2[2],
          value: match2[1]
        };
      }
    }

    external.filename       = filename;
    external.markdown       = markdown;
    external.meta           = meta;
    external.share          = shareLinks( meta.Title, meta.AbsoluteUrl, meta.Twitter, config.name);
    external.hash           = crypto.createHash('md5').update(JSON.stringify([
      external.markdown,
      external.share,
      external.meta,
      external.html,
      external.htmlTeaser
    ])).digest('hex');

    // Add extra stuff
    if (config.specialFeatures.jsonrss || config.specialFeatures.atom || config.specialFeatures.rss || config.specialFeatures.kml) {
      external.safeHtml       = internal.makeSafeHtml(external.html);
      external.safeHtmlTeaser = internal.makeSafeHtml(external.htmlTeaser);
    }
    if (config.specialFeatures.acceleratedmobilepages) {
      external.ampHtml        = ampify.ampifyHtml(external.html);
      external.ampHtmlTeaser  = ampify.ampifyHtml(external.htmlTeaser);
      external.ampProperties       = ampify.ampifyProperties(external.ampHtml);
      external.ampPropertiesTeaser = ampify.ampifyProperties(external.ampHtmlTeaser);
    }

    return external;
  };

  /**
   * Convert Markdown into some proper HTML.
   * @param  {String} markdown [description]
   * @param  {String} relUrl   [description]
   * @return {String}          [description]
   */
  internal.markyMark = function(markdown, relUrl) {
    let html = markyMark(markdownConvert(markdown), {language: config.locale.language}).toString();
    if (relUrl) {
      html = html.replace(/(<img[^>]+src=")([^:"]+?")/g, '$1'+relUrl+'$2');
    }
    return imageStyles(config)
      .replaceImgHtml(html)
      .replace(/(href=")([a-zA-Z0-9-]+)\.md(")/g, '$1' + config.basePath + config.htdocs.posts + '/$2/$3')
    ;
  };

  /**
   * Remove Markdown from String
   * @param  {String} markdown [description]
   * @return {String}          [description]
   */
  internal.removeMarkdown = function(markdown) {
    return removeMarkdown(markdown);
  };

  /**
   * [galleryHtml description]
   * @param  {String} html [description]
   * @return {String}      [description]
   */
  internal.galleryHtml = function(html) {
    return html
      .replace(/<p>(\s*(?:<img[^>]+>\s*){2,})<\/p>/g, function(all, content) {
        let count = content.match(/<img/g).length;
        content = content.replace(/(<img.+?>)/g, '  <div class="gallery__slide">$1</div>'+"\n");
        return '<div class="gallery gallery--' + count + '" data-gallery-count="' + count + '">' + "\n" + content + '</div>';
      })
      .replace(/(<img[^>]+src="([^"]+)(?:-\d+x\d+)(\.(?:jpg|png|gif))"[^>]*>)/g, '<a href="$2$3" class="gallery__link">$1</a>')
      .replace(/(<a[^>]+)(><img[^>]+alt=")(["]+?)(")/g, '$1 title="$3"$2$3$4')
    ;
  };

  /**
   * Add schema.org blocks for recipes
   * @param  {String} html [description]
   * @return {String}      [description]
   */
  internal.recipeHtml = function(html) {
    return html.replace(/^([\s\S]+?)(<ul>[\s\S]+?<\/ul>)([\s\S]+?)$/, function(all, description, ingredients, instructions) {
      return '<div itemprop="description">' + "\n"
        + description
        + '</div>' + "\n"
        + ingredients.replace(/(<li)/g, '$1 itemprop="recipeIngredient"') + "\n"
        + '<div itemprop="recipeInstructions">'
        + instructions + "\n"
        + '</div>'
      ;
    });
  };

  /**
   * Remove HTML parts which may be considered unsafe for syndication.
   * @param  {String} html [description]
   * @return {String}      [description]
   */
  internal.makeSafeHtml = function(html) {
    return html
      .replace(/((?:src|href)=")(\/)/g, '$1' + config.baseUrl +'$2')
      .replace(/ (data-\S+|sizes|srcset)="[^"]*"/g, '')
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
    let json = external;
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
    let singleImage;
    let allMarkdown = external.meta.MarkdownDescription + "\n" + markdown;
    let all = allMarkdown.match(/!\[.*?\]\(([^\s/]+?)(?:#(\S+))?\)/g) || [];
    return all.map(function(i) {
      singleImage = i.match(/!\[.*?\]\(([^\s/]+?)(?:#(\S+))?\)/);
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
    let styles = external.getAllImagesWithStyle();
    let returnObject = {};
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

  /**
   * Get all links to external ressources
   * @return {Array} [description]
   */
  external.getAllExternalLinks = function() {
    let search = /<a[^>]+href="(http[^"]+)"/g;
    let matched;
    let externalLinks = [];
    while ((matched = search.exec(external.html)) !== null) {
      externalLinks.push(matched[1]);
    }
    return externalLinks;
  };

  /**
   * Converts a comma-separated string into an array.
   * If the first argument is an array, this array will be returned unaltered.
   * @param  {String|Array} input [description]
   * @return {Array}              [description]
   */
  internal.listToArray = function(input) {
    return Array.isArray(input) ? input : input.trim().split(/,\s*/);
  };

  return external.makeMeta(filename, markdown, meta);
};

module.exports = Post;
