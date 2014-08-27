var messages = require("../messages.js");

var sphere = require('../sphere.js');

exports.process = function (msg, cfg, next, snapshot) {
    var self = this;

    var client = sphere.createClient("orders", cfg);

    var lastModifiedAt = snapshot.lastModifiedAt || '1970-01-01T00:00:00.000Z';

    var where = 'lastModifiedAt > "' + lastModifiedAt + '"';

    if (cfg.where) {
        where += " and " + cfg.where;
    }

    function emitSuccessEvents(newMsg) {
        if (newMsg) {
            self.emit('data', newMsg);
        }
        self.emit('snapshot', snapshot);
        self.emit('end');
    }

    function handleResults(response) {
        response.body.results = response.body.results;
        if (response.body.count) {
            emitSuccessEvents(messages.newMessageWithBody(response.body));
        } else {
            emitSuccessEvents();
        }
    }

    client
        .where(where)
        .perPage(20)
        .sort('lastModifiedAt', true)
        .fetch()
        .then(handleResults)
        .fail(function (err) {
            self.emit('error', err);
            self.emit('end');
        })
        .done();
};
