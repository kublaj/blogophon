'use strict';

const blogophonConsole = require('../lib/blogophon-console');

exports.testGeneralFunctionality = function(test) {
  test.expect(1);

  test.ok(blogophonConsole, 'Console does compile');

  test.done();
};
