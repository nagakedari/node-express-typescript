var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourceMaps = require('gulp-sourcemaps');
var del = require('del');
var watch = require('gulp-watch');

var tsProject = ts.createProject('tsconfig.json');
var outputDir = 'server';

gulp.task('clean', function () {
    return del([outputDir]);
});



gulp.task('scripts',['clean'], function() {
    return tsProject.src()//gulp.src("src/**/*.ts") // or tsProject.src()
        .pipe(sourceMaps.init())
        .pipe(tsProject())
        .pipe(sourceMaps.write())
        .pipe(gulp.dest(outputDir));
});

gulp.task('watch', ['scripts'],function () {
    watch('app/**/*.ts', function(){
        gulp.start('scripts');
    });
});

gulp.task('default', ['watch']);

