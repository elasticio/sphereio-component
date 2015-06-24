var sphere = require('../sphere.js');
var messages = require('../messages.js');

exports.process = action;

/**
 * Example WebHook data
    delivery: {
        line: [
            item: {
                id: "ID of the line item being delivered",
            }
        ],
        quantity: 1,
        parcel: [
            id: "Unique parcel ID"
        ],
        tracking: {
            id: "ID to track the delivery"
        },
        carrier: "DHL",
        created: "2001-09-11T14:00:00.000Z
    }
*/

function action(msg, cfg) {
    var self = this;
    var client = sphere.createServiceClient('orders', cfg);
    var msgBody = msg.body;

    client
        .byId(msgBody.orderId)
        .fetch()
        .then(addDelivery)
        .catch(handleError)
        .finally(end)
        .done();

    function addDelivery(response) {
        var orderBody = response.body;
        var version = orderBody.version;

        var orderId = msgBody.orderId;
        var lineItemId = msgBody.lineItemId;
        var quantity = msgBody.quantity;
        var parcelId = msgBody.parcelId;
        var trackingId = msgBody.trackingId;

        if (!orderId) {
            throw new Error("Order id is required");
        }
        if (!lineItemId) {
            throw new Error("Line item id is required");
        }
        if (!quantity) {
            throw new Error("Quantity is required");
        }

        console.log('Executing addDelivery action with %sx%s lineItemId for order: %s', quantity, lineItemId, orderId);

        var actions = {
            version: version,
            actions: [{
                action: 'addDelivery',
                items: [{
                    id: lineItemId,
                    quantity: quantity
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
        var msgBody = attachMetadataAndReturnBody(response);
        self.emit('data', messages.newMessageWithBody(msgBody));
    }

    function handleError(err) {
        if (err.body.statusCode === 409) {
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