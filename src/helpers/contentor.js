'use strict';

var markdownConvert = require('marked');
var markyMark       = require('../helpers/marky-mark');
var imageStyles     = require('../helpers/image-styles');
var ampify          = require('../helpers/ampify')();

var contentor = function(markdown, config) {
  var internal = {};
  var external = {};

    /**
   * Convert Markdown into some proper HTML.
   * @param  {String} markdown [description]
   * @param  {String} relUrl   [description]
   * @return {String}          [description]
   */
  internal.convertMarkdown = function(markdown, relUrl) {
    var html = markyMark(markdownConvert(markdown), {language: config.locale.language}).toString();
    if (relUrl) {
      html = html.replace(/(<img[^>]+src=")([^:"]+?")/g, '$1'+relUrl+'$2');
    }
    return imageStyles(config)
      .replaceImgHtml(html)
      .replace(/(href=")([a-zA-Z0-9\-]+)\.md(")/g, '$1' + config.basePath + config.htdocs.posts + '/$2/$3')
    ;
  };

  /**
   * [removeMarkdown description]
   * @param  {String} markdown [description]
   * @return {String}          [description]
   */
  internal.removeMarkdown = function(markdown) {
    return markdown
      .replace(/>/g, ' ')
      .replace(/!?\[([^\]]*)\]\(.+?\)/g, '$1')
      .replace(/[ ][ ]+/g, ' ')
      .replace(/http(s)?:\S+/g, '')
    ;
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

  external = {
    markdown: markdown,
    html: internal.convertMarkdown(markdown),
    plain: internal.removeMarkdown(markdown)
  };

  // Add extra stuff
  if (config.specialFeatures.jsonrss || config.specialFeatures.atom || config.specialFeatures.rss || config.specialFeatures.kml) {
    external.safeHtml = internal.makeSafeHtml(external.html);
  }
  if (config.specialFeatures.acceleratedmobilepages) {
    external.ampHtml = ampify.ampifyHtml(external.html);
  }

  return external;
};

module.exports = contentor;
