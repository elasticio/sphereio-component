var sphere = require('../sphere.js');
var messages = require('../messages.js');
var _ = require('underscore');
var util = require('util');
var helper = require('../helpers.js');

exports.process = action;
exports.getProductTypeSelectModel = helpers.getProductTypeSelectModel;

/**
 * Action to add variant to product
 * @params {Object} msg
 * @params {String} msg.masterVariantReference - Master Variant Sku
 * @params {String} msg.sku - Sku of the new variant
 */
function action(msg, cfg) {
    var self = this;
    var client = sphere.createServiceClient('products', cfg);
    var data = msg.body;

    var masterVariantReference = data.masterVariantReference;
    var sku = data.sku;

    function emitErrorAndEnd(message) {
        self.emit('error', new Error(message));
        self.emit('end');
    }

    if (!masterVariantReference) {
        return emitErrorAndEnd('A master variant reference has to be provided.');
    }

    if (!sku) {
        return emitErrorAndEnd('Variant SKU has to be provided.');
    }

    var actions = [];

    var addVariantAction = {
        "action": "addVariant",
        "sku": sku,
        "staged": false
    };

    actions.push(addVariantAction);

    client
        .where('masterData(current(masterVariant(sku=\"' + masterVariantReference + '\")))')
        .fetch()
        .then(addVariant)
        .fail(handleError)
        .done(end);


    function addVariant(response) {

        var body = response.body;

        if (!body.count) {
            console.log("No product with masterVariantReference %s found.", masterVariantReference);
            return self.emit('rebound', util.format("No product with masterVariantReference %s found.", masterVariantReference));
        }

        var product = body.results.pop();

        function emitData(response) {
            self.emit('data', response.body);
        }

        return client
            .byId(product.id)
            .update(actions)
            .then(emitData);
    }

    function handleError(err) {
        if (err.statusCode === 409) {
            self.emit('rebound',
                'Mismatched version for addVariant action on product with masterVariant sku: ' + data.masterVariantReference);
        } else {
            console.log('Error with add variant to sphere.io');
            console.dir(err);
            self.emit('error', err);
        }
    }

    function end() {
        self.emit('end');
    }
}