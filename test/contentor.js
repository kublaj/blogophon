'use strict';

var contentor = require('../src/helpers/contentor');

exports.testContentorBasic = function testContentorBasic(test) {
  test.expect(3 * 9);
  var config = require('../src/config');
  config.specialFeatures.acceleratedmobilepages = true;
  config.specialFeatures.atom = true;
  var markdown;
  var content;

  markdown = 'Ich bin ganz harmlos';
  content = contentor(markdown, config);

  test.ok(content.markdown);
  test.ok(content.html);
  test.ok(content.plain);
  test.ok(content.safeHtml);
  test.ok(content.ampHtml);
  test.ok(content.safeHtml === content.html);
  test.ok(content.ampHtml === content.html);
  test.ok(content.plain !== content.html);
  test.ok(content.plain === content.markdown);

  markdown = 'Ich bin nicht mehr [ganz harmlos](http://www.example.com)';
  content = contentor(markdown, config);
  //console.log(content);

  test.ok(content.markdown);
  test.ok(content.html);
  test.ok(content.plain);
  test.ok(content.safeHtml);
  test.ok(content.ampHtml);
  test.ok(content.safeHtml === content.html);
  test.ok(content.ampHtml === content.html);
  test.ok(content.plain !== content.html);
  test.ok(content.plain !== content.markdown);

  markdown = '![Mit Bildern](image.jpg#default) geht so richtig die Post ab, ich bin definitiv nicht mehr [ganz harmlos](http://www.example.com)';
  content = contentor(markdown, config);
  console.log(content);

  test.ok(content.markdown);
  test.ok(content.html);
  test.ok(content.plain);
  test.ok(content.safeHtml);
  test.ok(content.ampHtml);
  test.ok(content.safeHtml !== content.html);
  test.ok(content.ampHtml !== content.html);
  test.ok(content.plain !== content.html);
  test.ok(content.plain !== content.markdown);

  test.done();
};
