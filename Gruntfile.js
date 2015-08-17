module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        run: {
            server: {
                options: {
                    wait: false
                },
                args: [ 'app/server.js' ]
            }
        },
        watch: {
            scripts: {
                files: [ 'app/*.ahk', 'app/*.js', 'Gruntfile.js' ],
                tasks: [ 'run:server' ],
                options: {
                    interrupt: true // kill process and reload
                }
            }
        }
    });

    grunt.registerTask('listen', [ 'run:server', 'watch:scripts' ]);
};
