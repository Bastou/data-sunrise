// options
//var proxy = "http://localhost/Gobelins/data-sunrise/";
var proxy = "http://localhost:8888/creativecoding/data-sunrise/";


// modules
var gulp         = require('gulp');
var browserSync  = require('browser-sync');
var jslint       = require('gulp-jslint'); 
var reload       = browserSync.reload;


// Static Server + watching scss/html/js/json files
gulp.task('serve', ['jslint'], function() {

    browserSync({
        proxy: proxy
    });

    gulp.watch('*.js').on('change', browserSync.reload);
});


 
gulp.task('jslint', function () {
    return gulp.src(['**/*.js'])
            .pipe(jslint())
});


gulp.task('default', ['serve']);