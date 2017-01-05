'use strict';

/**
 * Returns RSS as a javascript object.
 * @constructor
 * @param  {Array}  index   [description]
 * @param  {String} pubDate [description]
 * @param  {Object} config  [description]
 * @param  {String} title   [description]
 * @return {Object}         [description]
 */
var jsonRss = function(index, pubDate, config, title) {
  return {
    version: "2.0",
    channel: {
      title: (config.name || '') + (title ? ' | ' + title : ''),
      link: config.baseUrl + config.basePath,
      description: config.description || '',
      language: config.language,
      lastBuildDate: pubDate.rfc,
      lastBuildDateTs: pubDate.timestamp,
      items: index.map(function(item){
        var returnItem = {
          title: item.title.plain,
          description: item.description ? item.description.safeHtml || item.description.plain : '',
          contentEncoded: item.body ? item.body.safeHtml || item.body.html : '',
          link: item.meta.AbsoluteLink || item.meta.AbsoluteUrl,
          pubDate: item.meta.Created.rfc,
          pubDateTs: item.meta.Created.timestamp,
          guid: item.meta.Id || item.meta.AbsoluteUrl
        };

        if (item.meta.Tags) {
          returnItem.categories = item.meta.Tags.map(function(t){
            return t.title;
          });
        }

        if (item.meta.Latitude || item.meta.Longitude) {
          returnItem.georssPoint = item.meta.Latitude +' '+ item.meta.Longitude;
        }

        return returnItem;
      })
    }
  };
};

module.exports = jsonRss;
