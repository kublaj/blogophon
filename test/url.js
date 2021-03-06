'use strict';

const Url       = require('../lib/helpers/url');
const PostUrl   = require('../lib/helpers/post-url');
const AuthorUrl = require('../lib/helpers/author-url');
const TagUrl    = require('../lib/helpers/tag-url');
const IndexUrl  = require('../lib/helpers/index-url');


exports.testExtender = function(test) {
  test.expect(8);

  let url = Url('test');

  test.ok(url.relativeUrl());
  test.ok(url.absoluteUrl());
  test.ok(url.filename());
  test.ok(url.dirname());

  test.ok(url.relativeUrl().match(/\/$/), 'No index.html at the end');
  test.ok(url.filename().match(/[/\\]index\.html$/));
  test.ok(!url.dirname().match(/[/\\]index\.html$/), 'No index.html at the end');
  test.ok(!url.dirname().match(/[/\\]$/), 'No trailing slash');

  /*console.log([
    url.relativeUrl(),
    url.filename(),
    url.dirname()
  ]);*/

  test.done();
};

exports.testBasicTransformation = function(test) {
  test.expect(9+3);

  let url;

  url = PostUrl('ich-und-du.md');
  test.ok(url.relativeUrl().match(/^\S*\/posts\/ich-und-du\/$/));
  test.ok(url.absoluteUrl().match(/^\S*\/posts\/ich-und-du\/$/));
  test.ok(url.filename().match(/^\S+(\/|\\)posts(\/|\\)ich-und-du(\/|\\)index\.html$/), 'Filename matching');

  url = IndexUrl('Tag');
  test.ok(url.relativeUrl().match(/^\S*\/tag$/));
  test.ok(url.absoluteUrl().match(/^\S*\/tag$/));
  test.ok(url.filename().match(/^\S+(\/|\\)tag$/));

  url = TagUrl('Tag');
  test.ok(url.relativeUrl().match(/^\S*\/tagged\/tag\/$/));
  test.ok(url.absoluteUrl().match(/^\S*\/tagged\/tag\/$/));
  test.ok(url.filename().match(/^\S+(\/|\\)tagged(\/|\\)tag(\/|\\)index\.html$/));

  url = AuthorUrl('Paul Wischwedel');
  test.ok(url.relativeUrl().match(/^\S*\/authored-by\/paul-wischwedel\/$/));
  test.ok(url.absoluteUrl().match(/^\S*\/authored-by\/paul-wischwedel\/$/));
  test.ok(url.filename().match(/^\S+(\/|\\)authored-by(\/|\\)paul-wischwedel(\/|\\)index\.html$/));

  test.done();
};

exports.testSpecialTransformation = function(test) {
  test.expect(12);

  let url;

  url = PostUrl('Ich-ünd-Dü.md');
  test.ok(url.relativeUrl().match(/^\S*\/posts\/ich-uend-due\/$/));
  test.ok(url.absoluteUrl().match(/^\S*\/posts\/ich-uend-due\/$/));
  test.ok(url.filename().match(/^\S+(\/|\\)posts(\/|\\)ich-uend-due(\/|\\)index\.html$/), 'Filename matching Umlauts');

  url = TagUrl('Ich bin ein merkwürdiges Tag');
  test.ok(url.relativeUrl().match(/^\S*\/tagged\/ich-bin-ein-merkwuerdiges-tag\/$/));
  test.ok(url.absoluteUrl().match(/^\S*\/tagged\/ich-bin-ein-merkwuerdiges-tag\/$/));
  test.ok(url.filename().match(/^\S+(\/|\\)tagged(\/|\\)ich-bin-ein-merkwuerdiges-tag(\/|\\)index\.html$/));

  url = IndexUrl('/Tag');
  test.ok(url.relativeUrl().match(/^\S*\/tag$/));
  test.ok(url.absoluteUrl().match(/^\S*\/tag$/));
  test.ok(url.filename().match(/^\S+(\/|\\)tag$/));

  url = IndexUrl('////Tag');
  test.ok(url.relativeUrl().match(/^\S*\/tag$/));
  test.ok(url.absoluteUrl().match(/^\S*\/tag$/));
  test.ok(url.filename().match(/^\S+(\/|\\)tag$/));

  test.done();
};

exports.testPosts = function(test) {
  test.expect(2);

  test.ok(PostUrl('users/posts/ich-und-du.md').relativeUrl().match(/^\S*\/posts\/ich-und-du\/$/));
  test.ok(PostUrl('/users/posts/ich-und-du.md').relativeUrl().match(/^\S*\/posts\/ich-und-du\/$/));

  test.done();
};

exports.testEmptyTransformation = function(test) {
  test.expect(9);

  test.strictEqual(PostUrl(null).relativeUrl(), null);
  test.strictEqual(PostUrl(null).absoluteUrl(), null);
  test.strictEqual(PostUrl(null).filename(), null);

  test.strictEqual(IndexUrl(null).relativeUrl(), null);
  test.strictEqual(IndexUrl(null).absoluteUrl(), null);
  test.strictEqual(IndexUrl(null).filename(), null);

  test.strictEqual(TagUrl(null).relativeUrl(), null);
  test.strictEqual(TagUrl(null).absoluteUrl(), null);
  test.strictEqual(TagUrl(null).filename(), null);

  test.done();
};
