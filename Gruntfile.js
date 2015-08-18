module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        nodemon: {
            server: {
                options: {
                    watch: [ 'app/*.ahk', 'app/*.js', 'Gruntfile.js' ],
                    delay: 1000
                },
                script: 'app/server.js'
            },

            overlay: {
                options: {
                    watch: [ 'app/overlay_server.js' ],
                    delay: 1000
                },
                script: 'app/overlay_server.js'
            }
        },

        watch: {
            overlayDataFiles: {
                files: [ 'overlay/**/*' ],
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
                tasks: [ 'nodemon:server', 'nodemon:overlay', 'watch:overlayDataFiles' ],
                options: {
                    logConcurrentOutput: true
                }
            }
        }
    });

    grunt.registerTask('listen', [ 'browserify:overlay', 'concurrent:servers' ]);

    grunt.registerTask('overlayForceReload', function () {
        require('fs').writeFileSync('./temp/overlayReload', 'reload');
    });
};
