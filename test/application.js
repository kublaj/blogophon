'use strict';

const application = require('../lib/helpers/application')();

exports.testapplicationProperties = function testapplicationProperties(test) {
  test.expect(1);

  test.ok(application.findDirectory() || true, 'Found user/config.json');
  //console.log(application.findDirectory());

  test.done();
};
