var gulp = require('gulp');
var babel = require('gulp-babel');
var concat = require("gulp-concat");
var sass = require('gulp-sass');

gulp.task('default', ['scripts']);

gulp.task('scripts', function() {
    return gulp.src(['./src/classes/*.js','./src/game.js'])
        .pipe(concat('game.js'))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('dist'))
        ;
});

gulp.task('style', function () {
    return gulp.src(['./src/**/*.scss'])
        .pipe(sass())
        .pipe(concat('app.css'))
        .pipe(gulp.dest('dist'))
        ;
});

gulp.task('watch', function() {
    gulp.watch('./src/**/*.js', ['scripts']);
    gulp.watch('./src/**/*.scss', ['style']);
});
