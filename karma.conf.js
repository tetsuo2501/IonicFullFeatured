module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],

    files: [
      	// bower:js
      	'dev/components/angular/angular.js',
      	'dev/components/angular-animate/angular-animate.js',
      	'dev/components/angular-sanitize/angular-sanitize.js',
      	'dev/components/angular-ui-router/release/angular-ui-router.js',
      	'dev/components/ionic/release/js/ionic.js',
      	'dev/components/ionic/release/js/ionic-angular.js',
      	// endbower
      	'dev/components/angular-mocks/angular-mocks.js',
    	'dev/scripts/*.js',
    	'tmp/tsScripts/dev/tsScripts/*.js',
    	'dev/test/**/*.js',
    	'tmp/test/**/*.js'
    ],
    reporters: ['nyan'],
    browsers: ['PhantomJS'],
    singleRun: true,
    phantomjsLauncher: {
      // Have phantomjs exit if a ResourceError is encountered (useful if karma exits without killing phantom) 
      exitOnResourceError: true
    }

  });
};