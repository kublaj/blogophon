'use strict';

const blogophonDate = require('../lib/models/blogophon-date');

exports.testBasicProperties = function(test) {
  test.expect(7);

  const config = require('../lib/config');
  const pubDate = blogophonDate('2016-12-31', 'en');

  const item = {
    htmlTeaser: 1,
    meta: {
      AbsoluteUrl: 2,
      Title: 3,
      Description: 9,
      Created: pubDate,
      tags: [6, 7]
    }
  };
  const slacked = require('../lib/models/slacked')([item], pubDate, config);

  //console.log(slacked);

  test.ok(slacked.text !== undefined);
  test.ok(slacked.attachments !== undefined);
  test.ok(slacked.attachments[0] !== undefined);
  test.ok(slacked.attachments[0].title !== undefined);
  test.ok(slacked.attachments[0].title_link !== undefined);
  test.ok(slacked.attachments[0].text !== undefined);
  test.ok(slacked.attachments[0].ts !== undefined);

  test.done();
};
