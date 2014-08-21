var helper = require('../helpers.js');
var messages = require("../messages.js");

var SphereClient = require('sphere-node-client');

exports.process = function (msg, cfg, next, snapshot) {
    var self = this;
    var where;
    var client = new SphereClient({
        config: {
            client_id: cfg.client,
            client_secret: cfg.clientSecret,
            project_key: cfg.project
        }
    });
    var lastModifiedAt = snapshot.lastModifiedAt;

    if (lastModifiedAt) {
        where = 'lastModifiedAt > "' + lastModifiedAt + '"';
    }

    function emitSuccessEvents(newMsg) {
        self.emit('data', newMsg);
        self.emit('snapshot', snapshot);
        self.emit('end');
    }

    function handleResults(response) {
        helper.updateSnapshotWithLastModified(response.body.results, snapshot);
        emitSuccessEvents(messages.newMessageWithBody(response.body));
    }

    client.customers
        .where(where)
        .fetch()
        .then(handleResults)
        .fail(function (err) {
            self.emit('error', err);
            self.emit('end');
        })
        .done();
};
