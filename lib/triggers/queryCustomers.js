var helper = require('../helpers.js');
var messages = require("../messages.js");
var _ = require("underscore");

var sphere = require('../sphere.js');
var customers = require('../customers.js');

exports.process = function (msg, cfg, snapshot) {
    var self = this;

    var client = sphere.createServiceClient('customers', cfg);

    var lastModifiedAt = snapshot.lastModifiedAt || '1970-01-01T00:00:00.000Z';

    console.log("Retrieving customers that wer modified after", lastModifiedAt);

    var where = 'lastModifiedAt > "' + lastModifiedAt + '"';

    if (cfg.where) {
        where += ' and ' + cfg.where;
    }

    client
        .where(where)
        .perPage(20)
        .sort('lastModifiedAt', true)
        .fetch()
        .then(handleResults)
        .catch(function (err) {
            self.emit('error', err);
        })
        .done(function () {
            self.emit('end');
        });

    function emitSuccessEvents(newMsg) {
        if (newMsg) {
            self.emit('data', newMsg);
        }
        self.emit('snapshot', snapshot);
    }

    function handleResults(response) {
        response.body.results = response.body.results.map(customers.handleAddresses);
        helper.updateSnapshotWithLastModified(response.body.results, snapshot);
        if (response.body.count) {
            emitSuccessEvents(createCustomersMessage(response));
        } else {
            console.log("No customers found");
            emitSuccessEvents();
        }
    }

    function createCustomersMessage(response) {
        var body = response.body;
        var results = body.results;

        var ids = _.pluck(results, 'id');

        console.log("Found %s customers with IDs:");
        console.log(ids);

        return messages.newMessageWithBody(body);
    }
};
