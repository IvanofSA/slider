'use strict';

import del from "del";
import fs from "fs";
import path from "path";
import gulp from "gulp";
import open from "open";
import rimraf from "rimraf";
import _ from "lodash";
import source from "vinyl-source-stream";
import buffer from "vinyl-buffer";
import gulpLoadPlugins from "gulp-load-plugins";
import packageJson from "./package.json";
import runSequence from "run-sequence";
import optipng from "imagemin-optipng";
import inject from "gulp-inject";

import browserSync from "browser-sync";
let reload = browserSync.reload;
let bs = browserSync.create();

import watchify from "watchify";
import browserify from "browserify";
import babelify from "babelify";

const PORT = process.env.PORT || 3000;
const $ = gulpLoadPlugins({camelize: true});

const PUBLIC_DIR = './public';
const SOURCES_DIR = './sources';

var sassConfig = {
	sassPath: './' + SOURCES_DIR + '/css',
	bowerDir: './bower_components'
};

var jsConfig = {
	vendorPath: SOURCES_DIR + '/js/vendor'
};


// Main Tasks
gulp.task('serve', () => runSequence('serve:clean', 'serve:start', 'indexGenerate'));
gulp.task('dist', () => runSequence('dist:clean', 'dist:build', 'web', 'indexGenerate', () => {
	open('http://localhost:' + PORT)
}));
gulp.task('auto-build', () => runSequence('dist:clean', 'dist:build'));
gulp.task('clean', ['dist:clean, serve:clean']);
gulp.task('open', () => open('http://localhost:' + PORT));

// Remove all built files
gulp.task('serve:clean', cb => del([PUBLIC_DIR + '/*', '!' + PUBLIC_DIR + '/.gitkeep'], {dot: true}, cb));
gulp.task('dist:clean', cb => del([PUBLIC_DIR + '/*', '!' + PUBLIC_DIR + '/.gitkeep'], {dot: true}, cb));

// Styles handling
gulp.task('serve:sass', () => {
	return gulp.src(sassConfig.sassPath + '/*.scss')
		.pipe($.sourcemaps.init())
		.pipe($.sass({
			outputStyle: 'compact'
		}).on('error', $.notify.onError(function (error) {
			return 'Error: ' + error.message;
		})))
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest(PUBLIC_DIR + '/css'))
		.pipe(browserSync.reload({stream: true}))
});

gulp.task('dist:sass', () => {
	return gulp.src(sassConfig.sassPath + '/*.scss')
		.pipe($.sourcemaps.init())
		.pipe($.sass({
			outputStyle: 'compressed'
		}).on('error', $.notify.onError(function (error) {
			return 'Error: ' + error.message;
		})))
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest(PUBLIC_DIR + '/css'))
		.pipe(browserSync.reload({stream: true}))
});

gulp.task('serve:pug', () => {
	return gulp.src(SOURCES_DIR + '/*.pug')
		.pipe($.pug({
			pretty: true
		}).on('error', $.notify.onError(function (error) {
			return 'Error: ' + error.message;
		})))
		.pipe($.prettify({indent_char: '	', indent_size: 1}))
		.pipe(gulp.dest(PUBLIC_DIR + '/'))
		.pipe(browserSync.reload({stream: true}));
});

gulp.task('serve:vendor-js', () => {
	return gulp.src(jsConfig.vendorPath + '/*.js')
		.pipe($.concat('vendor.js'))
		.on('error', $.notify.onError(function(error) {
			return 'Error: ' + error.message;
		}))
		.pipe(gulp.dest(PUBLIC_DIR + '/js'))
		.pipe(browserSync.reload({stream: true}));
});

gulp.task('dist:pug', () => {
	return gulp.src(SOURCES_DIR + '/*.pug')
		.pipe($.pug({
			pretty: true
		}).on('error', $.notify.onError(function (error) {
			return 'Error: ' + error.message;
		})))
		.pipe($.prettify({indent_char: '	', indent_size: 1}))
		.pipe(gulp.dest(PUBLIC_DIR + '/'))
		.pipe(browserSync.reload({stream: true}));
});

gulp.task('dist:vendor-js', () => {
	return gulp.src(jsConfig.vendorPath + '/*.js')
		.pipe($.concat('vendor.js')
			.on('error', $.notify.onError(function (error) {
				return 'Error: ' + error.message;
			}))
		)
		.pipe($.minify({
				ext:{
					min:'.js'
				},
				noSource: true
			})
				.on('error', $.notify.onError(function (error) {
					return 'Error: ' + error.message;
				}))
		)
		.pipe(gulp.dest(PUBLIC_DIR + '/js'));
});

gulp.task('serve:start', ['serve:sass', 'serve:images', 'serve:pug', 'serve:vendor-js', 'serve:static', 'watch', 'web-bs'], () => {
	// console.log(browserifyConfig.entryFile);
});

gulp.task('dist:build', ['dist:sass', 'dist:images', 'dist:pug', 'dist:static', 'lint', 'build-once', 'dist:vendor-js']);

gulp.task('dist:images', () => {
	return gulp.src([SOURCES_DIR + '/img/**/*'])
		.pipe($.image({

		})).on('error', $.notify.onError(function (error) {
			return 'Error: ' + error.message;
		}))
		.pipe(gulp.dest(PUBLIC_DIR + '/img/'));
});

gulp.task('serve:images', () => {
	return gulp.src([SOURCES_DIR + '/img/**/*'])
		.pipe($.changed(PUBLIC_DIR + '/img/'))
		.pipe(gulp.dest(PUBLIC_DIR + '/img/'));
});

