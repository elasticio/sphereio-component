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
        console.log(response);
        response.body.results = response.body.results.map(setAddresses);
        helper.updateSnapshotWithLastModified(response.body.results, snapshot);
        if (response.body.count) {
            emitSuccessEvents(messages.newMessageWithBody(response.body));
        } else {
            emitSuccessEvents();
        }
    }

    function setAddresses(customer) {
        var addresses = customer.addresses;
        if (addresses.length > 0) {
            if (customer.defaultShippingAddressId) {
                customer.shippingAddress = customer.addresses.filter(byId(customer.defaultShippingAddressId)).pop();
            }
            if (customer.defaultBillingAddressId) {
                customer.billingAddress = customer.addresses.filter(byId(customer.defaultBillingAddressId)).pop();
            }
        }
        delete customer.addresses;
        delete customer.defaultBillingAddressId;
        delete customer.defaultShippingAddressId;
        return customer;
    }

    function byId(id) {
        return function(row) {
            return row.id === id;
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
