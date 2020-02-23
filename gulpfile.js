const gulp = require('gulp');
const zip = require('gulp-zip');
const less = require('gulp-less');
const del = require('del');

gulp.task('clean',
    () => del([
        'extension.zip',
        'build/**/*',
    ])
);

gulp.task(
    'moveSource',
    () => gulp.src([
        'manifest.json',
        '**/*.css',
        '**/*.html',
        '**/*.png',
        '**/*.svg',
        '**/*.woff2',
        '**/*.js',
        '!**/*.less',
        '!gulpfile.js',
        '!deploy.js',
        '!node_modules/**/*',
        '!build/**/*',
        '!lib/css/**/*',
        '!images/readme/**/*',
    ]).pipe(gulp.dest('build'))
);

gulp.task(
    'makeZip',
    () => gulp.src('build/**/*')
        .pipe(zip('extension.zip'))
        .pipe(gulp.dest('.'))
);

gulp.task('less',
    () => gulp.src(
        [
            '**/*.less',
            //'!lib/css/**/*',
            '!node_modules/**/*',
        ])
        .pipe(less({strictMath: true}))
        .on('error', swallowError)
        .pipe(gulp.dest('./'))
);

gulp.task('watch-less', () => 
    gulp.watch('**/*.less', gulp.series('less'))
);

function swallowError(error) {
    console.log(error);
    this.emit('end')
}

gulp.task(
    'pack',
    gulp.series(
        'clean',
        'less',
        'moveSource',
        'makeZip'
    )
);

gulp.task('develop', gulp.series('less', 'watch-less'));

