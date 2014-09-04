var sphere = require('../sphere.js');
var messages = require("../messages.js");

exports.build = function(service) {
    return function process(msg, cfg) {
        var self = this;

        sphere.createServiceClient(service, cfg).byId(msg.body.id).fetch().then(handleResult).fail(errorHandler);

        function handleResult(data) {
            self.emit('data', messages.newMessageWithBody(data.body));
            self.emit('end');
        }

        function errorHandler(err) {
            self.emit('error', err);
            self.emit('end');
        }

    }
}

