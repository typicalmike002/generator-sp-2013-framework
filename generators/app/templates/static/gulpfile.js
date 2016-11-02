/**
 * gulpfile.js
 *
 * - Contains compile, push, and pull methods which can be run
 *   on the command line.
 */

var gulp = require('gulp'),
    path = require('path'),
    sp = require('./sharepoint.config.json'),
    sppull = require('sppull').sppull,
    colors = require('colors'),
    del = require('del'),
    crypto = require('crypto');

var onError = function(err){
    console.log(err);
    this.emit('end');
};

var password = (function(){
    var decipher = crypto.createDecipher('aes192', 'password');
    var encrypted = sp.password;
    var decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
})();

var creds = {
    username: sp.username,
    password: password
};




/**
 * Matchdep
 * 
 * - Automatically loads all package.json developer dependencies prefixed with 'gulp-'.
 */

require('matchdep').filterDev('gulp*').forEach(function( module ) {
    var module_name     = module.replace(/^gulp-/, '').replace(/-/, '');
    global[module_name] = require( module );
});




/**
 * gulp watch
 *
 * - Multiple push tasks are used to reduce the
 *   amount of time each change will takes to compile.
 */

gulp.task('watch', function(){

    gulp.watch('Build/sass/**/*.scss', ['push:css']);
    gulp.watch('Build/ts/*.ts', ['push:js']);
    gulp.watch('Banding/{images,fonts}/*.{png,jpg,gif,svg,eto,ttf,eot,woff}', ['push:misc']);
    gulp.watch('Build/html/*.html', ['push:masterpage']);
    gulp.watch([
        'Build/html/webparts/*.html',
        'Build/ts/webparts/*.ts'
    ], ['push:webparts']);
    gulp.watch([
        '!sharepoint.config.json',
        '*.{rb,json}'
    ], ['push:config']);
    gulp.watch('Branding/libraries/**/*.js', ['push:libraries']);

    console.log('SharePointBuild2013 now waiting for changes...');
});




/**
 * gulp compile:css
 *
 * - Generates a .css and .min.css version of the 
 *   resulting css.  
 */

gulp.task('compile:css', function(){
    return gulp.src('./Build/sass/**/*.scss')
        .pipe(sass())
        .pipe(postcss([
            require('autoprefixer')({ browsers: ['last 2 versions'] }),
            require('css-mqpacker')
        ]))
        .pipe(gulp.dest('./Branding/css'))
        .pipe(postcss([
            require('cssnano')
        ]))
        .pipe(rename({
            extname: '.min.css'
        }))
        .pipe(gulp.dest('./Branding/css'))
});




/**
 * gulp compile:js
 *
 * - See the ./webpack.config.js file to view JavaScript Compiling options. 
 */

gulp.task('compile:js', function(){
    return gulp.src('./Build/ts/**/*.ts')
        .pipe(webpack(require('./webpack.config.js')))
        .pipe(gulp.dest('./Branding/js'))
});




/**
 * gulp push:css
 */

gulp.task('push:css', ['compile:css', 'push:sass'], function(){
    return gulp.src('./Branding/css/*.css')
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(spsave({
            siteUrl     : sp.siteUrl,
            folder      : sp.dir.branding + '/css/',
            flatten     : false
        }, creds))
});



/**
 * gulp push:js
 */

gulp.task('push:js', ['compile:js', 'push:ts'], function(){
    return gulp.src('./Branding/js/*.{js,map}')
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(spsave({
            siteUrl     : sp.siteUrl,
            folder      : sp.dir.branding + '/js/',
            flatten     : false
        }, creds))
});




/**
 * gulp push:libraries
 */

gulp.task('push:libraries', function(){
    return gulp.src('./Branding/libraries/**/*.js')
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(spsave({
            siteUrl     : sp.siteUrl,
            folder      : sp.dir.branding + '/libraries/',
            flatten     : false
        }, creds))
});




