var gulp = require('gulp');
var runSequence = require('run-sequence');
var Builder = require('systemjs-builder');
var inlineNg2Template = require('gulp-inline-ng2-template');
var path = require('path');
var sourcemaps = require('gulp-sourcemaps');
var paths = require('../paths');
var fs= require('fs');
var concat = require('gulp-concat');
var gulp = require('gulp');
var sass = require('gulp-sass');
var replace = require('gulp-replace');
var rename = require('gulp-rename');

gulp.task('build', function (callback) {
  return runSequence(
    'clean',
    'bundleProd',
    callback
  );
});

gulp.task('buildDev', function (callback) {
  return runSequence(
    'clean',
    'bundle',
    callback
  );
});

gulp.task('bundle', ['concatPrism', 'buildStatic', 'concatDeps']);
gulp.task('bundleProd', ['bundle', 'buildStaticMin', 'concatDepsMin']);

gulp.task('inlineTemplates', ['sass'], function() {
  return gulp.src(paths.source, { base: './' })
    .pipe(replace(/'(.*?\.css)'/g, '\'.tmp/$1\''))
    .pipe(inlineNg2Template({ base: '/' }))
    .pipe(gulp.dest(paths.tmp));
});

var JS_DEV_DEPS = [
  'lib/utils/browser-update.js',
  'node_modules/zone.js/dist/zone.js',
  'node_modules/reflect-metadata/Reflect.js',
  'node_modules/babel-polyfill/dist/polyfill.js'
];

var JS_DEV_DEPS_MIN = [
  'lib/utils/browser-update.js',
  'node_modules/zone.js/dist/zone.min.js',
  'node_modules/reflect-metadata/Reflect.js',
  'node_modules/babel-polyfill/dist/polyfill.min.js'
]

gulp.task('sass', function () {
  return gulp.src(paths.scss, { base: './' })
    .pipe(sass.sync({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(gulp.dest(paths.tmp));
});

// concatenate angular2 deps
gulp.task('concatDeps', ['buildStatic'], function() {
  return concatDeps(JS_DEV_DEPS, paths.redocBuilt + '.js');
});

gulp.task('concatDepsMin', ['buildStatic'], function() {
  return concatDeps(JS_DEV_DEPS_MIN, paths.redocBuilt + '.min.js');
});

gulp.task('buildStatic', ['inlineTemplates'], function(cb) {
  bundle(paths.redocBuilt + '.js', false, cb);
});

gulp.task('buildStaticMin', ['inlineTemplates'], function(cb) {
  bundle(paths.redocBuilt + '.min.js', true, cb);
});

function concatDeps(deps, file) {
  return gulp.src(deps.concat([file]))
  .pipe(sourcemaps.init({loadMaps: true}))
  .pipe(concat(file))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('.'))
}

function bundle(outputFile, minify, cb) {
  fs.existsSync('dist') || fs.mkdirSync('dist');
  var builder = new Builder('./', 'system.config.js');

  builder
    .buildStatic(path.join(paths.tmp, paths.sourceEntryPoint),
      outputFile,
      { format:'umd', sourceMaps: true, lowResSourceMaps: true, minify: minify }
    )
    .then(function() {
      // wait some time to allow flush
      setTimeout(() => cb(), 500);
    })
    .catch(function(err) {
      cb(new Error(err));
    });
}

gulp.task('concatPrism', function() {
  require('../../system.config.js');
  var prismFolder = System.normalizeSync('prismjs').substring(8);
  prismFolder = prismFolder.substring(0, prismFolder.length -3);
  var prismFiles = [
    'prism.js',
    'components/prism-actionscript.js',
    'components/prism-c.js',
    'components/prism-cpp.js',
    'components/prism-csharp.js',
    'components/prism-php.js',
    'components/prism-coffeescript.js',
    'components/prism-go.js',
    'components/prism-haskell.js',
    'components/prism-java.js',
    'components/prism-lua.js',
    'components/prism-matlab.js',
    'components/prism-perl.js',
    'components/prism-python.js',
    'components/prism-r.js',
    'components/prism-ruby.js',
    'components/prism-bash.js',
    'components/prism-swift.js',
    'components/prism-objectivec.js',
    'components/prism-scala.js'
  ].map(file => path.join(prismFolder, file));

  gulp.src(prismFiles)
  .pipe(concat(path.join(paths.tmp, 'prismjs-bundle.js')))
  .pipe(gulp.dest('.'))
});
