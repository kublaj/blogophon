#!/usr/bin/env node

'use strict';

var fs             = require('fs');
var inquirer       = require('inquirer');
var defaultValues  = require('./src/config');
var themesAvailable= fs.readdirSync(defaultValues.directories.theme);
var args           = require('./src/helpers/arguments')();
var Generator      = require('./src/generator');

if (themesAvailable.length < 1) {
  throw new Error('No themes found');
}

if (args.help) {
  console.log('Usage:');
  console.log('  node setup.js [options]');
  console.log('Options:');
  console.log('  --only-new      Only run installer if no configuration is present');
  console.log('  --help          Display this help and exit');
  process.exit(0);
} else if (args.onlynew && ! defaultValues.notInitialized) {
  console.log('`config.json` already present, start without `--only-new` to overwrite configuration.');
  process.exit(0);
}

var questions = [
  {
    type: 'input',
    name: 'name',
    message: 'The name of your site',
    default: defaultValues.name,
    validate: function(v) {
      return v ? true : 'Please supply at least a short name for your site.';
    }
  },{
    type: 'list',
    name: 'theme',
    message: 'Choose theme',
    default: defaultValues.theme,
    choices: themesAvailable,
    when: function() {
      return (themesAvailable.length > 1);
    }
  },{
    type: 'input',
    name: 'baseUrl',
    message: 'Domain of your site, starting with `http`',
    default: defaultValues.baseUrl,
    validate: function(v) {
      return v.match(/^http(s)?:\/\/\S+$/) ? true : 'Please supply a valid url, starting with `http://`.';
    },
    filter: function(v) {
      return v.replace(/\/$/,'');
    }
  },{
    type: 'input',
    name: 'basePath',
    message: 'Base URL path, usually just `/`',
    default: defaultValues.basePath,
    validate: function(v) {
      return v.match(/^[a-zA-Z0-9\.\/_-]+$/) ? true : 'Please supply a valid path, at least `/`.';
    },
    filter: function(v) {
      return v.replace(/^([^\/])/,'/$1').replace(/([^\/])$/,'$1/');
    }
  },{
    type: 'input',
    name: 'description',
    message: 'A short description of your blog (optional)',
    default: defaultValues.description
  },{
    type: 'input',
    name: 'language',
    message: 'Standard language of your blog, like `en` for English',
    default: defaultValues.language,
    validate: function(v) {
      return v.match(/^[a-zA-Z\-]+$/) ? true : 'Please supply a valid two-letter language code like `en`, `es`, `fr` or `de`.';
    },
    filter: function(v) {
      return v.toLowerCase();
    }
  },{
    type: 'list',
    name: 'postPathMode',
    message: 'Choose URL path pattern for your posts:',
    default: defaultValues.postPathMode,
    choices: [
      'Static path',
      'Year',
      'Year/Month',
      'Year/Month/Day'
    ]
  },{
    type: 'input',
    name: 'itemsPerPage',
    message: 'How many articles per page?',
    default: defaultValues.itemsPerPage,
    validate: function(v) {
      return Number(v)> 0 ? true : 'Please supply a positive number.';
    },
    filter: function(v) {
      return Number(v);
    }
  },{
    type: 'input',
    name: 'defaultAuthor',
    message: 'Default name of author',
    default: defaultValues.defaultAuthor.name,
    validate: function(v) {
      return v ? true : 'Please supply at least a short name for your site.';
    }
  },{
    type: 'input',
    name: 'defaultAuthorEmail',
    message: 'Default email address of author',
    default: defaultValues.defaultAuthor.email,
    validate: function(v) {
      return (v.match(/^\S+@\S+$/)) ? true : 'Please supply a valid email address.';
    }
  },{
    type: 'input',
    name: 'twitterAccount',
    message: 'Twitter account name (optional)',
    default: defaultValues.twitterAccount,
    validate: function(v) {
      return (!v || v.match(/^[a-zA-z0-9_-]+$/)) ? true : 'Please supply a Twitter account name or leave field empty.';
    }
  },{
    type: 'input',
    name: 'deployCmd',
    message: 'CLI command to copy files to your live server (optional)',
    default: defaultValues.deployCmd
  },{
    type: 'checkbox',
    name: 'useSpecialFeature',
    message: 'Do you want to use the following special features?',
    default: defaultValues.useSpecialFeature,
    choices: [
      "Multiple authors",
      "RSS",
      "ATOM",
      "JSON-RSS",
      "Apple News",
      "Accelerated Mobile Pages",
      "Microsoft tiles",
      "ICS-Calendar",
      "GeoJSON",
      "AJAX"
    ]
  }
];

inquirer.prompt(questions).then(
  function (answers) {
    answers.theme = defaultValues.theme ? defaultValues.theme : themesAvailable[0];
    answers.defaultAuthor = {
      "email": answers.defaultAuthorEmail,
      "name": answers.defaultAuthor
    };
    delete answers.defaultAuthorEmail;

    var generator = new Generator(defaultValues);
    generator.buildBasicFiles(answers);
  },
  function(err) { console.error(err); process.exit(1); }
);