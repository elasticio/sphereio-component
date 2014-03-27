var path = require("path");
'use strict';

module.exports = function (grunt) {

    function submitToCoveralls(fileName, callback) {
        grunt.log.writeln("Submitting file to coveralls.io: " + fileName);

        var child_process = require('child_process');
        var coverallsRunnerPath = require.resolve('coveralls/bin/coveralls');

        var coveralls = child_process.spawn(process.execPath, [coverallsRunnerPath], {
            stdio: ['pipe', process.stdout, process.stderr]
        });

        coveralls.on('exit', function (code) {
            if (code !== 0) {
                grunt.log.error("Failed to submit " + fileName + " to coveralls");
                callback(false);
            } else {
                grunt.log.ok("Successfully submitted " + fileName + " to coveralls");
                callback(true);
            }
        });

        var fs = require('fs');
        coveralls.stdin.end(fs.readFileSync(fileName, 'utf8'));
    }

    grunt.registerTask('cover-specs', 'generate test coverage', function () {

        var Command = require('istanbul/lib/command');

        require('istanbul/lib/register-plugins');

        var cmd = Command.create("cover")

        var done = this.async();

        var commandPath = path.resolve(__dirname,
            "../node_modules/grunt-jasmine-node/node_modules/.bin/jasmine-node");

        cmd.run([commandPath,  "spec"], function (err) {
            if(err) {
                grunt.fail.warn(err);
            }

            submitToCoveralls(path.resolve(__dirname, '../coverage/lcov.info'), function(result) {
               if (result) {
                   grunt.log.ok();

                   done(true);
               } else {
                   grunt.log.error("Failed to submit coverage results to coveralls");

                   done(false);
               }
            });
        });
    });
};
