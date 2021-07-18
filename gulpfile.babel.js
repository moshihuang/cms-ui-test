/** 
 * Import gulp and plugin
 * */
import gulp from 'gulp'
import glob from 'glob'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import vue from 'rollup-plugin-vue2';
import buble from 'rollup-plugin-buble'
import rollupEach from 'gulp-rollup-each'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-replace'
import babel from 'rollup-plugin-babel'
import concat from 'gulp-concat'
import clean from 'gulp-clean'
import compass from 'gulp-compass'
import cleanCSS from 'gulp-clean-css'
import imagemin from 'gulp-imagemin'
import jade from 'gulp-jade'
import merge from 'merge-stream'
import plumber from 'gulp-plumber'
import uglify from 'gulp-uglify'
import watch from 'gulp-watch'
const browserSync = require('browser-sync').create();

/** 
 * Import package and directories setting
 * */
const pkg = require('./package.json');

const assetPath = pkg['f2e-configs'].assets;
const scriptsPath = pkg['f2e-configs'].scripts;
const cssPath = pkg['f2e-configs'].styles;
const useJade = pkg['f2e-configs'].useJade;

const srcPath = {
  sass: 'src/css/sass',
  css: 'src/css',
  js: 'src/js',
  html: "src/views/pages/**/*.jade",
  partials: "src/partials/**/*.jade",
  assets: 'src/resources',
  img: 'src/resources/images',
  font: 'src/resources/fonts'
};

const distPath = {
  font: 'dist/resources/fonts',
  style: 'dist/css',
  js: 'dist/js',
  html: 'dist',
  img: 'dist/resources/images'
};

const archivePath = 'archive'

const date = new Date();
const month = date.getMonth() + 1;
const today = `${date.getFullYear()}${(month < 10 ? '0' : '') + month}${(date.getDate() < 10 ? '0' : '') + date.getDate()}`;


/** 
 * Compile assets
 * */
gulp.task('copy:library', done => {
  let mergeObj = []
  if (assetPath.length)
    mergeObj.push(
      gulp.src(assetPath).pipe(gulp.dest(distPath.font))
    )

  if (cssPath.length)
    mergeObj.push(
      gulp.src(cssPath).pipe(concat('lib.css')).pipe(gulp.dest(distPath.style))
    )
  if (scriptsPath.length)
    mergeObj.push(
      gulp.src(scriptsPath).pipe(concat('lib.js')).pipe(gulp.dest(distPath.js))
    )

  if (mergeObj.length)
    return merge(...mergeObj).pipe(browserSync.stream())
  else
    done()
});

/** 
 * Setting build task
 * */
// JS
gulp.task('clean:js', () => {
  return gulp.src(distPath.js, { allowEmpty: true }).pipe(clean())
})

gulp.task('compile:js', gulp.series('clean:js', 'copy:library', () => {
  return gulp.src([
    srcPath.js + '/*.js'
  ]).pipe(
    rollupEach({
      plugins: [
        vue(),
        babel(),
        buble({ exclude: 'node_modules/**' }),
        resolve({ browser: true, jsnext: true }),
        commonjs(),
        replace({
          "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
        })
      ]
    },
    file => {
      return {
        format: 'iife',
        name: path.basename(file.path, '.js')
      }
    })
  ).pipe(gulp.dest(distPath.js))
}))

// Compass 
gulp.task('clean:img', () => {
  return gulp.src(distPath.img, { read: false, allowEmpty: true }).pipe(clean())
})

gulp.task('compass', () => {
  return gulp.src([
      srcPath.sass + '/*.sass',
      srcPath.sass + '/*.scss'
    ])
    .pipe(plumber({
      errorHandler(err) {
        console.log(err.message)
      }
    }))
    .pipe(compass({
      project: path.join(__dirname, '/src'),
      css: 'css',
      image: 'resources/images',
      sass: 'css/sass'
    }))
    .on('error', err => {
      console.log(err.message)
    })
    .pipe(gulp.dest('css'))
})

gulp.task('compile:css', gulp.series('clean:img', 'compass', () => {
  let css = gulp.src(srcPath.css + '/**/!(lib).css')
    .pipe(gulp.dest(distPath.style));

  let img = gulp.src([
    srcPath.img + "/*.png",
    srcPath.img + "/!(icons|icons-2x)/*.png",
    srcPath.img + "/**/*.jpg",
    srcPath.img + "/**/*.gif",
    srcPath.img + "/**/*.svg"
  ]).pipe(gulp.dest(distPath.img));

  return merge(css, img).pipe(browserSync.stream())
}))