gulp.task('serve:static', () => {
	return gulp.src([SOURCES_DIR + '/static/**/*'])
		.pipe($.changed(PUBLIC_DIR + '/'))
		.pipe(gulp.dest(PUBLIC_DIR + '/'))
});

gulp.task('dist:static', () => {
	return gulp.src([SOURCES_DIR + '/static/**/*'])
		.pipe(gulp.dest(PUBLIC_DIR + '/'))
});

gulp.task('lint', () => {
	return gulp.src(SOURCES_DIR + '/js/**/*.js')
		.pipe($.eslint())
		.pipe($.eslint.format());
	//.pipe($.eslint.failAfterError())
});


// ----------------------------------------------------------------------------

// Inject plugin --> generate index.html file

gulp.task('indexGenerate', () => {
	return gulp.src(PUBLIC_DIR + '/_pages.html')
		.pipe($.inject(
			gulp.src([PUBLIC_DIR + '/*.html'], {read:false}), {
				transform: function(filepath){
					if(filepath.slice(-5) === '.html'){
						var regName = /(\/public\/)|(\.html)/gi,
							fileName = filepath.replace(regName, ''),
							cleanPath = fileName + '.html';

						return '<li class="list__item"><a href="' + cleanPath + '" class="list__link">' + fileName + '</a></li>';
					}
					return inject.transform.apply(inject.transform, arguments);
				}
			}
		))
		.pipe(gulp.dest(PUBLIC_DIR))
});

// ----------------------------------------------------------------------------

// browserify

import config from './config.json';
let bundler = config.bundler;

console.log(bundler);

function initBundles(bundler, watch){

	for (let i in bundler) {

		if (bundler.hasOwnProperty(i)) {

			if (bundler[i].bundler){
				return false;
			}

			// bundler[i].bundler = watchify(browserify(bundler[i].filepath + bundler[i].filename, { debug: true }).transform(babelify));

			bundler[i].bundler = browserify({
				entries: [bundler[i].filepath + bundler[i].filename],
				cache: {},
				packageCache: {},
				poll: false,
				debug: true
			}).transform(babelify);

			bundler[i].bundler.on('update', () => {
				console.log('update triggered');
			});

			// if (watch){
			// 	bundler[i].bundler.on('update', () => {
			// 		console.log(`Bundling ${bundler[i].bundlename}...`);
			// 		let timeStart = new Date().getTime();
			// 		makeBundle(i, bundler[i].bundlename, () => {
			// 			let timeFinish = new Date().getTime();
			// 			console.log(`Success >> bundling ${bundler[i].bundlename} in ${timeFinish - timeStart}ms`);
			// 		});
			// 	});
			// }

			makeBundle(i, bundler[i].bundlename);
		}

	}
}

function makeBundle(name, bundlename, cb){

	if (typeof bundler[name] === "undefined"){
		console.error(`ERROR: can't find bundle ${name}`);
		return false;
	}

	bundler[name].bundler.bundle()
		.on('error', function(err) { console.error(err); this.emit('end'); })
		.on('end', function(){
			if (typeof cb === "function"){
				cb();
			}
		})
		.pipe(source(bundlename))
		.pipe(buffer())
		.pipe($.sourcemaps.init({ loadMaps: true }))
		.pipe($.sourcemaps.write('./'))
		.pipe(gulp.dest(PUBLIC_DIR + '/js/'))
		.pipe(reload({stream: true}));

}

gulp.task('js-build', () => {
	for (let i in bundler){
		if (bundler.hasOwnProperty(i)){

			console.log(`Bundling ${bundler[i].bundlename}...`);
			let timeStart = new Date().getTime();
			makeBundle(i, bundler[i].bundlename, () => {
				let timeFinish = new Date().getTime();
				console.log(`Success >> bundling ${bundler[i].bundlename} in ${timeFinish - timeStart}ms`);
			});
		}
	}
})

gulp.task('js-clean', (cb) => {
	rimraf(PUBLIC_DIR + '/js/', cb);
});

gulp.task('build-once', ['js-clean'], () => {
	return initBundles(bundler, false);
});

gulp.task('build-persistent', ['js-clean'], () => {
	return initBundles(bundler, true);
});

gulp.task('build', ['build-persistent'], () => {
	process.exit(0);
});

gulp.task('web-bs', ['build-persistent'], () => {

	browserSync({
		server: {
			baseDir: PUBLIC_DIR
		}
	});

	return initBundles(bundler, true);
});

// WEB SERVER
gulp.task('web', () => {
	browserSync({
		server: {
			baseDir: PUBLIC_DIR
		}
	});
});

gulp.task('watch', () => {
	gulp.watch(['css/**'], {cwd: SOURCES_DIR + '/'}, ['serve:sass']);
	gulp.watch(['js/**'], {cwd: SOURCES_DIR + '/'}, ['js-build']);
	gulp.watch(['*.pug', 'layout/**/*.pug'], {cwd: SOURCES_DIR + '/'}, ['serve:pug']);
	gulp.watch(['static/**'], {cwd: SOURCES_DIR + '/'}, ['serve:static']);
	gulp.watch(['img/**/*.svg', 'img/**/*.jpg', 'img/**/*.jpeg', 'img/**/*.png', 'img/**/*.bmp'], {cwd: SOURCES_DIR + '/'}, ['serve:images']);
	//gulp.watch([SOURCES_DIR + '/js/*.js'], ['serve:js']);
	//gulp.watch([SOURCES_DIR + '/css/*.scss'], ['serve:sass']);
});