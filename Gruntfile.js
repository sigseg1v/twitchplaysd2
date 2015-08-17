module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        run: {
            server: {
                options: {
                    wait: false
                },
                args: [ 'app/server.js' ]
            },

            overlay: {
                options: {
                    wait: false
                },
                args: [ 'app/overlay_server.js' ]
            }
        },

        watch: {
            scripts: {
                files: [ 'app/*.ahk', 'app/*.js', 'Gruntfile.js' ],
                tasks: [ 'run:server' ],
                options: {
                    interrupt: true // kill process and reload
                }
            },
            overlay: {
                files: [ 'app/overlay_server.js', 'overlay/overlay.js', 'overlay/*.html', 'overlay/lib/**/*.js' ],
                tasks: [ 'browserify:overlay' ]
            }
        },

        browserify: {
            overlay: {
                src: 'overlay/overlay.js',
                dest: 'overlay/overlay_compiled.js'
            }
        }
    });

    grunt.registerTask('listen', [ 'browserify:overlay', 'run:server', 'run:overlay', 'watch:scripts' /*, 'watch:overlay'*/ ]);
};
