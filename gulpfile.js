const gulp = require('gulp4');
const uglifyes = require('uglify-es');
const composer = require('gulp-uglify/composer');
const uglify = composer(uglifyes, console);
const zip = require('gulp-zip');
const less = require('gulp-less');
const del = require('del');

gulp.task('pack:clean', function () {
    return del([
        'extension.zip',
        'build/**/*',
    ]);
});

gulp.task(
    'pack:compile_js',
    () => gulp.src(
        [
            '**/*.js',
            '!**/*.less',
            '!node_modules/**/*',
            '!build/**/*',
            '!build/*',
            '!gulpfile.js',
            '!deploy.js',
            '!lib/style/*',
            '!lib/style/**/*',
        ])
//         .pipe(uglify({
//             mangle: true,
//             compress: true
//         }))
        .pipe(gulp.dest('build'))
);

gulp.task(
    'pack:move_assets_and_html',
    () => gulp.src([
        'manifest.json',
        '*.css',
        '**/*.css',
        '*.html',
        '**/*.html',
        '*.png',
        '**/*.png',
        '*.svg',
        '**/*.svg',
        '*.woff2',
        '**/*.woff2',
        '!node_modules/**/*',
        '!node_modules/*',
        '!build/**/*',
        '!build/*',
    ]).pipe(gulp.dest('build'))
);

gulp.task(
    'pack:make-zip',
    () => gulp.src('build/**/*')
        .pipe(zip('extension.zip'))
        .pipe(gulp.dest('.'))
);

gulp.task('less', () => {
    return gulp.src(
        [
            './**/*.less',
            '!lib/style/*',
            '!lib/style/**/*',
            '!node_modules/*',
            '!node_modules/**/*',
        ])
        .pipe(less({ strictMath: true }))
        .on('error', swallowError)
        .pipe(gulp.dest('./'));
});

gulp.task('watch-less', () => {
    gulp.watch('./**/*.less', gulp.series('less'));
});

function swallowError(error) {
    console.log(error);
    this.emit('end')
}

gulp.task(
    'pack', 
    gulp.series(
        gulp.parallel(
            'pack:clean'
        ),
        gulp.parallel(
            'pack:compile_js',
            'less'
        ),
        'pack:move_assets_and_html', 
        'pack:make-zip'
    )
);

gulp.task('develop', gulp.series('less', 'watch-less'));

