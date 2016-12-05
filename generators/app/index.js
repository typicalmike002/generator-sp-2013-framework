'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var spauth = require('node-sp-auth');

module.exports = yeoman.Base.extend({
  prompting: function(){

    // Have Yeoman greet the developer.
    this.log(yosay( ''
      + 'Welcome to ' + chalk.green('sp-2013-framework') + '!!!\n'
      + 'Modern JavaScript tools for SharePoint 2013.'
    ));

    var prompts = [
      {
        type: 'input',
        name: 'client',
        message: 'First, please enter a name for this project.',
        default: this.appname
      },
      {
        type: 'input',
        name: 'url',
        message: 'Now I need a valid SharePoint url.',
        default: 'WARNING: Site URL must be specifed.'
      },
      {
        type: 'input',
        name: 'username',
        message: 'Next, I need a username with a permission level of atleast Contribute.',
        default: 'WARNING: Username must be specified.'
      },
      {
        type: 'input',
        name: 'password',
        message: 'And finally, the password.',
        default: 'WARNING: Password must be specified.'
      }
    ];

    return this.prompt(prompts).then(function (props) {
      // To access props later use this.props.someAnswer;
      this.props = props;
    }.bind(this));
  },

  writing: {
    config: function(){

      var that = this;
      
      // Tests the connection first before continuing.
      spauth.getAuth(that.props.url, {
        username: that.props.username,
        password: that.props.password
      })
      .then(generateProjectFiles)
      .catch(function(error){
        console.log('\n' + error + '\n');
        console.log('The installation failed to connect to a SharePoint site.  Make sure the credentials were entered correctly and try again.');
      });


      function generateProjectFiles(options){

        // Package.json
        that.fs.copyTpl(
          that.templatePath('dynamic/package.json'),
          that.destinationPath('package.json'), {
            client: that.props.client
          }
        );

        // bower.json
        that.fs.copyTpl(
          that.templatePath('dynamic/bower.json'),
          that.destinationPath('bower.json'), {
            client: that.props.client
          }
        );

        // Encrypts the password
        var password = (function(){
          var cipher = crypto.createCipher('aes192', 'password');
          var encrypted = cipher.update(that.props.password, 'utf8', 'hex');
          encrypted += cipher.final('hex');
          return encrypted;
        }).bind(that)();

        
        // sharepoint.config.json
        that.fs.copyTpl(
          that.templatePath('dynamic/sharepoint.config.json'),
          that.destinationPath('sharepoint.config.json'), {
            username: that.props.username,
            password: password,
            url: that.props.url,
            client: that.props.client
          }
        );

        // seperates the site collection from the full url:
        var url = that.props.url.split('/').slice(0,3).join('/');
        var collection = that.props.url.split('/').slice(3).join('/');

        // custom.html
        that.fs.copyTpl(
          that.templatePath('dynamic/Build/html/custom.html'),
          that.destinationPath('Build/html/custom.html'), {
            openTag:'<%@',
            closeTag: '%>',
            url: url,
            collection: collection,
            client: that.props.client
          }
        );

        // All other static files (no variables to inject)
        that.fs.copy(
          that.templatePath('static/**/*.*'),
          that.destinationRoot()
        );

        // All other static files with no name.
        that.fs.copy(
          that.templatePath('static/**/.*'),
          that.destinationRoot()
        );

        that.installDependencies();
      }
    }
  }
});
