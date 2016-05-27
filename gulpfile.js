var gulp = require('gulp');
var babel = require('gulp-babel');
var concat = require("gulp-concat");

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

gulp.task('watch', function() {
    gulp.watch('./src/**/*.js', ['scripts']);
});
