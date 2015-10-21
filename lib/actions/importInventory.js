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

    console.log("Fetching inventories by:", where);

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

        console.log("Found %s inventories", results.length);

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

        console.log('Creating new inventory entry');

        return client.create(newInventory);
    }

    function updateInventory(existingInventory) {

        var actions = inventorySync.buildActions(newInventory, existingInventory);

        if (actions.shouldUpdate()) {
            var updateId = actions.getUpdateId();

            console.log('About to update inventory by ID:', updateId);

            return client
                .byId(updateId)
                .update(actions.getUpdatePayload());
        }

        return Q({
            body: existingInventory
        });
    }

    function emitData(result) {
        console.log("Emitting data");
        var body = result.body;

        console.log(_.pick(body, ['sku', 'quantityOnStock']));

        var msg = messages.newMessageWithBody(body);

        self.emit('data', msg);
    }

    function errorHandler(err) {
        console.log(err);
        self.emit('error', err);
        self.emit('end');
    }

    function end() {
        console.log("Finishing execution");
        self.emit('end');
    }
}

function createInventoryEntry(sku, quantity) {

    var entry = {
        sku: sku,
        quantityOnStock: parseInt(quantity)
    };

    console.log("Inventory entry to create/update: %j", entry);

    return entry;
}