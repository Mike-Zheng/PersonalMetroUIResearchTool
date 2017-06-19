//2016/2/11 Mike
var gulp = require('gulp'),
    plumber = require('gulp-plumber'),
    sass = require('gulp-sass'),
    watch = require('gulp-watch'),
    minifycss = require('gulp-minify-css'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    sourcemaps = require('gulp-sourcemaps'),
    connect = require('gulp-connect'),
    del = require('del'),
    gutil = require('gulp-util'),
    colors = gutil.colors,
    shell = require('gulp-shell'),
    read = require('read-file'),
    writeFile = require('write'),
    open = require('gulp-open');

var paths = {
    'root': './public/',
    'style': {
        src: './scss/**.scss',
        output: './public/css/'
    },
    'js': {
        src: './js/**.js',
        output: './public/js/'
    },
    'html': {
        src: './app/**.html',
        output: './public/'
    }
};

//自動更新及localhost server開發
gulp.task('connect', function() {
    connect.server({
        root: paths.root,
        livereload: true
    });
    gulp.src(paths.root).pipe(open({ uri: 'http://localhost:8080' }));
});

//重置
gulp.task('clean', function() {
    return del(['build']);
});

// Sass編譯任務
gulp.task('sass', ['clean'], function() {
    console.log('\n ' + colors.red('•') + colors.yellow(' [scss] ') + '編譯scss');
    return gulp.src([paths.style.src])
        .pipe(sourcemaps.init())
        .pipe(plumber()) // 使用 gulp-plumber 處理例外
        .pipe(sass({
                // outputStyle: 'nested'
                outputStyle: 'compressed'
            })
            .on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(minifycss({ keepSpecialComments: 1 }))
        .pipe(gulp.dest(paths.style.output))
        .pipe(connect.reload());

});

//Js壓縮任務
gulp.task('concatJs', ['clean'], function() {
    console.log('\n ' + colors.red('•') + colors.green(' [js] ') + '編譯js');
    return gulp.src([paths.js.src])
        .pipe(sourcemaps.init())
        .pipe(plumber())
        //.pipe(uglify({output: {comments: /^!|@preserve|@license|@cc_on/i}}))
        .pipe(concat('miz.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.js.output))
        .pipe(connect.reload());

});




//ejs 編譯任務
//gulp.task('renderEJS', function() {
//    gulp.src("./views/*.ejs")
//        .pipe(ejs({}, { ext: '.html' }))
//        .pipe(gulp.dest("./app/"));
//});


gulp.task('openSublime', function() {
    //shell.task('sublime .')
});



//update_icomoon_font_icon
// gulp.task('updateIcomoonFontIcon', function() {
//     read('./font/icomoon/style.css', 'utf8', function(err, buffer) {
//         var t = buffer.match(/\.icon-[a-zA-Z_\-0-9]*:before\s?\{\s*content:\s*"[\\A-Za-z0-9]*";\s*}/g);
//         if (!(t && t.length)) return;

//         writeFile('./scss/icon.scss', '\n\n@include font-face("icomoon", font-files("icomoon/fonts/icomoon.eot", "icomoon/fonts/icomoon.woff", "icomoon/fonts/icomoon.ttf", "icomoon/fonts/icomoon.svg"));\n[class^="icon-"], [class*=" icon-"] {\n  font-family: "icomoon"; speak: none; font-style: normal; font-weight: normal; font-variant: normal; text-transform: none; line-height: 1;\n  @include font-smoothing(antialiased);\n}\n\n' + t.join('\n'), function(err) {
//             if (err) console.log('\n ' + colors.red('•') + colors.red(' [錯誤] ') + '寫入檔案失敗！');
//             else console.log('\n ' + colors.red('•') + colors.yellow(' [icon] ') + '更新 icon 惹，目前有 ' + colors.magenta(t.length) + ' 個！');
//         });
//     });
// });



//任務"css"負責'sass'這個版型相關的編譯任務
gulp.task('css', ['sass']);
//任務"concatJs"負責'js壓縮任務
gulp.task('js', ['concatJs']);
//gulp.task('creatIcon', ['updateIcomoonFontIcon']);

//顏色表
// colors.red ('•')
// colors.yellow ('•')
// colors.cyan ('•')
// colors.magenta ('•')
// colors.green ('•')

gulp.task('default', ['connect', 'css', 'js', 'openSublime'], function() {
    console.log('\n ' + colors.red('•') + colors.cyan(' [啟動] ') + 'Gulp 初始化！');
    gulp.watch('./scss/**/**.scss', ['css', function() {
        console.log('\n ' + colors.red('•') + colors.yellow(' [scss] ') + '編譯scss');
    }]);
    gulp.watch('./js/**/**.js', ['js', function() {
        console.log('\n ' + colors.red('•') + colors.green(' [js] ') + '編譯js');
    }]);

    //gulp.watch('./views/**/**.ejs', ['renderEJS']);
});
