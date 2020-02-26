const gulp = require('gulp');
const zip = require('gulp-zip');
const less = require('gulp-less');
const del = require('del');
const rollup = require('rollup');
const babel = require('rollup-plugin-babel');

const buildJs = (inputFile, outputFile) => {
    return async cb => {
        let bundle = await rollup.rollup({
            input: inputFile,
            plugins: [
                babel({
                    exclude: 'node_modules/**', // only transpile our source code
                }),
            ],
        });

        await bundle.write({
            file: outputFile,
            format: 'iife',
            sourcemap: true,
        });

        cb();
    };
};

const buildLess = (inputs, output) => {
    return cb => {
        gulp.src(inputs)
            .pipe(less({strictMath: true}))
            .on('error', swallowError)
            .pipe(gulp.dest(output));
        cb();
    };
};

function swallowError(error) {
    console.log(error);
    this.emit('end')
}

const clean = () => {
    return del([
        'extension.zip',
        'build/**/*',
    ])
};

const moveStaticSource = gulp.parallel(
    function copyManifest() {return gulp.src(['manifest.json']).pipe(gulp.dest('./build'))},
    function copyOptions() {return gulp.src(['options/**/*.html', 'options/**/*.js',]).pipe(gulp.dest('./build/options'))},
    function copyImages() {return gulp.src(['images/**/*', '!images/readme/**/*',]).pipe(gulp.dest('./build/images'))},
);

const jsBuild = gulp.parallel(
    buildJs('./src/js/gitlab-mr-summary.js', './build/gitlab-mr-summary.js'),
    buildJs('./src/js/background.js', './build/background.js'),
    function copyOriginalJs() {return gulp.src(['src/**/*.js', "!**/gitlab-mr-summary.js", '!**/background.js']).pipe(gulp.dest('./build'))},
);

const makeZip = () => {
    return gulp.src('build/**/*')
        .pipe(zip('extension.zip'))
        .pipe(gulp.dest('.'));
};

const lessBuild = gulp.parallel(
    buildLess('./src/css/gitlab-mr-summary.less', './build'),
    buildLess('./options/style.less', './build/options'),
);

function watch(done) {
    gulp.watch(['**/*.less', '!build/**/*', '!node_modules/**/*'], lessBuild);
    gulp.watch(['**/*.js', '!build/**/*', '!node_modules/**/*'], jsBuild);
    gulp.watch(['**/*', '!src/**/*.js', '!**/*.less', '!build/**/*', '!node_modules/**/*'], moveStaticSource);
    done();
}


exports.watch = watch;
exports.lessBuild = lessBuild;
exports.jsBuild = jsBuild;
exports.makeZip = makeZip;
exports.moveStaticSource = moveStaticSource;
exports.clean = clean;

exports.build = gulp.series(clean, gulp.parallel(lessBuild, jsBuild, moveStaticSource));
exports.develop = gulp.series(clean, gulp.parallel(lessBuild, jsBuild, moveStaticSource), watch);
exports.pack = gulp.series(clean, gulp.parallel(lessBuild, jsBuild, moveStaticSource), makeZip);
