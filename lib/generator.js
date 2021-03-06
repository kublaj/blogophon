'use strict';

const glob           = require("glob");
const Promise        = require('promise/lib/es6-extensions');
const fs             = require('fs-extra-promise');
const path           = require('path');
const SuperString    = require('./helpers/super-string');
const blogophonDate  = require('./models/blogophon-date');
const Mustache       = require('./helpers/blogophon-mustache');
const PostReader     = require('./post-reader');
const jsonRss        = require('./models/json-rss');
const geoJson        = require('./models/geo-json');
const translations   = require('./helpers/translations');
const indexUrl       = require('./helpers/index-url');
const blogophonIndex = require('./blogophon-index');
const hashes         = require('./models/hashes');
const appleNewsFormat = require('./models/apple-news-format');
const imageStyles    = require('./helpers/image-styles');
const ampify         = require('./helpers/ampify')();
const slacked        = require('./models/slacked');
const jsonFeed       = require('./models/json-feed');
const categoriesUrls = require('./models/categories');

/**
 * Generator used for creating the blog.
 * @constructor
 * @param {Object} config [description]
 */
const Generator = function(config) {
  if (!config) {
    throw new Error('config is empty');
  }
  const external = {};
  const internal = {};

  Mustache.getTemplates();
  Mustache.getThemeTemplates(path.join(config.directories.currentTheme, 'templates'));

  if (config.specialFeatures.acceleratedmobilepages) {
    Mustache.ampCss = Mustache.ampCss || fs.readFileSync(path.join(Mustache.themePath, '../css/amp.css'), 'utf8').replace(/\s*[\n\r]+\s*/g, '');
  }

  internal.currentIndex = null;
  internal.translation  = translations(config.locale.language);
  internal.hashes       = hashes();
  internal.imageStyles  = imageStyles(config);
  config.categoriesUrls = categoriesUrls(config);

  /**
   * Get all articles from file system and populate `index` into {Post}. Uses {PostReader}.
   * @return {Promise} with first parameter of `resolve` being the number of files converted.
   */
  external.getArticles = function() {
    internal.currentIndex = blogophonIndex();
    return new Promise(
      function(resolve, reject) {
        glob(config.directories.data + "/**/*.md", function(err, files) {
          if (err) {
            reject(err);
          }
          // Making promises
          let promises = files.map(function(i) {
            return PostReader(i, config);
          });
          // Checking promises
          Promise
            .all(promises)
            .then(function(posts) {
              internal.currentIndex.pushArray(posts);
              console.log('Removed ' + internal.currentIndex.removeFutureItems() + ' item(s) with future timestamp from index');
              console.log('Removed ' + internal.currentIndex.removeDrafts() + ' draft(s) from index');
              internal.currentIndex.makeNextPrev();
              resolve( files.length );
            })
            .catch(reject)
          ;
        });
      }
    );
  };

  /**
   * Get all {Post} from `index` and generate HTML pages.
   * @param  {Boolean} force    If set to `true`, all articles will be rebuilt. Otherwise, only changed articles will be build.
   * @param  {Boolean} noimages If set to `true`, no images will be created
   * @return {Promise}          with first parameter of `resolve` being the list of files generated.
   */
  external.buildAllArticles = function(force, noimages) {
    let allPosts = internal.currentIndex.getPosts();
    let skipped  = 0;
    let generatedArticles = [];

    if (force && !noimages) {
      fs.removeSync(path.join(config.directories.htdocs, config.htdocs.posts, '*'));
    }

    return new Promise(
      function(resolve, reject) {
        // Making promises
        let promises = allPosts.map(function(post) {
          if (!force && internal.hashes.matchesHash(post.meta.Url, post.hash)) {
            skipped++;
          } else {
            generatedArticles.push([post.meta.Url, post.filename]);
            return external.buildSingleArticle(post, noimages);
          }
        });
        // Checking promises
        Promise
          .all(promises)
          .then(function() {
            internal.hashes.save();
            console.log("Created " + generatedArticles.length + " articles, skipped " +  skipped + " articles");
            resolve(generatedArticles);
          })
          .catch(reject)
        ;
      }
    );
  };

  /**
   * Build a single article.
   * @param  {Post}    post      [description]
   * @param  {Boolean} noimages  If set to `true`, no images will be created
   * @return {Promise} with first parameter being the filename
   */
  external.buildSingleArticle = function(post, noimages) {
    if (!post) {
      throw new Error('Empty post');
    }
    return new Promise(
      function(resolve, reject) {
        fs.ensureDirSync(post.meta.urlObj.dirname());
        let promises = [
          fs.writeFileAsync(post.meta.urlObj.filename(), Mustache.renderExtra(Mustache.themeTemplates.postHtml, {
            post: post,
            config: config
          }, Mustache.themePartials))
        ];
        if (config.specialFeatures.applenews) {
          promises.push(fs.writeFileAsync( post.meta.urlObj.filename('article', 'json'), JSON.stringify(appleNewsFormat(post), undefined, 2)));
        }
        if (config.specialFeatures.acceleratedmobilepages) {
          promises.push(fs.writeFileAsync(post.meta.urlObj.filename('amp'), Mustache.renderExtra(Mustache.themeTemplates.ampPostHtml, {
            post: post,
            ampCss: Mustache.ampCss,
            config: config
          }, Mustache.themePartials)));
        }
        if (config.specialFeatures.ajax) {
          promises.push(fs.writeFileAsync(
            post.meta.urlObj.filename('index', 'json'),
            JSON.stringify(post, undefined, 2))
          );
        }
        if (!noimages) {
          promises.push(external.buildArticleImages(post));
        }

        Promise
          .all(promises)
          .then(function() {
            if (internal.hashes) {
              internal.hashes.update(post.meta.Url, post.hash);
            }
            resolve(post.meta.Filename);
          })
          .catch(reject)
        ;
      }
    );
  };

  /**
   * Copy images from Markdown area to live `htdocs`, scaling and optimizing them.
   * @param  {Post}    post [description]
   * @return {Promise} with first parameter of `resolve` being the number of files converted.
   */
  external.buildArticleImages = function(post) {
    if (!post.meta.Url || !post.filename) {
      return false;
    }
    // Target directory
    let sourceDirectory = post.filename.replace(/\.md$/, '') + "/"; // Source directory
    let sourceGlob      = glob.sync(sourceDirectory + "*.{png,jpg,gif}");
    let sourceReg       = new RegExp(sourceDirectory);
    let imageStyles     = sourceGlob ? post.getAllImagesWithStyleObject() : {};

    return new Promise(
      function(resolve, reject) {
        let promises = sourceGlob.map(function(sourceFile) {
          let targetFile = sourceFile.replace(sourceReg, config.directories.htdocs + post.meta.Url);
          fs.copySync(sourceFile, targetFile);
          //console.log(imageStyles[path.basename(sourceFile)] || []);
          return internal.imageStyles.generateImagesWithStyles(sourceFile, targetFile, imageStyles[path.basename(sourceFile)] || []);
        });
        Promise
          .all(promises)
          .then(function(generatedImages) {
            let processed = 0;
            if (promises.length > 0) {
              processed = generatedImages.reduce(function(accumulatedValue, generatedImage) {
                return accumulatedValue + generatedImage;
              });
              console.log("Resized "+processed+" images");
            }
            return resolve(processed);
          })
          .catch(reject)
        ;
      }
    );
  };

  /**
   * Build special pages from `index` like index pages, tag pages, etc.
   * @return {Promise} with first parameter of `resolve` being an array with the numbers of files converted.
   */
  external.buildSpecialPages = function() {
    return new Promise(
      function(resolve, reject) {
        let promises = [
          external.buildIndexFiles(),
          external.buildTagPages(),
          external.buildCategoryPages(),
          external.buildMetaFiles()
        ];

        if (config.specialFeatures.multipleauthors) {
          promises.push(external.buildAuthorPages());
        }

        Promise
          .all(promises)
          .then(resolve)
          .catch(reject)
        ;
      }
    );
  };

  /**
   * [buildIndexFiles description]
   * @param  {Array}   index [description]
   * @param  {String}  path  [description]
   * @param  {String}  title [description]
   * @return {Promise} with first parameter of `resolve` being the number of files converted.
   */
  external.buildIndexFiles = function(index, path, title) {
    index = index || internal.currentIndex;
    path  = path  || '/';
    title = title || internal.translation.getString('Home');

    fs.ensureDirSync(config.directories.htdocs + path);
    fs.removeSync(config.directories.htdocs + path + 'index*');

    return new Promise(
      function(resolve, reject) {
        let page;
        let pagedPosts = index.getPagedPosts(config.itemsPerPage);
        let urls = {
          indexHtml:  indexUrl(path + 'index.html'),
          rss:        indexUrl(path + 'posts.rss'),
          jsonrss:    indexUrl(path + 'rss.json'),
          snippetHtml: indexUrl(path + 'snippet._html'),
          jsonfeed:   indexUrl(path + 'feed.json'),
          slackjson:  indexUrl(path + 'slack.json'),
          geojs:      indexUrl(path + 'geo.json'),
          networkKml: indexUrl(path + 'network.kml'),
          placesKml:  indexUrl(path + 'places.kml'),
          atom:       indexUrl(path + 'posts.atom'),
          ics:        indexUrl(path + 'posts.ics'),
          ajax:       indexUrl(path + 'index.json')
        };
        let promises = [];
        let pubDate = blogophonDate(index.pubDate);
        if (config.specialFeatures.rss || config.specialFeatures.facebookinstantarticles) {
          promises.push(fs.writeFileAsync( urls.rss.filename(), Mustache.render(Mustache.templates.rssXml, {
            index:       index.getPosts(10),
            pubDate:     pubDate.rfc,
            config:      config,
            absoluteUrl: urls.rss.absoluteUrl(),
            title:       title
          }, {contentHtml: config.specialFeatures.facebookinstantarticles ? Mustache.templates.facebookHtml : '{{{safeHtml}}}'})));
        }
        if (config.specialFeatures.atom) {
          promises.push(fs.writeFileAsync( urls.atom.filename(), Mustache.render(Mustache.templates.atomXml, {
            index: index.getPosts(10),
            pubDate:     pubDate.iso,
            config:      config,
            absoluteUrl: urls.atom.absoluteUrl(),
            title:       title
          })));
        }
        if (config.specialFeatures.teasersnippets) {
          promises.push(fs.writeFileAsync( urls.snippetHtml.filename(), Mustache.render(Mustache.themeTemplates.snippetHtml, {
            index:       index.getPosts(3),
            absoluteUrl: urls.indexHtml.absoluteUrl(),
            title:       title
          })));
        }
        if (config.specialFeatures.icscalendar) {
          promises.push(fs.writeFileAsync( urls.ics.filename(), Mustache.renderExtra(Mustache.templates.calendarIcs, {
            index: index.getPosts(),
            pubDate:     pubDate.ics,
            config:      config,
            absoluteUrl: urls.ics.absoluteUrl(),
            title:       title
          })));
        }
        if (config.specialFeatures.jsonfeed) {
          promises.push(fs.writeFileAsync(
            urls.jsonfeed.filename(),
            JSON.stringify(
              jsonFeed(index.getPosts(20), pubDate, config, title, urls.jsonfeed.absoluteUrl()),
              undefined,
              2
            )
          ));
        }
        if (config.specialFeatures.jsonrss) {
          promises.push(fs.writeFileAsync( urls.jsonrss.filename(), JSON.stringify(jsonRss(index.getPosts(20), pubDate, config, title, urls.jsonrss.absoluteUrl()), undefined, 2)));
        }
        if (config.specialFeatures.jsonforslack) {
          promises.push(fs.writeFileAsync( urls.slackjson.filename(), JSON.stringify(slacked(index.getPosts(3), pubDate, config, title), undefined, 2)));
        }
        if (config.specialFeatures.geojson) {
          promises.push(fs.writeFileAsync( urls.geojs.filename(), JSON.stringify(geoJson(index.getGeoArticles()), undefined, 2)));
        }
        if (config.specialFeatures.kml) {
          promises.push(fs.writeFileAsync( urls.networkKml.filename(), Mustache.renderExtra(Mustache.templates.networkKml, {
            pubDate:     pubDate.iso,
            config:      config,
            absoluteUrl: urls.networkKml.absoluteUrl(),
            title:       title,
            link:        urls.placesKml.absoluteUrl()
          })));
          promises.push(fs.writeFileAsync( urls.placesKml.filename(), Mustache.renderExtra(Mustache.templates.placesKml, {
            index:       index.getPosts(),
            pubDate:     pubDate.iso,
            config:      config,
            absoluteUrl: urls.placesKml.absoluteUrl(),
            title:       title
          })));
        }
        if (config.specialFeatures.ajax) {
          promises.push(fs.writeFileAsync(
            urls.ajax.filename(),
            JSON.stringify(index, undefined, 2)
          ));
        }

        for (page = 0; page < pagedPosts.length; page ++) {
          let curPageObj    = index.getPageData(page, pagedPosts.length, false, path);
          let curUrlObj     = indexUrl(curPageObj.currentUrl);
          curPageObj.index  = pagedPosts[page];
          curPageObj.config = config;
          curPageObj.meta   = {
            title:       title,
            subtitle:    (curPageObj.currentPage === 1) ? '' : SuperString(internal.translation.getString('Page %d/%d')).sprintf(curPageObj.currentPage, curPageObj.maxPages),
            absoluteUrl: curUrlObj.absoluteUrl(),
            absoluteUrlDirname: curUrlObj.absoluteUrlDirname(),
            isHomepage:  (path === '/')
          };
          curPageObj.firstUrl = indexUrl(curPageObj.firstUrl).relativeUrl();
          curPageObj.prevUrl = indexUrl(curPageObj.prevUrl).relativeUrl();
          curPageObj.nextUrl = indexUrl(curPageObj.nextUrl).relativeUrl();
          curPageObj.lastUrl = indexUrl(curPageObj.lastUrl).relativeUrl();
          if (config.specialFeatures.acceleratedmobilepages) {
            curPageObj.meta.AbsoluteUrlAmp = curUrlObj.absoluteUrl('amp');
          }
          promises.push(fs.writeFileAsync(indexUrl(curPageObj.currentUrl).filename(), Mustache.renderExtra(Mustache.themeTemplates.indexHtml, curPageObj, Mustache.themePartials)));

          if (config.specialFeatures.acceleratedmobilepages) {
            curPageObj.ampCss = Mustache.ampCss;
            curPageObj.firstUrl = indexUrl(curPageObj.firstUrl).relativeUrl('amp');
            curPageObj.prevUrl = indexUrl(curPageObj.prevUrl).relativeUrl('amp');
            curPageObj.nextUrl = indexUrl(curPageObj.nextUrl).relativeUrl('amp');
            curPageObj.lastUrl = indexUrl(curPageObj.lastUrl).relativeUrl('amp');
            curPageObj.consolidatedProperties = ampify.getConsolidatedProperties(curPageObj.index);

            promises.push(fs.writeFileAsync(
              indexUrl(curPageObj.currentUrl).filename('amp'),
              Mustache.renderExtra(
                Mustache.themeTemplates.ampIndexHtml,
                curPageObj,
                Mustache.themePartials
              )
            ));
          }

        }
        Promise
          .all(promises)
          .then(function() {
            console.log("Wrote "+promises.length+" files for '"+title+"'");
            return resolve(promises.length);
          })
          .catch(reject)
        ;
      }
    );
  };

  /**
   * [buildTagPages description]
   * @return {Promise} with first parameter of `resolve` being the number of files converted.
   */
  external.buildTagPages = function() {
    let tags = internal.currentIndex.getTags();
    let tagPages = Object.keys(tags).sort().map(function(key) {
      return {
        title: tags[key].title,
        url:   tags[key].urlObj.relativeUrl()
      };
    });

    fs.removeSync(path.join(config.directories.htdocs, config.htdocs.tag));
    fs.ensureDirSync(path.join(config.directories.htdocs, config.htdocs.tag));

    return new Promise(
      function(resolve, reject) {
        let promises = Object.keys(tags).map(function(key) {
          return external.buildIndexFiles(
            tags[key].index,
            '/'+tags[key].urlObj.relativeDirname()+'/',
            SuperString(internal.translation.getString('Articles with tag "%s"')).sprintf(tags[key].title)
          );
        });

        promises.push(fs.writeFileAsync( indexUrl(config.htdocs.tag + '/index.html').filename(), Mustache.renderExtra(Mustache.themeTemplates.tagsHtml, {
          index: tagPages,
          config: config
        }, Mustache.themePartials)));

        if (config.specialFeatures.ajax) {
          promises.push(fs.writeFileAsync(
            indexUrl(config.htdocs.tag + '/index.json').filename(),
            JSON.stringify(tags, undefined, 2)
          ));
        }

        Promise
          .all(promises)
          .then(function() {
            return resolve(promises.length);
          })
          .catch(reject)
        ;
      }
    );
  };

  /**
   * [buildCategoryPages description]
   * @return {Promise} with first parameter of `resolve` being the number of files converted.
   */
  external.buildCategoryPages = function() {
    let categories = internal.currentIndex.getCategories();
    let categoryPages = Object.keys(categories).sort().map(function(key) {
      return {
        title: categories[key].title,
        url:   categories[key].urlObj.relativeUrl()
      };
    });

    if (config.postPathMode !== 'Category') {
      fs.removeSync(path.join(config.directories.htdocs, config.htdocs.category));
      fs.ensureDirSync(path.join(config.directories.htdocs, config.htdocs.category));
    }

    return new Promise(
      function(resolve, reject) {
        let promises = Object.keys(categories).map(function(key) {
          return external.buildIndexFiles(
            categories[key].index,
            '/'+categories[key].urlObj.relativeDirname()+'/',
            categories[key].title
          );
        });

        promises.push(fs.writeFileAsync( indexUrl(config.htdocs.category + '/index.html').filename(), Mustache.renderExtra(Mustache.themeTemplates.tagsHtml, {
          index: categoryPages,
          config: config
        }, Mustache.themePartials)));

        if (config.specialFeatures.ajax) {
          promises.push(fs.writeFileAsync(
            indexUrl(config.htdocs.category + '/index.json').filename(),
            JSON.stringify(categories, undefined, 2)
          ));
        }

        Promise
          .all(promises)
          .then(function() {
            return resolve(promises.length);
          })
          .catch(reject)
        ;
      }
    );
  };

  /**
   * [buildAuthorPages description]
   * @return {Promise} with first parameter of `resolve` being the number of files converted.
   */
  external.buildAuthorPages = function() {
    let authors = internal.currentIndex.getAuthors();
    let authorPages = Object.keys(authors).sort().map(function(name) {
      return {
        title: name,
        url:   authors[name].urlObj.relativeUrl()
      };
    });

    fs.remove(path.join(config.directories.htdocs, config.htdocs.author), function(err) {
      return new Promise(
        function(resolve, reject) {
          if (err) {
            reject(err);
          }
          fs.ensureDirSync(path.join(config.directories.htdocs, config.htdocs.author));

          let promises = Object.keys(authors).map(function(name) {
            return external.buildIndexFiles(
              authors[name].index,
              '/'+authors[name].urlObj.relativeDirname()+'/',
              SuperString(internal.translation.getString('Articles written by %s')).sprintf(name)
            );
          });

          promises.push(fs.writeFileAsync(
            indexUrl(config.htdocs.author+'/index.html').filename(),
            Mustache.renderExtra(Mustache.themeTemplates.authorsHtml, {
              index: authorPages,
              config: config
            },
            Mustache.themePartials)
          ));

          if (config.specialFeatures.ajax) {
            promises.push(fs.writeFileAsync(
              indexUrl(config.htdocs.author+'/index.json').filename(),
              JSON.stringify(authors, undefined, 2)
            ));
          }

          Promise
            .all(promises)
            .then(function() {
              return resolve(promises.length);
            })
            .catch(reject)
          ;
        }
      );
    });
  };

  /**
   * Build 404 pages, sitemaps, newsfeeds an stuff like external
   * @return {Promise} with first parameter of `resolve` being the number of files converted.
   */
  external.buildMetaFiles = function() {
    return new Promise(
      function(resolve, reject) {
        let promises = [
          fs.writeFileAsync(
            indexUrl('404.html').filename(),
            Mustache.renderExtra(
              Mustache.themeTemplates.notFoundHtml, {
                index: internal.currentIndex.getPosts(5),
                config: config
              },
              Mustache.themePartials
            )
          ),

          fs.writeFileAsync(
            indexUrl('sitemap.xml').filename(),
            Mustache.renderExtra(
              Mustache.templates.sitemapXml, {
                index: internal.currentIndex.getPosts(),
                pubDate: blogophonDate(internal.currentIndex.pubDate).iso,
                config: config
              }
            )
          )
        ];

        if (config.specialFeatures.microsofttiles) {
          fs.ensureDirSync(config.directories.htdocs + '/notifications');
          internal.currentIndex.getPosts(5).forEach(function(post, index) {
            promises.push(
              fs.writeFileAsync(
                indexUrl('notifications/livetile-'+(index+1)+'.xml').filename(),
                Mustache.renderExtra(
                  Mustache.templates.livetileXml, {
                    post: post
                  }
                )
              )
            );
          });
        }


        Promise
          .all(promises)
          .then(function() {
            console.log("Wrote "+promises.length+" meta files");
            return resolve(promises.length);
          })
          .catch(reject)
        ;
      }
    );
  };

  /**
   * Build all articles, special pages and images.
   * @param  {Boolean} force    [description]
   * @param  {Boolean} noimages [description]
   * @return {Promise} [description]
   */
  external.buildAll = function(force, noimages) {
    return new Promise(
      function(resolve, reject) {
        external
          .buildAllArticles(force, noimages)
          .then(function(generatedArticles) {
            return generatedArticles.length ? external.buildSpecialPages() : true;
          })
          .then(resolve)
          .catch(reject)
        ;
      }
    );
  };

  /**
   * Executes deployment command as given in `config.json`.
   * @return {Boolean} [description]
   */
  external.deploy = function() {
    let shell = require('shelljs');
    if (config.deployCmd) {
      console.log('Deploying...');
      shell.exec('cd '+path.join(__dirname, '..')+'; ' + config.deployCmd);
      console.log('Finished deploying');
    }
    return true;
  };

  return external;
};

module.exports = Generator;
