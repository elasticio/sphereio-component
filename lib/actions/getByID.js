var sphere = require('../sphere.js');
var messages = require("../messages.js");

exports.build = function(service, handleBody) {
    return function process(msg, cfg) {
        var self = this;

        sphere.createServiceClient(service, cfg).byId(msg.body.id).fetch().then(handleResult).fail(errorHandler);

        function handleResult(data) {

            var body = data.body;

            if (handleBody) {
                body = handleBody(body);
            }

            self.emit('data', messages.newMessageWithBody(body));
            self.emit('end');
        }

        function errorHandler(err) {
            self.emit('error', err);
            self.emit('end');
        }

    }
}

