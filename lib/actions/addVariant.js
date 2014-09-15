var sphere = require('../sphere.js');
var messages = require('../messages.js');
var _ = require('underscore');
var util = require('util');

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

    var masterVariantReference = data.masterVariantReference;
    var sku = data.sku;

    if (!masterVariantReference) {
        self.emit('error', new Error('A master variant reference has to be provided.'));
        return self.emit('end');
    }

    if (!sku) {
        self.emit('error', new Error('Variant SKU has to be provided.'));
        return self.emit('end');
    }

    var actions = [];

    var addVariantAction = {
        "action": "addVariant",
        "sku": sku,
        "staged": false
    };

    client
        .where('masterData(current(masterVariant(sku=' + masterVariantReference + ')))')
        .fetch()
        .then(addVariant)
        .fail(handleError)
        .done(end);


    function addVariant(response) {

        var body = response.body.body;
        console.log(body.count);
        if (!body.count) {
            console.log("No product with masterVariantReference %s found.", masterVariantReference);
            return self.emit('rebound', util.format("No product with masterVariantReference %s found.", masterVariantReference));
        }

        var product = body.results.pop();

        return client
            .byId(product.id)
            .update(actions).then(function(response) {
                self.emit('data', response.body.body);
            });
    }

    function handleError(err) {
        if (err.statusCode === 409) {
            self.emit('rebound',
                'Mismatched version for addVariant action on product with masterVariant sku: ' + data.masterVariantReference);
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