var sphere = require('../sphere.js');
var messages = require('../messages.js');
var _ = require('underscore');

exports.process = action;

/**
 * Action for getting data for add price action
 * Now works only with `current` (published) product data, not `stage`
 * @params {Object} msg
 * @params {String} msg.id - variant sku
 * @params {Number} msg.amount - will be passed to next action
 * @params {String} msg.currency - will be passed to next action
 */
function action(msg, cfg) {
    var self = this;
    var client = sphere.createServiceClient('products', cfg);
    var id = String(msg.body.id);

    client
        .where('masterData(current(variants(sku = "' + id + '") or masterVariant(sku = "' + id + '")))')
        .fetch()
        .then(handleResult)
        .catch(hanldeError)
        .done(end);

    function getData(product) {
        var result = {
            productId: product.id
        };

        if (product.masterData.current.masterVariant.sku === id) {
            result.variantId = product.masterData.current.masterVariant.id;
        } else {
            result.variantId = _.where(product.masterData.current.variants, {sku: id})[0].id;
        }
        return result;
    }

    function handleResult(response) {
        if (response.body.results.length) {
            var msgData = getData(response.body.results[0]);
            msgData.amount = msg.body.amount;
            msgData.currency = msg.body.currency;
            self.emit('data', messages.newMessageWithBody(msgData));
        } else {
            self.emit('rebound', 'Failed to find product variant with sku = ' + id);
        }
    }

    function hanldeError(err) {
        self.emit('error', err);
    }

    function end() {
        self.emit('end');
    }
}