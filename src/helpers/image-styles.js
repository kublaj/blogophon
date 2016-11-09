'use strict';

var gm             = require('gm').subClass({imageMagick: true});
var Promise        = require('promise/lib/es6-extensions');

var imageStyles = function (config) {
  var external = {};
  var internal = {};

  internal.jpgQuality = 85;

  /**
   * Improve image without changing its dimensions.
   * @param  {String}  sourceFilename [description]
   * @param  {String}  targetFilename [description]
   * @return {Promise}                [description]
   */
  external.generateNoStyleImage = function(sourceFilename, targetFilename) {
    if (!targetFilename) {
      throw new Error('No target filename given for conversion');
    }
    return new Promise (
      function(resolve, reject) {
        gm(sourceFilename)
          .noProfile()
          .interlace('Line')
          .quality(internal.jpgQuality)
          .write(targetFilename,function (err) {
            if (err) {
              reject(err);
            }
            resolve( 1 );
          })
        ;
      }
    );
  };

  /**
   * Convert image to all different images sizes for a given style.
   * @param  {String}  sourceFilename [description]
   * @param  {String}  targetFilename [description]
   * @param  {String}  style          [description]
   * @return {Promise}                [description]
   */
  external.generateImagesFromStyle = function (sourceFilename, targetFilename, style) {
    if (!targetFilename) {
      throw new Error('No target filename given for conversion');
    }
    var styleData    = internal.getStyle(style);
    var processed    = 0;
    var maxProcessed = styleData.srcset.length;

    return new Promise (
      function(resolve, reject) {
        var checkProcessed = function(err) {
          if (err) {
            reject(err);
          }
          if (++processed === maxProcessed) {
            resolve( processed );
          }
        };

        styleData.srcset.forEach(function(currentSrcSet) {
          gm(sourceFilename)
            .noProfile()
            .geometry(currentSrcSet[0], currentSrcSet[1], "^")
            .gravity('Center')
            .crop(currentSrcSet[0], currentSrcSet[1])
            .unsharp(2, 0.5, 0.5, 0)
            .interlace('Line')
            .quality(internal.jpgQuality)
            .write(external.getFilenameSrcset(targetFilename, currentSrcSet), checkProcessed)
          ;
        });
      }
    );
  };

  /**
   * Cycle through all styles, generate all sizes for the given image.
   * @param  {String}  filename       [description]
   * @param  {String}  targetFilename [description]
   * @param  {Array }  allStyles      Optional, defaults to all styles
   * @return {Promise}                [description]
   */
  external.generateImagesWithStyles = function(sourceFilename, targetFilename, allStyles) {
    if (!targetFilename) {
      throw new Error('No target filename given for conversion');
    }
    allStyles = allStyles || Object.keys(config.themeConf.imageStyles);
    var processed = 0;

    return new Promise (
      function(resolve, reject) {
        var promises = allStyles.map(function(style) {
          return external.generateImagesFromStyle(sourceFilename, targetFilename, style);
        });
        Promise
          .all(promises)
          .then(function(generatedImages) {
            if (promises.length > 0) {
              generatedImages.forEach(function(generatedImage) {
                processed += generatedImage;
              });
            }
            return external.generateNoStyleImage(sourceFilename, targetFilename);
          })
          .then(function() {
            processed++;
            resolve(processed);
          })
          .catch(reject)
        ;
      }
    );
  };

  /**
   * Replace IMG-tags in HTML with HTML for their current style.
   * @param  {String} html [description]
   * @return {String}      [description]
   */
  external.replaceImgHtml = function(html) {
    return html.replace(/(?:<img src=")([^"]+)#([^"]+)(?:")/g, internal.parseImagesReplace);
  };

  internal.parseImagesReplace = function(all, filename, style) {
    style = style || "default";
    var currentStyle = internal.getStyle(style);
    var dominantIndex = (currentStyle.srcset.length - 1);
    var srcset = [];
    var i;

    var html = '<img data-src="'+filename+'" src="'+external.getFilename(filename, style, dominantIndex)+'" class="'+style+'"';
    // html += ' width="'+currentStyle.srcset[dominantIndex][0]+'" height="'+currentStyle.srcset[dominantIndex][1]+'"';

    if (currentStyle.srcset.length > 1) {
      for (i = 0; i < currentStyle.srcset.length; i++) {
        srcset.push(external.getFilename(filename, style, i) + ' '+currentStyle.srcset[i][0]+'w');
      }
      html += ' srcset="'+srcset.join(', ')+'"';
      if (currentStyle.sizes.length) {
        html += ' sizes="'+currentStyle.sizes.join(', ')+'"';
      }
    }

    return html;
  };

  /**
   * Get computed filename of image, given its style and index.
   * @param  {String}  filename [description]
   * @param  {String}  style    [description]
   * @param  {Integer} index    [description], optional
   * @return {String}           [description]
   */
  external.getFilename = function(filename, style, index) {
    var currentStyle = internal.getStyle(style);
    index = index || 0;
    if (!currentStyle.srcset[index]) {
      throw new Error("Wrong image index in style: "+style + ', ' +index);
    }
    return external.getFilenameSrcset(filename, currentStyle.srcset[index]);
  };

  /**
   * Get computed filename of image, given its srcset.
   * @param  {String} filename [description]
   * @param  {Array}  srcset   [description]
   * @return {String}          [description]
   */
  external.getFilenameSrcset = function(filename, srcset) {
    return filename.replace(/^(.+)(\.[^\.]+)$/,'$1-'+Number(srcset[0])+'x'+Number(srcset[1])+'$2');
  };

  /**
   * Get style properties.
   * @param  {String} style [description]
   * @return {Object}       [description]
   */
  internal.getStyle = function(style) {
    style = style || "default";
    if (config.themeConf && config.themeConf.imageStyles[style] !== undefined) {
      return config.themeConf.imageStyles[style];
    } else {
      throw new Error("Wrong image style: "+style);
    }
  };

  return external;
};

module.exports = imageStyles;
