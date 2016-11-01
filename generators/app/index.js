'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var fs = require('fs');
var path = require('path');

module.exports = yeoman.Base.extend({
  prompting: function(){

    // Have Yeoman greet the developer.
    this.log(yosay(
      'Welcome to ' + chalk.green('SP2013Framework') + '!!!'
    ));

    var prompts = [
      {
        type: 'input',
        name: 'client',
        message: 'Client Name',
        default: this.appname
      },
      {
        type: 'input',
        name: 'username',
        message: 'SP Username',
        default: 'USERNAME'
      },
      {
        type: 'input',
        name: 'password',
        message: 'SP Password',
        default: 'PASSWORD'
      }, 
      {
        type: 'input',
        name: 'url',
        message: 'SharePoint Url',
        default: 'SITEURL'
      }
    ];

    return this.prompt(prompts).then(function (props) {
      // To access props later use this.props.someAnswer;
      this.props = props;
    }.bind(this));
  },

  writing: {
    config: function(){

      // Package.json
      this.fs.copyTpl(
        this.templatePath('dynamic/package.json'),
        this.destinationPath('package.json'), {
          client: this.props.client
        }
      );

      // bower.json
      this.fs.copyTpl(
        this.templatePath('dynamic/bower.json'),
        this.destinationPath('bower.json'), {
          client: this.props.client
        }
      );

      // sharepoint.config.json
      this.fs.copyTpl(
        this.templatePath('dynamic/sharepoint.config.json'),
        this.destinationPath('sharepoint.config.json'), {
          username: this.props.username,
          password: this.props.password,
          url: this.props.url,
          client: this.props.client
        }
      );

      var that = this; // Needed for custom.html

      // custom.html
      this.fs.copyTpl(
        this.templatePath('dynamic/Build/html/custom.html'),
        this.destinationPath('Build/html/custom.html'), {
          openTag:'<%@',
          closeTag: '%>',
          url: (function(){
            return that.props.url.split('/').slice(0,3).join('/');
          }()),
          collection: (function(){
            return that.props.url.split('/').slice(3).join('/');
          }()),
          client: that.props.client
        }
      );

      // All other static files (no variables to inject)
      this.fs.copy(
        this.templatePath('static/**/*.*'),
        this.destinationRoot()
      );

      // All other static files with no name.
      this.fs.copy(
        this.templatePath('static/**/.*'),
        this.destinationRoot()
      );
    }
  },

  install: function(){
    this.installDependencies();
  }
});
