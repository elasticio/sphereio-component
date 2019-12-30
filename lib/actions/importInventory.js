var _ = require('underscore');
var Q = require('q');
var sphere = require('../sphere.js');
var messages = require("../messages.js");

exports.process = importStock;

function importStock(msg, cfg) {
    var self = this;

    var client = sphere.createServiceClient("inventoryEntries", cfg);
    var inventorySync = sphere.createInventorySync();

    var sku = msg.body.sku;
    var quantity = msg.body.quantity;

    if (!sku) {
        return errorHandler(new Error('SKU is missing'));
    }


    if (!quantity) {
        return errorHandler(new Error('Quantity is missing'));
    }

    var newInventory = createInventoryEntry(sku, quantity);

    var where = 'sku="' + sku + '"';

    self.logger.info("Fetching inventories by:", where);

    client
        .where(where)
        .perPage(1)
        .fetch()
        .then(createOrUpdateInventory)
        .then(emitData)
        .finally(end)
        .catch(errorHandler);

    function createOrUpdateInventory(result) {
        var results = result.body.results;

        self.logger.info("Found %s inventories", results.length);

        if (results.length || results.length > 0) {

            function takeFirst(first) {
                return first;
            }

            return Q.all(results.map(updateInventory))
                .spread(takeFirst);
        }

        return createInventory();
    }

    function createInventory() {

        self.logger.info('Creating new inventory entry');

        return client.create(newInventory);
    }

    function updateInventory(existingInventory) {

        var actions = inventorySync.buildActions(newInventory, existingInventory);

        if (actions.shouldUpdate()) {
            var updateId = actions.getUpdateId();

            self.logger.info('About to update inventory by ID:', updateId);

            return client
                .byId(updateId)
                .update(actions.getUpdatePayload());
        }

        return Q({
            body: existingInventory
        });
    }

    function emitData(result) {
        self.logger.info("Emitting data");
        var body = result.body;

        self.logger.info(_.pick(body, ['sku', 'quantityOnStock']));

        var msg = messages.newMessageWithBody(body);

        self.emit('data', msg);
    }

    function errorHandler(err) {
        self.error.info(err);
        self.emit('error', err);
        self.emit('end');
    }

    function end() {
        self.logger.info("Finishing execution");
        self.emit('end');
    }
}

function createInventoryEntry(sku, quantity) {

    var entry = {
        sku: sku,
        quantityOnStock: parseInt(quantity)
    };

    self.logger.info("Inventory entry to create/update: %j", entry);

    return entry;
}