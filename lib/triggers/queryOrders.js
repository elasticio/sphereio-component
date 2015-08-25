var helper = require('../helpers.js');
var messages = require('../messages.js');
var fs = require('fs');
var sphere = require('../sphere.js');
var _ = require('underscore');
var util = require('util');

exports.getMetaModel = getMetaModel;
exports.process = processTrigger;

var ORDERS_LIMIT = 200;
var UNSYNCED_LIMIT = 20;

function getMetaModel(cfg, callback) {
    var client = sphere.createServiceClient('project', cfg);
    var languages;

    client.fetch().then(readSchema).catch(callback);

    function readSchema(data) {
        languages = data.body.languages;
        fs.readFile(__dirname + '/../schemas/queryOrders.out.json', constructMetaData);
    }

    function constructMetaData(err, schema) {
        if (err) {
            return callback(err);
        }
        schema = JSON.parse(schema.toString());
        if (!cfg.expandCustomerExternalId) {
            delete schema.properties.results.properties.customer;
        }
        schema = helper.convertLStrings(schema, languages);
        callback(null, {out: schema});
    }
}

function processTrigger(msg, cfg, next, snapshot) {

    var self = this;
    var client = sphere.createClient(cfg);
    var snapshot = snapshot || {};

    function _queryOrders(where, limit){
        return client.orders.where(where)
            .expand('syncInfo[*].channel')
            .perPage(limit)
            .sort('lastModifiedAt', true)
            .fetch();
    }

    function queryNewOrders() {
        var lastModifiedAt = snapshot.lastModifiedAt || '1970-01-01T00:00:00.000Z';
        var where = 'lastModifiedAt > "' + lastModifiedAt + '"';
        if (cfg.where) {
            where += ' and ' + cfg.where;
        }
        console.log('Get %s orders where %s', ORDERS_LIMIT, where);
        return _queryOrders(where, ORDERS_LIMIT);
    }

    function addUnsyncedOrders(response) {

        if (_.isEmpty(snapshot.unsyncedOrders)) {
            return response;
        }

        var orderIds = getIds();
        if (_.isEmpty(orderIds)) {
            return response;
        }

        // query up to 20 non-synced orders
        return queryUnsyncedOrders(orderIds)
            .then(addUnsyncedOrdersToResponse)
            .then(returnResponse);

        function getIds(){
            var unsyncedOrderIds = _.keys(snapshot.unsyncedOrders);
            var responseOrderIds = _.pluck(response.body.results, 'id');
            return _.difference(unsyncedOrderIds, responseOrderIds);
        }

        function queryUnsyncedOrders(orderIds) {
            console.log('Get %s unsynced orders', UNSYNCED_LIMIT);
            var where = 'id in ("' + orderIds.join('","') + '")';
            return _queryOrders(where, UNSYNCED_LIMIT);
        }

        function addUnsyncedOrdersToResponse(unsyncedOrdersResponse) {
            if (unsyncedOrdersResponse && unsyncedOrdersResponse.body && unsyncedOrdersResponse.body.results) {
                response.body.results = _.union(response.body.results, unsyncedOrdersResponse.body.results);
            }
        }

        function returnResponse(){
            return response;
        }
    }

    // updates response.body.results with 'customer' property
    function addCustomersData(response){

        if (!cfg.expandCustomerExternalId) {
            return response;
        }

        var customerIds = getCustomerIds(response.body.results);
        if (_.isEmpty(customerIds)) {
            return response;
        }

        return client.customers
            .where('id in ("' + customerIds.join('","') + '")')
            .fetch()
            .then(buildCustomersHash)
            .then(addCustomersToOrders)
            .then(returnResponse);

        function getCustomerIds(orders){
            return _.uniq(_.compact(_.pluck(orders, 'customerId')));
        }

        function buildCustomersHash(customersResponse){
            return _.indexBy(customersResponse.body.results, 'id');
        }

        function addCustomersToOrders(customersHash) {
            _.each(response.body.results, function assignOrderCustomer(order) {
                order.customer = customersHash[order.customerId];
            });
        }

        function returnResponse() {
            return response;
        }
    }

    function checkUnsyncedCustomers(response) {

        response.body.results = _.filter(response.body.results, checkOrderCustomerSynced);
        console.log('%s unsynced orders', _.keys(snapshot.unsyncedOrders).length);
        return response;

        function checkOrderCustomerSynced(order) {
            console.log('Order %s customer %s external id %s',
                order.id, order.customer, order.customer.externalId
            );
            if (cfg.withSyncedCustomersOnly && order.customer && !order.customer.externalId) {
                snapshot.unsyncedOrders = snapshot.unsyncedOrders || {};
                snapshot.unsyncedOrders[order.id] = true;
                return false;
            } else {
                if (snapshot.unsyncedOrders && snapshot.unsyncedOrders[order.id]) {
                    delete snapshot.unsyncedOrders[order.id];
                }
                return true;
            }
        }
    }

    function addShippingPrices(response) {

        _.each(response.body.results, setOrderShippingPrice);
        return response;

        function setOrderShippingPrice(order){
            order.shippingPrice = getShippingPrice(order);
        }

        function getShippingPrice(order){
            if (!order.shippingInfo || !order.shippingInfo.price) {
                return;
            }
            var price = _.clone(order.shippingInfo.price);
            checkFreeShipping(price, order.shippingInfo.shippingRate);
            addTaxRate(price, order.shippingInfo.taxRate);
            return price;
        }

        function checkFreeShipping(price, shippingRate){
            if (!shippingRate || !shippingRate.freeAbove) {
                return;
            }
            checkSameCurrency(price.currencyCode, shippingRate.freeAbove.currencyCode);
            if (price.centAmount > shippingRate.freeAbove.centAmount) {
                price.centAmount = 0;
            }
        }

        function addTaxRate(price, taxRate){
            if (!taxRate || !taxRate.amount || taxRate.includedInPrice) {
                return;
            }
            price.centAmount += Math.round(price.centAmount * taxRate.amount);
        }

        function checkSameCurrency(currencyCode1, currencyCode2){
            if (currencyCode1 !== currencyCode2) {
                throw new Error(util.format('Cannot add %s to %s', currencyCode1, currencyCode2));
            }
        }
    }

    function addDiscountedPrices(response) {

        _.each(response.body.results, addOrderDiscountedPrices);
        return response;

        function addOrderDiscountedPrices(order){
            _.each(order.lineItems, addLineItemDiscountedPrice);
        }

        function addLineItemDiscountedPrice(lineItem){
            if (!lineItem.discountedPrice) {
                lineItem.discountedPrice = lineItem.price;
            }
        }
    }
    // emits data and snapshot
    function handleResults(response) {
        if (response.body.results.length > 0) {
            console.log('Emitted %s orders', response.body.results.length);
            self.emit('data', messages.newMessageWithBody(response.body));
            helper.updateSnapshotWithLastModified(response.body.results, snapshot);
        }
        self.emit('snapshot', snapshot);
    }

    function handleError(err) {
        self.emit('error', err);
    }

    function handleEnd(){
        self.emit('end');
    }

    queryNewOrders()
        .then(addUnsyncedOrders)
        .then(addCustomersData)
        .then(checkUnsyncedCustomers)
        .then(addShippingPrices)
        .then(addDiscountedPrices)
        .then(helper.centAmountsToAmounts)
        .then(handleResults)
        .catch(handleError)
        .done(handleEnd);
}
