var config = require('../src/config');

exports.testConfigProperties = function(test) {
  'use strict';
  test.expect(5);

  test.ok(config.language);
  test.ok(config.baseUrl);
  test.ok(config.basePath);
  test.ok(config.imageSizes);
  test.ok(config.directories);

  test.done();
};
