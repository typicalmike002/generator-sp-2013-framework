'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');

describe('generator-sp-2013-framework', function () {
  before(function () {
    return helpers.run(path.join(__dirname, '../generators/app'))
      .withPrompts({someAnswer: true})
      .toPromise();
  });

  it('generates a fresh SharePoint architecture.', function () {
    assert.file([
      '.bowerrc',
      '.gitignore',
      '.npmrc',
      'gulpfile.js',
      'README.md',
      'tsconfig.json',
      'typings.json',
      'webpack.config.js',
      'bower.json',
      'package.json',
      'sharepoint.config.json',
      'Branding/css/style.css',
      'Branding/css/style.min.css',
      'Branding/fonts/ARIALN_2.eot',
      'Branding/fonts/ARIALN_2.svg',
      'Branding/fonts/ARIALN_2.TTF',
      'Branding/fonts/ARIALN_2.woff',
      'Branding/images/ajax_loader.gif',
      'Branding/js/main.min.js',
      'Branding/js/main.min.js.map',
      'Branding/js/webparts/example.min.js',
      'Branding/js/webparts/example.min.js.map',
      'Build/html/custom.html',
      'Build/html/webparts/example.html',
      'Build/sass/foundation/_basic.scss',
      'Build/sass/foundation/_enhanced.scss',
      'Build/sass/global/_variables.scss',
      'Build/sass/layout/_grid.scss',
      'Build/sass/webparts/_example.scss',
      'Build/sass/style.scss',
      'Build/ts/main.ts',
      'Build/ts/modules/functions.ts',
      'Build/ts/modules/classes.ts',
      'Build/ts/webparts/example.ts',
    ]);
  });
});
