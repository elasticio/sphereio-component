var helper = require('../helpers.js');
var messages = require("../messages.js");

var sphere = require('../sphere.js');

exports.process = function (msg, cfg, next, snapshot) {
    var self = this;

    var client = sphere.createClient("orders", cfg);

    function emitSuccessEvents(newMsg) {
        if (newMsg) {
            self.emit('data', newMsg);
        }
        self.emit('snapshot', snapshot);
        self.emit('end');
    }

    function handleResults(response) {
        response.body.results = response.body.results;
        console.log(response.body);
        if (response.body.count) {
            emitSuccessEvents(messages.newMessageWithBody(response.body));
        } else {
            emitSuccessEvents();
        }
    }

    client
        .perPage(20)
        .fetch()
        .then(handleResults)
        .fail(function (err) {
            self.emit('error', err);
            self.emit('end');
        })
        .done();
};
