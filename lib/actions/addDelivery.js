var sphere = require('../sphere.js');
var messages = require('../messages.js');
var util = require('util');

exports.process = action;

function action(msg, cfg) {
    var self = this;
    var client = sphere.createServiceClient('orders', cfg);
    var msgBody = msg.body;

    if (!msgBody.orderNumber) {
        throw new Error("Order number is required");
    }

    client
        .where('orderNumber="' + msgBody.orderNumber + '"')
        .fetch()
        .then(addDelivery)
        .catch(handleError)
        .finally(end)
        .done();

    function addDelivery(response) {
        console.log('About to execute addDelivery action');
        if (!response.body.count || !response.body.results[0]) {
            throw new Error(util.format("No order with orderNumber %s found", msgBody.orderNumber));
        }
        if (!response.body.results[0].id) {
            throw new Error("Order id is required");
        }
        if (!msgBody.lineItemId) {
            throw new Error("Line item id is required");
        }
        if (!msgBody.quantity) {
            throw new Error("Quantity is required");
        }
        if (!msgBody.parcelId) {
            throw new Error("Parcel ID is required");
        }
        if (!msgBody.trackingId) {
            throw new Error("Tracking ID is required");
        }

        var orderBody = response.body.results[0];
        var version = orderBody.version;
        var orderId = response.body.results[0].id;
        var lineItemId = msgBody.lineItemId;
        var quantity = msgBody.quantity;
        var parcelId = msgBody.parcelId;
        var trackingId = msgBody.trackingId;

        msgBody.orderId = orderId;
        console.log('Executing addDelivery action with %s lineItemId for order: %s', lineItemId, orderId);

        var actions = {
            version: version,
            actions: [{
                action: 'addDelivery',
                items: [{
                    id: lineItemId,
                    quantity: parseInt(quantity)
                }],
                parcels: [{
                    id: parcelId,
                    trackingData: {
                        trackingId: trackingId
                    }
                }]
            }]
        };

        return client
            .byId(orderId)
            .update(actions)
            .then(handleResult)
    }

    function attachMetadataAndReturnBody(response) {
        response.body.orderId = msgBody.orderId;
        return response.body;
    }

    function handleResult(response) {
        console.log('Received response, emitting data');
        var msgBody = attachMetadataAndReturnBody(response);
        self.emit('data', messages.newMessageWithBody(msgBody));
    }

    function handleError(err) {
        if (err.body && err.body.statusCode === 409) {
            self.emit('rebound',
                'Mismatched version for updating order ' + msgBody.orderId + ' with variant ' + msgBody.variantId
            );
        } else {
            console.log('Error while processing addDelivery action in sphere.io component');
            console.dir(err);
            self.emit('error', err);
        }
    }

    function end() {
        self.emit('end');
    }
}