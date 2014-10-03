var sphere = require('../sphere.js');
var messages = require('../messages.js');
var _ = require('underscore');
var helper = require('../helpers.js');

exports.process = action;

/**
 * Action for add price to product
 * Now didn't handle country for price
 * and didn't handle case when variand already has price with these country and currency
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

    client
        .byId(data.productId)
        .fetch()
        .then(addPrice)
        .fail(hanldeError)
        .done(end);

    function addPrice(response) {
        var product = response.body;
        var actions = {
            version: product.version,
            actions: [{
                action: 'addPrice',
                variantId: parseInt(data.variantId, 10),
                price: {
                    value: {
                        currencyCode: data.currency,
                        centAmount: helper.centAmountFromAmount(data.amount)
                    }
                    //,country: 'US' - @TODO add country code
                }
            }]
        };
        return client
            .byId(product.id)
            .update(actions)
            .then(handleResult);
    }

    function handleResult(response) {
        self.emit('data', messages.newMessageWithBody(response.body));
    }

    function hanldeError(err) {
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
