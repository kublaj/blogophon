'use strict';

/**
 * Returns RSS as a javascript object.
 * @constructor
 * @param  {Object} post [description]
 * @return {Object}      [description]
 */
var appleNewsFormat = function(post) {
  return {
    version: 1.2,
    identifier: post.meta.AbsoluteUrl,
    title: post.title.plain,
    language: post.meta.Language.replace(/\-/, '_'),
    layout: {
      columns: 7,
      width: 1024
    },
    components: [
      {
        role: 'body',
        text: post.body ? post.body.markdown : ''
      }
    ],
    componentTextStyles: {
      default: {
        fontName: "Helvetica",
        fontSize: 13,
        linkStyle: {
          textColor: "#428bca"
        }
      }
    },
    metadata: {
      canonicalURL: post.meta.AbsoluteUrl,
      datePublished: post.meta.Created.iso,
      excerpt: post.description ? post.description.markdown || post.meta.Description : '',
      keywords: post.meta.Keywords.trim().split(/,\s*/)
    }
  };
};

module.exports = appleNewsFormat;
