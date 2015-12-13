#!/usr/bin/env node

var gulp = require( 'gulp' );
var chug = require( 'gulp-chug' );

gulp.src( './gulpfile.js')
	.pipe( chug({
			  tasks:  [ 'build' ]
		}
	));
