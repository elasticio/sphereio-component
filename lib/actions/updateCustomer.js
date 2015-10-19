var sphere = require('../sphere.js');
var messages = require("../messages.js");
var customers = require('../customers.js');

exports.process = function(msg, cfg) {
    var self = this;

    var client = sphere.createServiceClient("customers", cfg);

    var customerId = msg.body.id;
    console.log("About to update customer with ID=", customerId);

    client
        .byId(customerId)
        .fetch()
        .then(updateCustomer)
        .catch(errorHandler);

    function updateCustomer(data) {
        var externalId = msg.body.external_id;
        console.log("Setting externalId:", externalId);

        var customer = data.body;
        var actions = {
            version: customer.version,
            actions: [{
                action: 'setExternalId',
                externalId: externalId
            }]
        };
        client
            .byId(customer.id)
            .update(actions)
            .then(handleResult)
            .catch(errorHandler);
    }

    function handleResult(response) {
        console.log("Customer successfully updated");
        var responseBody = customers.handleAddresses(response.body);
        self.emit('data', messages.newMessageWithBody(responseBody));
        self.emit('end');
    }

    function errorHandler(err) {

        if (err.body && err.body.statusCode === 409) {
            self.emit('rebound');
        } else {
            self.emit('error', err);
        }
        self.emit('end');
    }
};