/**
 * gulp push:misc
 */

gulp.task('push:misc', function(){
    return gulp.src('./Branding/{images,fonts}/**/*.{png,jpg,gif,svg,eto,ttf,eot,woff}')
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(spsave({
            siteUrl     : sp.siteUrl,
            folder      : sp.dir.branding,
            flatten     : false
        }, creds))
});




/**
 * gulp push:masterpage
 */

gulp.task('push:masterpage', function(){
    return gulp.src('./Build/html/*.html')
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(spsave({
            siteUrl     : sp.siteUrl,
            folder      : sp.dir.branding,
            flatten     : false
        }, creds))
});




/**
 * gulp push:webparts
 */

gulp.task('push:webparts', ['compile:js', 'push:ts'], function(){
    return gulp.src([
            './Build/html/webparts/**/*.html',
            './Branding/js/webparts/*.{js,map}'
        ])
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(tap(function(file){
            var webpartFolder = path.basename(file.path).replace(/\.(.*?)$/, '');
            return gulp.src(file.path)
                .pipe(spsave({
                    siteUrl     : sp.siteUrl,
                    folder      : sp.dir.webparts + '/' + webpartFolder,
                    flatten     : false
            }, creds))
        }))
});




/**
 * gulp push:config
 */

gulp.task('push:config', function(){
    return gulp.src([
        'typings.json',
        'bower.json',
        'package.json'
    ])
    .pipe(plumber({
        errorHandler: onError
    }))
    .pipe(spsave({
        siteUrl     : sp.siteUrl,
        folder      : sp.dir.branding + '/config/',
        flatten     : false
    }, creds))
});




/**
 * gulp push:ts
 */

gulp.task('push:ts', function(){
    return gulp.src(['Build/ts/**/*.ts'])
    .pipe(plumber({
        errorHandler: onError
    }))
    .pipe(spsave({
        siteUrl     : sp.siteUrl,
        folder      : sp.dir.branding + '/js/ts/',
        flatten     : false
    }, creds))
});




/**
 * gulp push:sass
 */

gulp.task('push:sass', function(){
    return gulp.src(['Build/sass/**/*.scss'])
    .pipe(plumber({
        errorHandler: onError
    }))
    .pipe(spsave({
        siteUrl     : sp.siteUrl,
        folder      : sp.dir.branding + '/css/sass/',
        flatten     : false
    }, creds))
});




/**
 * gulp push:sharepoint
 * 
 * - Combines all push tasks
 */

gulp.task('push:sharepoint', ['push:css', 'push:js', 'push:webparts', 'push:misc', 'push:masterpage', 'push:config', 'push:libraries']);




/**
 * Object: spPullCreds
 *
 * - Supplies login credentials to the sppull argument.
 */

var spPullCreds = {
    username: sp.username,
    password: password,
    siteUrl: sp.siteUrl
};




/**
 * Functions: onPullComplete(files), onPullError(err)
 *
 * - Default actions used for sppull promise. 
 */

var onPullComplete = function(files){
    for (var i = 0, l = files.length; i < l; i++){
        console.log(files[i].ServerRelativeUrl.green + ' has been downloaded into ' + files[i].SavedToLocalPath.green);
    }
}

var onPullError = function(err){
    console.log(err.red);
}




/**
 * gulp pull:masterpage
 */

gulp.task('pull:masterpage', function(){

    sppull(spPullCreds, {
            spRootFolder: sp.dir.masterpage,
            dlRootFolder: './Build/html',
            strictObjects: [
                '/custom.html'
            ]
        }
    ).then(onPullComplete)
     .catch(onPullError);
});




/**
 * gulp pull:webparts
 */

