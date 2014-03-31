module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        clean: {
            all: ["coverage"]
        },
        "jasmine_node": {
            projectRoot: ".",
            requirejs: false,
            forceExit: true
        },
        jshint: {
            files: ['Gruntfile.js', 'spec/**/*.js']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.loadNpmTasks('grunt-jasmine-node');

    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.loadTasks('tasks');

    // Default task(s).
    grunt.registerTask('default', ['clean', 'jshint', 'jasmine_node']);

    grunt.registerTask('coverage', ['clean', 'cover-specs']);
};