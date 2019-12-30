var sphere = require('../sphere.js');
var util = require('util');
var helper = require('../helpers.js');
var metaModel = require('../metaModel.js');
var attributeManager = require('../attributeManager');

exports.process = action;
exports.getProductTypeSelectModel = helper.getProductTypeSelectModel;
exports.getMetaModel = getMetaModel;

function getMetaModel(cfg, callback) {

    metaModel.getMetaModel(cfg, 'addVariant.json', callback);
}

/**
 * Action to add variant to product
 * @params {Object} msg
 * @params {String} msg.masterVariantSku - Master Variant Sku
 * @params {String} msg.sku - Sku of the new variant
 */
function action(msg, cfg) {
    var self = this;
    var client = sphere.createClient(cfg);
    var data = msg.body;

    var masterVariantSku = data.masterVariantSku;
    var sku = data.sku;

    function emitErrorAndEnd(message) {
        self.emit('error', new Error(message));
        self.emit('end');
    }

    if (!masterVariantSku) {
        return emitErrorAndEnd('A master variant sku has to be provided.');
    }

    if (!sku) {
        return emitErrorAndEnd('Variant SKU has to be provided.');
    }

    client.products
        .where('masterData(current(masterVariant(sku= \"' + masterVariantSku + '\" )))')
        .fetch()
        .then(findProductId)
        .spread(prepare)
        .spread(addVariant)
        .catch(handleError)
        .done(end);

    function findProductId(response) {
        var body = response.body;

        var product = body.results && body.results.pop();

        var productId = product && product.id;
        var productVersion = product && product.version;

        return [productId, productVersion];
    }

    function prepare(productId, productVersion) {

        function prepareActions(productTypeAttributes) {
            var actions = [];

            var addVariantAction = {
                'action': 'addVariant',
                'sku': sku,
                'staged': false,
                'attributes': msg.body.attributes
            };

            attributeManager.readVariantActionAttributes(addVariantAction, productTypeAttributes);

            actions.push(addVariantAction);

            var payload = {
                version : productVersion,
                actions: actions
            };

            return [productId, payload];
        }

        return sphere.getProductTypeAttributes(client, cfg.productType).then(prepareActions);
    }

    function addVariant(productId, payload) {
        if (!productId) {
            self.logger.warn('No product with masterVariantSku %s found.', masterVariantSku);
            return self.emit('rebound', util.format('No product with masterVariantSku %s found.', masterVariantSku));
        }

        function emitData(response) {
            self.emit('data', response.body);
        }

        return client.products
            .byId(productId)
            .update(payload)
            .then(emitData);
    }

    function handleError(err) {
        if (err.body && err.body.statusCode === 409) {
            self.emit('rebound',
                'Mismatched version for addVariant action on product with masterVariant sku: ' + data.masterVariantSku);
        } else {
            self.logger.error('Error with add variant to sphere.io');
            console.dir(err);
            self.logger.error(err.stack);
            self.emit('error', err);
        }
    }

    function end() {
        self.emit('end');
    }
}