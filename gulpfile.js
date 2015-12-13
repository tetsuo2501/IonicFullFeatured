var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var jshint = require('gulp-jshint');
var jshintStylish = require('jshint-stylish');
var wiredep = require('wiredep').stream;
var inject = require('gulp-inject');
var rimraf = require('rimraf');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var browserSync = require('browser-sync').create();
var ts = require('gulp-typescript');
var karma = require('karma').Server;
var dir = require('path');
var debug = require('gulp-debug');
var runSequence = require('run-sequence');

var paths = {
  dev: './dev',
  dest :'./www',
  tmp: './tmp/',    
  typings: './typings/'
};

var sub = {
  components: '/components/',
  css: '/css/',
  inject: '/inject',
  wiredep: '/wiredep',
  scripts: '/scripts',
  style: '/style/',
  ts: '/tsScripts',
  test: '/test'
};

var sel = {
  all: '/**/*.*',
  alljs: '/**/*.js',
  allhtml: '/**/*.html',
  allsass: '/**/*.scss',
  allcss: '/**/*.css',
  allts: '/**/*.ts'
};

var not = '!';

gulp.task('default', ['sass']);

gulp.task('sass', ['clean'], function(done) {
  gulp.src(paths.dev + sub.style + sel.allsass)
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest(paths.tmp + sub.css))
    
    /*
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest(paths.cssDest))
    */

    .on('end', done)    
    .pipe(browserSync.stream());
});
gulp.task('wiredep-karma', ['clean'], function(){
  return gulp.src('karma.conf.js')
    .pipe(wiredep({
      fileTypes: {
        js: {
          block: /(([ \t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
          detect: {
            js: /['\']([^'\']+\.js)['\'],?/gi,
            css: /['\']([^'\']+\.js)['\'],?/gi
          },
          replace: {
            js: '"{{filePath}}",',
            css: '"{{filePath}}",'
          }
        }
      }
    }))
    .pipe(gulp.dest('./'));
});

gulp.task('typescriptTest', ['clean'], function() {
  return gulp.src([paths.dev + sub.test + sel.allts, paths.typings + 'tsd.d.ts'])
    .pipe(ts()).js
    .pipe(gulp.dest(paths.tmp + sub.test))
});

gulp.task('test', ['clean', 'wiredep-karma','typescriptTest','tsCompile','lint'], function (done) {
  new karma({
    configFile: dir.resolve('karma.conf.js'),
    singleRun: true
  }, done).start();
});

gulp.task('lint', function () {
  gulp.src(paths.dev + sub.scriptjs + sel.alljs)
    .pipe(jshint())
    .pipe(jshint.reporter(jshintStylish));
    
});

gulp.task('wiredep', ['clean'], function() {
    gulp.src([paths.dev + sel.allhtml, not + paths.dev + sub.components + '/**'])
      .pipe(wiredep({
          exclude: ['ionic/scss/','ionic/release/css']
      }))
      .pipe(gulp.dest(paths.tmp+sub.wiredep));
});

gulp.task('mmm', function() {
  gulp.src(paths.dev+sub.components+'/**/*.{js,css,eot,woff,svg,ttf}')
    .pipe(debug())
    .pipe(gulp.dest(paths.tmpnject+ sub.components));
    console.log()
});

gulp.task('prepareInject',['clean','sass','tsCompile'], function (callback) {
      //Copy all html for processing inject
  gulp.src([paths.tmp + sub.wiredep + sel.allhtml])
    .pipe(gulp.dest(paths.tmp + sub.inject))
  //Copy all js scripts
  gulp.src([paths.dev + sub.scripts + sel.alljs])
    .pipe(gulp.dest(paths.tmp + sub.inject + sub.scripts));
  //Copy all css
   gulp.src(paths.tmp + sub.css + sel.allcss)
    .pipe(gulp.dest(paths.tmp + sub.inject + sub.style));
  /*gulp.src(paths.tmp + sub.ts + sel.allts)
    .pipe( gulp.dest(paths.tmp + sub.inject));*/
  //Copy TS Scripts    
    gulp.src( paths.tmp + sub.ts + '/dev/' + sub.ts + sel.alljs)
      .pipe( gulp.dest( paths.tmp + sub.inject + sub.scripts + sub.ts));
  //Copy all js and css from bower components
  gulp.src([
    paths.dev+sub.components+'/**/*.{js,css,eot,woff,svg,ttf}',
    not + paths.dev + sub.components + '/angular-mocks' + sel.all
  ])
    .pipe(gulp.dest(paths.tmp + sub.inject+ sub.components));
  return callback();
});

gulp.task('inject', ['clean','sass','wiredep','test','prepareInject'], function(cb){
  return gulp.src([paths.tmp + sub.inject + sel.allhtml])
    .pipe(
      inject(
          gulp.src(
            [
              paths.tmp + sub.inject + sub.style + sel.allcss,
              paths.tmp + sub.inject + sub.scripts + sel.alljs
            ],
            {read: false} ),
          {relative: true}
      ))
    .pipe( gulp.dest( paths.tmp + sub.inject ))    
    .pipe(browserSync.stream());
  });

gulp.task( 'tsCompile', ['clean'], function () {
  var proj = ts.createProject('tsconfig.json');
  return proj.src()
    .pipe( ts(proj) ).js
    .pipe( gulp.dest(paths.tmp + sub.ts ));
});


gulp.task('build',['clean','inject'], function () {
  return gulp.src(paths.tmp + sub.inject + sel.allhtml)
    .pipe(debug())
    .pipe(useref())
    .pipe(gulp.dest(paths.dest));
});

gulp.task('azz', function () {
  gulp.src('./tmp/inject/**/*.html')
    .pipe(useref())
    .pipe( gulp.dest('./2'));
});





gulp.task('watch', ['build'], function() {
  gulp.watch( [
    paths.dev + sub.style +sel.allsass,
    paths.dev + sub.scriptjs + sel.alljs,
    paths.dev + sub.ts + sel.allts,
    paths.dev + sel.allhtml],
    ['build'] ).on('change', browserSync.reload);;
});

gulp.task('serve',['inject'], function () {
   browserSync.init({
        server: {
            baseDir: paths.tmp + sub.inject
        }
    });

  gulp.watch(paths.dev + sub.style +sel.allsass, ['inject', browserSync.reload()]);
  gulp.watch(paths.dev + sub.scriptjs + sel.alljs, ['inject', browserSync.reload()] );
  gulp.watch(paths.dev + sub.ts + sel.allts, ['inject', browserSync.reload()] );
  gulp.watch(paths.dev + sel.allhtml, ['inject'] ).on('change', browserSync.reload);;
  
});

gulp.task('clean', function (cb) {
  rimraf(paths.tmp, cb);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});
