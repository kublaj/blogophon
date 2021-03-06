'use strict';

/**
 * Returns RSS as a javascript object.
 * @constructor
 * @param  {Array}  index   [description]
 * @param  {String} pubDate [description]
 * @param  {Object} config  [description]
 * @param  {String} title   [description]
 * @param  {String} feedUrl [description]
 * @return {Object}         [description]
 */
const jsonFeed = function(index, pubDate, config, title, feedUrl) {
  return {
    version: "https://jsonfeed.org/version/1",
    title: (config.name || '') + (title ? ' | ' + title : ''),
    home_page_url: config.baseUrl + config.basePath,
    feed_url: feedUrl || null,
    description: config.description || '',
    icon: config.themeConf.ogImage,
    author: {
      name: config.defaultAuthor.name,
      url: 'mailto:' + config.defaultAuthor.email
    },
    _language: {
      about: "https://github.com/brentsimmons/JSONFeed/issues/40",
      language: config.locale.language
    },
    items: index.map(function(post){
      let returnPost = {
        id: post.meta.Id || post.meta.AbsoluteUrl,
        url: post.meta.AbsoluteUrl,
        title: post.meta.Title,
        content_html: post.safeHtml || post.html,
        summary: post.meta.Description,
        date_published: post.meta.Created.iso, // ISO 8601
        date_modified: post.meta.Modified.iso, // ISO 8601
        author: {
          name: post.meta.AuthorName,
          url: 'mailto:' + post.meta.AuthorEmail,
          avatar: post.meta.AuthorImage
        },
        banner_image: post.meta.Image,
        _language: {
          about: "https://github.com/brentsimmons/JSONFeed/issues/40",
          language: post.meta.Language || config.locale.language
        }
      };

      if (post.meta.Image) {
        returnPost.image = post.meta.Image;
      }

      if (post.meta.AbsoluteLink && post.meta.AbsoluteLink !== post.meta.AbsoluteUrl) {
        returnPost.external_url = post.meta.AbsoluteLink;
      }

      if (post.meta.Tags) {
        returnPost.tags = post.meta.Tags.map(function(t){
          return t.title;
        });
      }

      if (post.meta.Latitude || post.meta.Longitude) {
        returnPost._geo = {
          type: 'Point',
          coordinates: [post.meta.Longitude, post.meta.Latitude]
        };
      }

      return returnPost;
    })
  };
};

module.exports = jsonFeed;