gulp.task('pull:webparts', function(){

    sppull(spPullCreds, {
        spRootFolder: sp.dir.webparts,
        dlRootFolder: './webpartsTemp'
    })
    .then(function(files){ 

        for (var i = 0, l = files.length; i < l; i++){

            (function(localPath){
                if (/\.html$/.test(localPath)) {
                    return gulp.src(localPath)
                        .pipe(gulp.dest('./Build/html/webparts', {overwrite: true}))
                } else {
                    return gulp.src(localPath)
                        .pipe(gulp.dest('./Branding/js/webparts', {overwrite: true}))
                }
            }(files[i].SavedToLocalPath));

            console.log(files[i].ServerRelativeUrl.green + ' has been downloaded into ' + files[i].SavedToLocalPath.green);
        }

        del('./webpartsTemp');
    })
    .catch(onPullError);
});




/**
 * gulp pull:css
 */

gulp.task('pull:css', function(){

    sppull(spPullCreds, {
        spRootFolder: sp.dir.branding + '/css',
        dlRootFolder: './cssTemp'
    })
    .then(function(files){

        for (var i = 0, l = files.length; i < l; i++){

            console.log(files[i].ServerRelativeUrl.green + ' has been downloaded into ' + files[i].SavedToLocalPath.green);

            (function(localPath){

                if (/\.css$/.test(localPath) || /\.map$/.test(localPath)) {
                    return gulp.src(localPath)
                        .pipe(gulp.dest('./Branding/css', {overwrite: true}))
                
                } else {

                    var sassDir = './Build' + localPath.replace(/\.\/cssTemp\//, '');
                    return gulp.src(localPath)
                        .pipe(gulp.dest(sassDir.substring(0, sassDir.lastIndexOf('/')), {overwrite: true}))
                }

            }(files[i].SavedToLocalPath));
        }

        del('./cssTemp');
    })
    .catch(onPullError)
});




/**
 * gulp pull:js
 */

gulp.task('pull:js', function(){

    sppull(spPullCreds, {
        spRootFolder: sp.dir.branding + '/js',
        dlRootFolder: './jsTemp'
    })
    .then(function(files){

        for (var i = 0, l = files.length; i < l; i++){

            console.log(files[i].ServerRelativeUrl.green + ' has been downloaded into ' + files[i].SavedToLocalPath.green);

            (function(localPath){

                if (/\.js$/.test(localPath) || /\.map$/.test(localPath)) {
                    return gulp.src(localPath)
                        .pipe(gulp.dest('./Branding/js', {overwrite: true}))
                } else {
                    var tsDir = './Build' + localPath.replace(/\.\/jsTemp\//, '');
                    return gulp.src(localPath)
                        .pipe(gulp.dest(tsDir.substring(0, tsDir.lastIndexOf('/')), {overwrite: true}))
                }

            }(files[i].SavedToLocalPath));
        }

        del('./jsTemp');
    })
    .catch(onPullError)
});




/**
 * gulp pull:config
 */

gulp.task('pull:config', function(){

    sppull(spPullCreds, {
        spRootFolder: sp.dir.branding + '/config',
        dlRootFolder: './',
        strictObjects: [
            '/package.json',
            '/bower.json',
            '/typings.json'
        ]
    })
    .then(onPullComplete)
    .catch(onPullError)
});




/**
 * gulp pull:libraries
 */

gulp.task('pull:libraries', function(){

    sppull(spPullCreds, {
        spRootFolder: sp.dir.branding + '/libraries',
        dlRootFolder: './Branding/libraries'
    })
    .then(onPullComplete)
    .catch(onPullError)
});



/**
 * gulp pull:images
 */

gulp.task('pull:images', function(){

    sppull(spPullCreds, {
        spRootFolder: sp.dir.branding + '/images',
        dlRootFolder: './Branding/images'
    })
    .then(onPullComplete)
    .catch(onPullError)
});



/**
 * gulp pull:fonts
 */

gulp.task('pull:fonts', function(){

    sppull(spPullCreds, {
        spRootFolder: sp.dir.branding + '/fonts',
        dlRootFolder: './Branding/fonts'
    })
    .then(onPullComplete)
    .catch(onPullError)
});
