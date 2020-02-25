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

const clean = () => { return del([
    'extension.zip',
    'build/**/*',
])};
exports.clean = clean; 

const moveSource = () => {
    return gulp.src([
        'manifest.json',
        'options/**/*.html',
        'options/**/*.js',
        'images/**/*',
        '!images/readme/**/*',
        'src/**/*.js'
    ]).pipe(gulp.dest('./build'));
};
exports.moveSource = moveSource;

const jsBuild = () => {
    return gulp.parallel(
        buildJs('./src/js/gitlab-mr-summary.js', './build/gitlab-mr-summary.js'),
        buildJs('./src/js/background.js', './build/background.js'),
    );
};
exports.jsBuild = jsBuild;

const makeZip = () => {
    return gulp.src('build/**/*')
        .pipe(zip('extension.zip'))
        .pipe(gulp.dest('.'));
};
exports.makeZip = makeZip;

const lessBuild = () => {
    return gulp.parallel(
        buildLess('./src/css/gitlab-mr-summary.less', './build'),
        buildLess('./options/style.less', './build/options'),
    );
};
exports.lessBuild = lessBuild; 

const watchLess = () => {
    return gulp.watch('**/*.less', gulp.series(lessBuild));
};
exports.watchLess = watchLess;

exports.pack = gulp.series(
        clean,
        lessBuild,
        moveSource,
        makeZip
    );

exports.develop = gulp.series(lessBuild, watchLess);

