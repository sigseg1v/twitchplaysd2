var config = require('./app/config.js');
var fs = require('fs');
var moment = require('moment');
var envify = require('envify/custom');

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        forever: {
            server: {
                options: {
                    index: 'app/server.js',
                    logDir: 'logs',
                    errFile: 'server_' + moment().format('DD_MM_YYYY') + '_err.txt',
                    outFile: 'server_' + moment().format('DD_MM_YYYY') + '_out.txt'
                }
            },
            overlay: {
                options: {
                    index: 'app/overlay_server.js',
                    logDir: 'logs',
                    errFile: 'overlay_' + moment().format('DD_MM_YYYY') + '_err.txt',
                    outFile: 'overlay_' + moment().format('DD_MM_YYYY') + '_out.txt'
                }
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
            },

            overlayServer: {
                files: [ 'app/overlay_server.js' ],
                tasks: [ 'forever:overlay:restart' ]
            },

            server: {
                files: [ 'app/*.ahk', 'app/*.js', '!app/overlay_server.js' ],
                tasks: [ 'forever:server:restart' ]
            }
        },

        browserify: {
            overlay: {
                src: 'overlay/overlay.js',
                dest: 'overlay/overlay_compiled.js',
                options: {
                    transform: [envify({
                        OVERLAY_HOST: config.overlayHost,
                        OVERLAY_PORT: config.overlayPort
                    })]
                }
            }
        },

        concurrent: {
            servers: {
                tasks: [ 'forever:server:start', 'forever:overlay:start', 'watch:overlayDataFiles', 'watch:overlayCompiled', 'watch:overlayServer', 'watch:server' ],
                options: {
                    logConcurrentOutput: true,
                    limit: 10
                }
            },
            overlayOnly: {
                tasks: [ 'forever:overlay:start', 'watch:overlayDataFiles', 'watch:overlayCompiled', 'watch:overlayServer' ],
                options: {
                    logConcurrentOutput: true,
                    limit: 10
                }
            },
            serverOnly: {
                tasks: [ 'forever:server:start', 'watch:server' ],
                options: {
                    logConcurrentOutput: true
                }
            }
        }
    });

    grunt.registerTask('listen', [ 'browserify:overlay', 'concurrent:servers' ]);
    grunt.registerTask('server', [ 'concurrent:serverOnly' ]);
    grunt.registerTask('overlay', [ 'browserify:overlay', 'concurrent:overlayOnly' ]);
    grunt.registerTask('kill-server', [ 'forever:server:stop' ]);
    grunt.registerTask('kill-overlay', [ 'forever:overlay:stop' ]);
    grunt.registerTask('kill-all', [ 'forever:server:stop', 'forever:overlay:stop' ]);

    grunt.registerTask('overlayForceReload', function () {
        fs.writeFileSync('./temp/overlayReload', 'reload');
    });
};
