module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        execute: {
            server: {
                src: [ 'app/server.js' ]
            }
        },
        watch: {
            scripts: {
                files: [ 'app/*.ahk', 'app/*.js', 'Gruntfile.js' ],
                tasks: [ 'execute:server' ],
                options: {
                    atBegin: true,
                    interrupt: true // kill process and reload
                }
            }
        }
    });

    grunt.registerTask('listen', [ 'watch:scripts' ]);
};
