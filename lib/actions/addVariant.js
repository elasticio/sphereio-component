var sphere = require('../sphere.js');
var messages = require('../messages.js');
var _ = require('underscore');

exports.process = action;

/**
 * Action to add variant to product
 * @params {Object} msg
 * @params {String} msg.productId - Product ID
 * @params {String} msg.variandId - ID of variant which price will be added
 * @params {String} msg.currency - currency for new price
 * @params {Number} msg.amount - amount of new price
 */
function action(msg, cfg) {
    var self = this;
    var client = sphere.createServiceClient('products', cfg);
    var data = msg.body;

    var masterVariantReference = msg.body.masterVariantReference;
    var sku = msg.body.sku;

    if(!masterVariantReference) {
        self.emit('error', new Error('A master variant reference has to be provided.'));
        return self.emit('end');
    }

    if(!sku) {
        self.emit('error', new Error('Variant SKU has to be provided.'));
        return self.emit('end');
    }

    var actions = [];

    var addVariantAction = {
        "action": "addVariant",
        "sku" : sku,
        "staged": false
    };

    client
        .where('masterVariant(sku= ' + masterVariantReference + ')')
        .update(actions)
        .then(addVariant)
        .then(handleResult)
        .fail(handleError)
        .done(end);

    function handleResult(response) {
        self.emit('data', messages.newMessageWithBody(response.body));
    }

    function handleError(err) {
        if (err.statusCode === 409) {
            self.emit('rebound',
                'Mismatched version for adding price to variant ' + data.variantId + ' to product ' + data.productId
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
