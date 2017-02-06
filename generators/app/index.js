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
      + 'Welcome to ' + chalk.green('sp-2013-framework') + '\n'
      + 'Modern JavaScript tools for SharePoint 2013'
    ));

    var prompts = [
      {
        type: 'input',
        name: 'client',
        message: 'First, please enter the clients name.',
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
      
      // Tests the connection first before continuing.
      spauth.getAuth(this.props.url, {
        username: this.props.username,
        password: this.props.password
      })
      .then(generateProjectFiles.call(this))
      .catch(function(error){
        console.log('\n\n' + chalk.red('ERROR: Installation failed.') 
            + 'sp-2013-framework failed when testing the connection to your sharepoint site.  The installation will continue but you will likely have to restart and try again.' + '\n\n');
        console.log('\n' + error + '\n');
      });

      function generateProjectFiles(options){

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

        // Encrypts the password
        var password = (function(){
          var cipher = crypto.createCipher('aes192', 'password');
          var encrypted = cipher.update(this.props.password, 'utf8', 'hex');
          encrypted += cipher.final('hex');
          return encrypted;
        }).bind(this)();

        
        // sharepoint.config.json
        this.fs.copyTpl(
          this.templatePath('dynamic/sharepoint.config.json'),
          this.destinationPath('sharepoint.config.json'), {
            username: this.props.username,
            password: password,
            url: this.props.url,
            client: this.props.client
          }
        );

        // seperates the site collection from the full url:
        var url = this.props.url.split('/').slice(0,3).join('/');
        var collection = this.props.url.split('/').slice(3).join('/');

        // custom.html
        this.fs.copyTpl(
          this.templatePath('dynamic/Build/html/custom.html'),
          this.destinationPath('Build/html/custom.html'), {
            openTag:'<%@',
            closeTag: '%>',
            url: url,
            collection: collection,
            client: this.props.client
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
    }
  },

  install: function () {
    this.installDependencies({
      callback: function(){
        this.spawnCommand('typings', ['install']);
      }.bind(this)
    });
  }
});
