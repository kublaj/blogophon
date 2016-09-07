'use strict';

/**
 * Generate object of share links.
 * @param  {String} title       [description]
 * @param  {String} link        [description]
 * @param  {String} description [description]
 * @param  {String} siteName    [description]
 * @return {Object} [description]
 */
var ShareLinks = function(title, link, description, siteName) {
  if (link === undefined) {
    throw new Error("Missing required URL for share link");
  }
  title       = (title !== undefined)       ? title       : '';
  description = (description !== undefined) ? description : title;
  siteName    = (siteName !== undefined)    ? siteName    : title;

  return {
    twitter: "https://twitter.com/intent/tweet?original_referer="+encodeURIComponent(link)+"&source=tweetbutton&text="+encodeURIComponent(description+' '+link)+"&link="+encodeURIComponent(link),
    facebook: "http://www.facebook.com/sharer.php?u="+encodeURIComponent(link),
    gplus: "https://plus.google.com/share?link="+encodeURIComponent(link),
    whatsapp: 'whatsapp://send?text=' +encodeURIComponent(title + ' [' + link + ']'),
    email: "mailto:?subject="+encodeURIComponent(siteName)+"&body="+encodeURIComponent(title+"\n\n"+link)
  };
};

module.exports = ShareLinks;