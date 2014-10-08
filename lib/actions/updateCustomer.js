var sphere = require('../sphere.js');
var messages = require("../messages.js");
var customers = require('../customers.js');

exports.process = function(msg, cfg) {
    var self = this;

    var client = sphere.createServiceClient("customers", cfg);

    client
        .byId(msg.body.id)
        .fetch()
        .then(updateCustomer)
        .fail(errorHandler);

    function updateCustomer(data) {
        var customer = data.body;
        var actions = {
            version: customer.version,
            actions: [{
                action: 'setExternalId',
                externalId: msg.body.external_id
            }]
        };
        client
            .byId(customer.id)
            .update(actions)
            .then(handleResult)
            .fail(errorHandler);
    }

    function handleResult(response) {
        var responseBody = customers.handleAddresses(response.body);
        self.emit('data', messages.newMessageWithBody(responseBody));
        self.emit('end');
    }

    function errorHandler(err) {
        if (err.statusCode === 409) {
            self.emit('rebound');
        } else {
            self.emit('error', err);
        }
        self.emit('end');
    }

}