gulp.task('compile:asset', done => {
  return gulp.src(srcPath.font).pipe(gulp.dest(distPath.font));
})

// Jade
gulp.task('clean:html', () => {
  return gulp.src(distPath.html + '/**/*.html', { allowEmpty: true }).pipe(clean());
});

gulp.task('render:html', gulp.series('clean:html', done => {
  if (!useJade) {
    layout.forEach((tp, idx) => {
      gulp.src(srcPath.html + '/' + tp + '/**/*.html')
      .pipe(template('src/layouts/' + tp + '.html'))
      .pipe(gulp.dest(distPath.html))
    })
  }

  return gulp.src(srcPath.html + '/**/*.html')
}));

gulp.task('compile:html', gulp.series('clean:html', () => {
  return gulp.src(srcPath.html)
    .pipe(plumber({
      errorHandler(err) {
        console.log(err.message)
      }
    })).pipe(jade({
      pretty: true
    }).on('error', err => {
      console.log(err)
    })).pipe(gulp.dest(distPath.html)).pipe(browserSync.stream());
}));

/**
 * Archive
 */
gulp.task('archive:create-dir', done => {
  if (!fs.existsSync(archivePath)) {
    fs.mkdirSync(path.resolve(archivePath), '0755');
  }

  if (fs.existsSync(archivePath + `/${pkg.name}_${today}.zip`)) {
    fs.unlinkSync(archivePath + `/${pkg.name}_${today}.zip`);
  }

  done();
});

gulp.task('archive:zip', done => {
  const archiveName = path.resolve(archivePath, `${pkg.name}-${today}.zip`);
  const zip = archiver('zip');
  const files = glob.sync('**/*.*', {
    'cwd': 'dist',
    'dot': true // include hidden files
  });
  const output = fs.createWriteStream(archiveName);

  zip.on('error', (error) => {
    throw error;
  });

  output.on('close', done);

  files.forEach((file) => {

    const filePath = path.resolve('dist', file);

    // `zip.bulk` does not maintain the file
    // permissions, so we need to add files individually
    zip.append(fs.createReadStream(filePath), {
      'name': file,
      'mode': fs.statSync(filePath).mode
    });

  });

  zip.pipe(output);
  zip.finalize();

  done()
});

/** 
 * Setting minify task
 * */
gulp.task('min:css', done => {
  return gulp.src(distPath.style + '/**/!(lib).css')
    .pipe(cleanCSS())
    .pipe(gulp.dest(distPath.style))
})

gulp.task('min:js', done => {
  return gulp.src(distPath.js + '/**/*.js')
    .pipe(uglify())
    .pipe(gulp.dest(distPath.js))
})

gulp.task('min:image', done => {
  var img = gulp.src([
    distPath.img + "/*.png",
    distPath.img + "/!(icons|icons-2x)/*.png",
    distPath.img + "/**/*.jpg",
    distPath.img + "/**/*.gif",
    distPath.img + "/**/*.svg"
  ]).pipe(imagemin({
    verbose: true
  })).pipe(gulp.dest(distPath.img));

  return merge(img);
})

/** 
 * Gulp watch setting
 * */
gulp.task('server', function () {
  browserSync.init({
    server: {
      baseDir: "./dist"
    }
  })

  watch([
    srcPath.sass + '/**/*.sass',
    srcPath.img + '/**/*.jpg',
    srcPath.img + '/**/*.png',
    srcPath.img + '/**/*.gif',
    srcPath.img + '/**/*.svg'
  ], gulp.series('compile:css', done => done()));

  watch([
    srcPath.html,
  ], gulp.series('compile:html', done => done()));

  watch([
    srcPath.js + '/**/*.js',
    srcPath.js + '/**/*.vue',
  ], gulp.series('compile:js', done => done()));

  watch([
    srcPath.font + '/*'
  ], gulp.series('compile:asset', done => done()));
});

// Setting default command

gulp.task('archive', gulp.series('archive:create-dir', 'archive:zip', done => done()));

gulp.task('default', gulp.series('compile:css', 'compile:js', 'compile:html', done => done()));

gulp.task('watch', gulp.series('compile:css', 'compile:js', 'compile:html', 'server', done => done()));

gulp.task('minify', gulp.series('min:css', 'min:image', 'min:js', done => done()));
