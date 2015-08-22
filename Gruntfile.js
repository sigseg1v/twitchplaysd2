var config = require('./app/config.js');
var moment = require('moment');

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        nodemon: {
            server: {
                options: {
                    watch: [ 'app/*.ahk', 'app/*.js', 'Gruntfile.js' ],
                    delay: 1000,
                    callback: function (nodemon) {
                        nodemon.on('readable', function () {
                            this.stdout.pipe(fs.createWriteStream('./logs/server_out' + moment.format('DD_MM_YYYY') + '.txt'));
                            this.stderr.pipe(fs.createWriteStream('./logs/server_err' + moment.format('DD_MM_YYYY') + '.txt'));
                        });
                    }
                },
                script: 'app/server.js'
            },

            overlay: {
                options: {
                    watch: [ 'app/overlay_server.js' ],
                    delay: 1000,
                    callback: function (nodemon) {
                        nodemon.on('readable', function () {
                            this.stdout.pipe(fs.createWriteStream('./logs/overlay_out' + moment.format('DD_MM_YYYY') + '.txt'));
                            this.stderr.pipe(fs.createWriteStream('./logs/overlay_err' + moment.format('DD_MM_YYYY') + '.txt'));
                        });
                    },
                    env: {
                        OVERLAY_PORT: config.overlayPort
                    }
                },
                script: 'app/overlay_server.js'
            }
        },

        watch: {
            overlayDataFiles: {
                files: [ 'overlay/**/*', '!overlay/overlay_compiled.js' ],
                tasks: [ 'browserify:overlay' ]
            },

            overlayCompiled: {
                files: [ 'overlay/overlay_compiled.js' ],
                tasks: [ 'overlayForceReload' ]
            }
        },

        browserify: {
            overlay: {
                src: 'overlay/overlay.js',
                dest: 'overlay/overlay_compiled.js'
            }
        },

        concurrent: {
            servers: {
                tasks: [ 'nodemon:server', 'nodemon:overlay', 'watch:overlayDataFiles', 'watch:overlayCompiled' ],
                options: {
                    logConcurrentOutput: true
                }
            },
            serveronly: {
                tasks: [ 'nodemon:server' ],
                options: {
                    logConcurrentOutput: true
                }
            },
            overlayonly: {
                tasks: [ 'nodemon:overlay', 'watch:overlayDataFiles', 'watch:overlayCompiled' ],
                options: {
                    logConcurrentOutput: true
                }
            }
        }
    });

    grunt.registerTask('listen', [ 'browserify:overlay', 'concurrent:servers' ]);
    grunt.registerTask('server', [ 'concurrent:serveronly', 'keepalive' ]);
    grunt.registerTask('overlay', [ 'browserify:overlay', 'concurrent:overlayonly' ]);

    grunt.registerTask('overlayForceReload', function () {
        require('fs').writeFileSync('./temp/overlayReload', 'reload');
    });

    grunt.registerTask('serverLogin')
};
