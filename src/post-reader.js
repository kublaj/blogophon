'use strict';

var Promise        = require('promise/lib/es6-extensions');
var fs             = require('fs');
var readline       = require("readline");
var yamljs         = require('yamljs');
var post           = require('./models/post');

/**
 * This class reads Markdown files into an object.
 * @constructor
 */
var PostReader = function(file) {
  if (!file) {
    throw new Error('File '+file+' is empty');
  }

  var readYaml = true;
  var yamlBuffer = '';
  var descriptionBuffer = '';
  var startDescriptionBuffer = false;
  var fileStat;
  var exports = {
    meta : {},
    markdown : ''
  };

  return new Promise (
    function(resolve, reject) {
      fs.stat(file, function(err, stats) {
        fileStat = stats;
      });

      readline.createInterface({
        input: require('fs').createReadStream( file )
      }).on('line', function(line) {
        if (readYaml && line.match(/\S+:[\s\S]/)) {
          yamlBuffer += line + "\n";
        } else if(readYaml && line.match(/^---$/)) {
          // do nothing
        } else {
          if (readYaml) {
            readYaml = false;
            exports.meta = yamljs.parse(yamlBuffer);
            if (!exports.meta) {
              exports.meta = {};
            }
          } else {
            if (!exports.meta.Title && line !== '') {
              exports.meta.Title = line;
            }
            if (!exports.meta.Description) {
              if (line.match(/^={3}/) && !startDescriptionBuffer) {
                startDescriptionBuffer = true;
              } else if (line.match(/^={3}/) && startDescriptionBuffer) {
                startDescriptionBuffer = false;
                exports.meta.Description = descriptionBuffer;
              } else if (startDescriptionBuffer) {
                descriptionBuffer += line+"\n";
              }
            }
            exports.markdown += line + "\n";
          }
        }
      })
      .once('close',function() {
        if (!exports.meta || !exports.markdown) {
          reject(new Error('File '+file+' seems to be empty or cannot be parsed'));
        }
        exports.meta.noLinkNeeded = false;
        if (!exports.meta.Description && descriptionBuffer) {
          exports.meta.Description = descriptionBuffer;
          exports.meta.noLinkNeeded = true;
        }
        if (fileStat.mtime) {
          exports.meta.DateModified = fileStat.mtime;
        }
        if (!exports.meta.Date && exports.meta.DateModified) {
          exports.meta.Date = exports.meta.DateModified;
        }
        resolve( post(file, exports.markdown, exports.meta) );
      });
    }
  );
};

module.exports = PostReader;
