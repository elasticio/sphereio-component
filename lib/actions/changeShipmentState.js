var sphere = require('../sphere.js');
var messages = require('../messages.js');

exports.process = action;

function action(msg, cfg) {
    var self = this;
    var client = sphere.createServiceClient('orders', cfg);
    var msgBody = msg.body;

    client
        .byId(msgBody.orderId)
        .fetch()
        .then(changeShipmentState)
        .catch(handleError)
        .finally(end)
        .done();

    function changeShipmentState(response) {
        var orderBody = response.body;
        var version = orderBody.version;

        var orderId = msgBody.orderId;
        var shipmentState = msgBody.shipmentState;

        if (!orderId) {
            throw new Error("Order id is required");
        }
        if (!shipmentState) {
            throw new Error("Shipment state is required");
        }

        console.log('Executing changeShipmentState action with %s shipmentState for order: %s', shipmentState, orderId);

        var actions = {
            version: version,
            actions: [{
                action: 'changeShipmentState',
                shipmentState: shipmentState
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
            console.log('Error while processing changeShipmentState action in sphere.io component');
            console.dir(err);
            self.emit('error', err);
        }
    }

    function end() {
        self.emit('end');
    }
}