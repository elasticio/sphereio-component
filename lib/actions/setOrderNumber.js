var sphere = require('../sphere.js');
var messages = require('../messages.js');

exports.process = action;

/**
 * Action for set order number
 * @params {Object} msg
 * @params {String} msg.orderId - order ID - required
 * @params {Number} msg.orderNumber - order number to set - required
 */
function action(msg, cfg) {
    var self = this;
    var client = sphere.createServiceClient('orders', cfg);
    var data = msg.body;

    client
        .byId(data.orderId)
        .fetch()
        .then(setOrderNumber)
        .catch(handleError)
        .finally(end)
        .done();

    function setOrderNumber(response) {
        var order = response.body;
        var orderNumber = data.orderNumber;
        if (orderNumber === null || orderNumber === "") {
            throw new Error("Order number is required");
        }
        var orderId = data.orderId;
        console.log("Debug: order object received: " + order);
        console.log('Executing setOrderNumber with ' + orderNumber + ' order number for order: ' + orderId);

        var actions = {
            version: order.version,
            actions: [{
                action: 'setOrderNumber',
                orderNumber: orderNumber
            }]
        };
        return client
            .byId(order.id)
            .update(actions)
            .then(handleResult);
    }

    function handleResult(response) {
        self.emit('data', messages.newMessageWithBody(response.body));
    }

    function handleError(err) {
        if (err.body.statusCode === 409) {
            self.emit('rebound',
                'Mismatched version for setting order number on variant ' + data.variantId + ' to order ' + data.orderNumber
            );
        } else {
            console.log('Error with add price to sphere.io');
            console.dir(err);
            self.emit('error', err);
        }
    }

    function end() {
        self.emit('end');
    }
}