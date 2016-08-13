'use strict';

/**
 * Represents all posts
 * @constructor
 */
var Index = function () {
  var index    = [];
  var tags     = {};
  var isSorted = true;
  var pubDate  = new Date();

  var sortIndex = function() {
    index.sort(function(a,b){
      if (a.meta.timestamp < b.meta.timestamp) {
        return 1;
      } else if (a.meta.timestamp > b.meta.timestamp) {
        return -1;
      }
      return 0;
    });
    isSorted = true;
  };

  var getPageName = function (curPage, maxPage, reverse) {
    curPage ++;
    if (curPage <= 0 || curPage > maxPage) {
      return null;
    } else if ((!reverse && curPage === 1) || (reverse && curPage === maxPage)) {
      return 'index.html';
    } else {
      return 'index-' + curPage + '.html';
    }
  };

  return {
    clear: function () {
      isSorted = false;
      index = [];
    },
    push: function (post) {
      isSorted = false;
      index.push(post);
    },

    makeNextPrev: function () {
      if (!isSorted) {
        sortIndex();
      }
      var i;
      for(i = 0; i < index.length; i++) {
        if (i > 0 && index[i-1]) {
          index[i].prev = index[i-1].meta;
        }
        if (i < index.length -1 &&  index[i+1]) {
          index[i].next = index[i+1].meta;
        }
      }
      return this;
    },

    /**
     * Get all posts, sorted by date.
     * @param  {integer} i Only return i results. If left empty, all results will be returned.
     * @return {Array}   [description]
     */
    getPosts: function(i) {
      if (!isSorted) {
        sortIndex();
      }
      return i ? index.slice(0,i) : index;
    },

    /**
     * [getTags description]
     * @return {[type]} [description]
     */
    getTags: function() {
      if (!isSorted) {
        sortIndex();
      }
      index.forEach(function(post){
        if (post.meta.Tags) {
          post.meta.Tags.forEach(function(tag){
            if (tags[tag.id] === undefined) {
              tags[tag.id] = tag;
              tags[tag.id].index = [];
            }
            tags[tag.id].index.push(post);
          });
        }
      });
      return tags;
    },

    /**
     * Get whole index, split up into separate pages.
     * @param  {[type]} itemsPerPage [description]
     * @param  {[type]} reverse      [description]
     * @return {[type]}              [description]
     */
    getPagedPosts: function(itemsPerPage, reverse) {
      if (!isSorted) {
        sortIndex();
      }
      if (!itemsPerPage) {itemsPerPage = 10;}
      var pages = [], page = 0, newIndex = index, currentSlice = [];
      if (reverse) {
        newIndex = newIndex.reverse();
      }
      do {
        page ++;
        currentSlice = newIndex.slice(itemsPerPage * (page-1),itemsPerPage * page);
        if (reverse) {
          currentSlice = currentSlice.reverse();
        }
        pages.push(currentSlice);
      } while (page * itemsPerPage < index.length);
      return pages;
    },

    /**
     * Get meta data for a single page.
     * @param  {[type]} curPage [description]
     * @param  {[type]} maxPage [description]
     * @param  {[type]} reverse [description]
     * @return {[type]}         [description]
     */
    getPageData: function (curPage, maxPage, reverse) {
      return {
        currentUrl: getPageName(curPage, maxPage, reverse),
        nextUrl: getPageName(curPage+1, maxPage, reverse),
        prevUrl: getPageName(curPage-1, maxPage, reverse),
        currentPage: (curPage+1),
        nextPage: ((curPage+2 < maxPage) ? curPage+2 : null),
        prevPage: ((curPage > 0) ? curPage : null),
        maxPages: maxPage
      };
    }
  };
};

module.exports = Index;