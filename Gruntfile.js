module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        "jasmine_node": {
            options: {
                forceExit: true,
                extensions: 'js'
            },
            spec: ["./spec"],
            instrumented: ["./coverage/instrument/spec"]
        },
        jshint: {
            files: ['Gruntfile.js', 'spec/**/*.js']
        },
        // start - code coverage settings

        env: {
            coverage: {
                APP_DIR_FOR_CODE_COVERAGE: '../coverage/instrument/lib/'
            }
        },


        clean: {
            coverage: {
                src: ['coverage/']
            }
        },


        instrument: {
            files: ['lib/**/*.js', 'spec/**/*.js'],
            options: {
                lazy: true,
                basePath: 'coverage/instrument/'
            }
        },


        storeCoverage: {
            options: {
                dir: 'coverage/reports'
            }
        },


        makeReport: {
            src: 'coverage/reports/**/*.json',
            options: {
                type: 'lcov',
                dir: 'coverage/reports',
                print: 'detail'
            }
        },

        copy: {
            specDepedencies: {
                files: [
                    // includes files within path
                    {expand: true, src: ['spec/**/*.json', 'lib/**/*.json'], dest: './coverage/instrument/'}
                ]
            }
        },

        // end - code coverage settings

        coveralls: {
            test: {
                // LCOV coverage file relevant to every target
                src: 'coverage/reports/lcov.info',

                // When true, grunt-coveralls will only print a warning rather than
                // an error, to prevent CI builds from failing unnecessarily (e.g. if
                // coveralls.io is down). Optional, defaults to false.
                force: false
            }
        },
        jscs: {
            src: [
                "lib/actions/addPrice.js",
                "lib/actions/createProduct.js",
                "lib/actions/queryProductVariant.js",
                "lib/triggers/queryOrders.js",
                "lib/attributeManager.js",
                "lib/actions/addVariant.js",
                "spec/actions/addPrice.spec.js",
                "spec/actions/createProduct.spec.js",
                "spec/triggers/queryOrders.spec.js",
                "spec/attributeManager.spec.js",
                "spec/actions/addVariant.spec.js",
                "spec/helpers.spec.js",
                "spec/sphere.spec.js"
            ],
            options: {
                config: ".jscsrc"
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.loadNpmTasks('grunt-jasmine-node');

    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.loadNpmTasks('grunt-istanbul');

    grunt.loadNpmTasks('grunt-env');

    grunt.loadNpmTasks('grunt-coveralls');

    grunt.loadNpmTasks("grunt-jscs");

    // Default task(s).
    grunt.registerTask('default', ['clean', 'jshint', 'jasmine_node:spec']);

    grunt.registerTask('coverage', ['clean', 'jscs', 'env:coverage',
        'instrument', 'copy:specDepedencies', 'jasmine_node:instrumented', 'storeCoverage', 'makeReport', 'coveralls:test']);
};