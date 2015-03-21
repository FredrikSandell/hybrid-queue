'use strict';

var gulp = require('gulp');

var $ = require('gulp-load-plugins')();

gulp.task('connect:src', function () {
  var connect = require('connect');
  var app = connect()
    .use(require('connect-livereload')({ port: 35729 }))
    .use('/env-info',function(req, res, next) {
      console.log("ehhlo");
      res.writeHead(200, {"Content-Type": "application/json"});
      res.end('{ "stompUrl" : "http://'+ process.env.RABBITMQ_SERVER_PORT_5672_TCP_ADDR + ':15674/stomp"}');
    })
    .use(connect.static('app'))
    .use(connect.directory('app'));

  gulp.server = require('http').createServer(app)
    .listen(9000)
    .on('listening', function () {
      console.log('Started connect web server on http://localhost:9000');
      console.log('env: '+process.env.PATH);
    });
});

gulp.task('connect:dist', function () {
  var connect = require('connect');
  var app = connect()
    .use(connect.static('dist'));

  gulp.server = require('http').createServer(app)
    .listen(9000)
    .on('listening', function () {
      console.log('Started connect web server for dist files on http://localhost:9000');
    });
});

gulp.task('serve', ['connect:src', 'styles', 'build'], function () {
  require('opn')('http://localhost:9000');
});

gulp.task('serve:dist', ['connect:dist'], function () {
    require('opn')('http://localhost:9000');
});
