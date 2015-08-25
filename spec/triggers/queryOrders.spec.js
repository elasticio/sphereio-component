describe('Sphere.io queryOrders.js', function () {
    var nock = require('nock');
    var allOrders = require('../data/all_orders.json.js');
    var reboundedOrders = require('../data/rebounded_orders.json.js');
    var allOrdersWithException = require('../data/all_orders_with_exception.json.js');
    var allOrdersResponse = require('../data/all_orders_response.json.js');
    var orderCustomers = require('../data/order_customers.json.js');
    var orderCustomersNotSynced = require('../data/order_customers_notsynced.json.js');
    var modifiedOrders = require('../data/modified_orders.json.js');
    var emptyResult = {'offset': 0, 'count': 0, 'total': 49, 'results': []};

    var next = jasmine.createSpy('next');
    var queryOrders = require('../../lib/triggers/queryOrders.js');
    var helpers = require('../../lib/helpers.js');

    var SL = '/';
    var AND = '&';
    var REQ = '?';
    var ORDERS = 'orders';
    var LIMIT = 'limit=20';
    var EXPAND = 'expand=syncInfo%5B*%5D.channel';
    var SORT = 'sort=lastModifiedAt%20asc';
    var GET_ALL_ENDPOINT = SL + 'test_project' + SL + ORDERS + REQ;
    var LIMIT_SORT_EXPAND = AND + LIMIT + AND + SORT + AND + EXPAND;
    var GET_ALL_DEFAULT = GET_ALL_ENDPOINT + 'where=lastModifiedAt%20%3E%20%221970-01-01T00%3A00%3A00.000Z%22' + LIMIT_SORT_EXPAND;

    describe('process', function () {
        var msg;
        var self;
        var cfg;

        beforeEach(function () {

            nock('https://auth.sphere.io')
                .filteringRequestBody(/.*/, '*')
                .post('/oauth/token', '*')
                .reply(200, {
                    'access_token': 'i0NC8wC8Z49uwBJKTS6MkFQN9_HhsSSA',
                    'token_type': 'Bearer',
                    'expires_in': 172800,
                    'scope': 'manage_project:test_project'
                });

            msg = {};
            self = jasmine.createSpyObj('self', ['emit']);
            cfg = {
                client: 'test_client',
                clientSecret: 'so_secret',
                project: 'test_project',
                expandCustomerExternalId: true
            };
        });

        it('should emit new message if first query was successful', function () {

            nock('https://api.sphere.io')
                .get(GET_ALL_DEFAULT)
                .reply(200, allOrders)
                .get('/test_project/customers?where=id%20in%20(%223927ef3d-b5a1-476c-a61c-d719752ae2dd%22)')
                .reply(200, orderCustomers);

            queryOrders.process.call(self, msg, cfg, next, {});

            waitsFor(function () {
                return self.emit.calls.length;
            });

            runs(function () {
                var calls = self.emit.calls;
                expect(calls.length).toEqual(3);

                expect(calls[0].args[0]).toEqual('data');
                var newMsg = self.emit.calls[0].args[1];
                expect(newMsg.body.length).toEqual(allOrders.length);

                // each 'centAmount' should be converted to "amount"
                expect(newMsg.body).toEqual(allOrdersResponse);

                // check 'customer' in orders
                expect(newMsg.body.results[0].customer).toBeUndefined();
                expect(newMsg.body.results[1].customer).not.toBeUndefined();
                expect(newMsg.body.results[1].customer).toEqual(orderCustomers.results[0]);

                // check shippingInfo.price.centAmount in orders
                expect(newMsg.body.results[0].shippingPrice.amount).toEqual(14.44); // 1111 + Round(0.3*1111) = 1111 + Round(333.3)
                expect(newMsg.body.results[1].shippingPrice.amount).toEqual(0); // because shipping above 5000 is free

                expect(calls[1].args[0]).toEqual('snapshot');
                expect(calls[1].args[1].lastModifiedAt).toEqual('2014-08-20T09:22:36.569Z');

                expect(calls[2].args[0]).toEqual('end');

            });
        });

        it('should emit error if shippingRate.freeAbove.currencyCode is not equal to shippingInfo.price.currencyCode', function () {

            nock('https://api.sphere.io')
                .get(GET_ALL_DEFAULT)
                .reply(200, allOrdersWithException);

            queryOrders.process.call(self, msg, cfg, next, {});

            waitsFor(function () {
                return self.emit.calls.length;
            });

            runs(function () {
                var calls = self.emit.calls;

                expect(calls.length).toEqual(2);
                expect(calls[0].args[0]).toEqual('error');
                expect(calls[0].args[1].message).toEqual('Cannot add EUR to USD');
                expect(calls[1].args[0]).toEqual('end');

            });
        });

        it('should not expand customers if cfg.expandCustomerExternalId is not true', function () {

            nock('https://api.sphere.io')
                .get(GET_ALL_DEFAULT)
                .reply(200, allOrders);

            cfg.expandCustomerExternalId = false;

            queryOrders.process.call(self, msg, cfg, next, {});

            waitsFor(function () {
                return self.emit.calls.length;
            });

            runs(function () {
                var calls = self.emit.calls;
                expect(calls.length).toEqual(3);

                expect(calls[0].args[0]).toEqual('data');
                var newMsg = self.emit.calls[0].args[1];
                expect(newMsg.body.length).toEqual(allOrders.length);

                // check 'customer' in orders
                expect(newMsg.body.results[0].customer).toBeUndefined();
                expect(newMsg.body.results[1].customer).toBeUndefined();

                expect(calls[1].args[0]).toEqual('snapshot');
                expect(calls[1].args[1].lastModifiedAt).toEqual('2014-08-20T09:22:36.569Z');

                expect(calls[2].args[0]).toEqual('end');

            });
        });

        it('should emit new message if second query was successful (with snapshot `lastModifiedAt` param)', function () {

            nock('https://api.sphere.io')
                .get(GET_ALL_ENDPOINT + 'where=lastModifiedAt%20%3E%20%222014-08-21T00%3A00%3A00.000Z%22' + LIMIT_SORT_EXPAND)
                .reply(200, modifiedOrders);

            var date = '2014-08-21T00:00:00.000Z';
            var snapshot = {
                'lastModifiedAt': date
            };
            queryOrders.process.call(self, msg, cfg, next, snapshot);

            waitsFor(function () {
                return self.emit.calls.length;
            });

            runs(function () {
                var calls = self.emit.calls;
                expect(calls.length).toEqual(3);

                expect(calls[0].args[0]).toEqual('data');
                var newMsg = self.emit.calls[0].args[1];
                expect(newMsg.body.length).toEqual(modifiedOrders.length);

                expect(calls[1].args[0]).toEqual('snapshot');
                expect(calls[1].args[1].lastModifiedAt).toEqual(date);

                expect(calls[2].args[0]).toEqual('end');
            });
        });

        it('should emit error if request to sphere.io was failed', function () {

            nock('https://api.sphere.io')
                .get(GET_ALL_ENDPOINT + 'where=lastModifiedAt%20%3E%20%222014-09-21T00%3A00%3A00.000Z%22' + LIMIT_SORT_EXPAND)
                .reply(500, JSON.stringify({message :'Internal Server Error'}));

            var snapshot = {
                'lastModifiedAt': '2014-09-21T00:00:00.000Z'
            };

            queryOrders.process.call(self, msg, cfg, next, snapshot);

            waitsFor(function () {
                return self.emit.calls.length;
            });

            runs(function () {
                var calls = self.emit.calls;
                expect(calls.length).toEqual(2);
                expect(calls[0].args[0]).toEqual('error');
                expect(calls[0].args[1].message).toEqual('Internal Server Error');

                expect(calls[1].args[0]).toEqual('end');
            });
        });

        it('should emit new message only if orders count more than 0', function () {

            nock('https://api.sphere.io')
                .get(GET_ALL_ENDPOINT + 'where=lastModifiedAt%20%3E%20%222014-08-25T00%3A00%3A00.000Z%22' + LIMIT_SORT_EXPAND)
                .reply(200, emptyResult);

            var date = '2014-08-25T00:00:00.000Z';
            var snapshot = {lastModifiedAt: date};

            queryOrders.process.call(self, msg, cfg, next, snapshot);

            waitsFor(function () {
                return self.emit.calls.length;
            });

            runs(function () {
                var calls = self.emit.calls;
                expect(calls.length).toEqual(2);

                expect(calls[0].args[0]).toEqual('snapshot');
                expect(calls[0].args[1].lastModifiedAt).toEqual(date);

                expect(calls[1].args[0]).toEqual('end');
            });
        });
    });

    describe('when where field is provided', function() {
        var msg;
        var self;
        var cfg;

        beforeEach(function() {

            nock('https://auth.sphere.io')
                .filteringRequestBody(/.*/, '*')
                .post('/oauth/token', '*')
                .reply(200, {
                    'access_token': 'i0NC8wC8Z49uwBJKTS6MkFQN9_HhsSSA',
                    'token_type': 'Bearer',
                    'expires_in': 172800,
                    'scope': 'manage_project:test_project'
                });

            nock('https://api.sphere.io')
                .get(GET_ALL_ENDPOINT + 'where=lastModifiedAt%20%3E%20%221970-01-01T00%3A00%3A00.000Z%22%20and%20externalId%20is%20defined' + LIMIT_SORT_EXPAND)
                .reply(200, allOrders)
                .get('/test_project/customers?where=id%20in%20(%223927ef3d-b5a1-476c-a61c-d719752ae2dd%22)')
                .reply(200, orderCustomers);

            msg = {};
            self = jasmine.createSpyObj('self', ['emit']);
            cfg = {
                client: 'test_client',
                clientSecret: 'so_secret',
                project: 'test_project',
                where : 'externalId is defined',
                expandCustomerExternalId: true
            };
        });

        it('should emit new message if first query was successful', function() {

            queryOrders.process.call(self, msg, cfg, next, {});

            waitsFor(function () {
                return self.emit.calls.length;
            });

            runs(function () {

                var calls = self.emit.calls;
                expect(calls.length).toEqual(3);

                expect(calls[0].args[0]).toEqual('data');
                var newMsg = self.emit.calls[0].args[1];
                expect(newMsg.body.length).toEqual(allOrders.length);
                expect(newMsg.body.results.length).toEqual(allOrders.results.length);

                // check 'customer' in orders
                expect(newMsg.body.results[0].customer).toBeUndefined();
                expect(newMsg.body.results[1].customer).not.toBeUndefined();
                expect(newMsg.body.results[1].customer).toEqual(orderCustomers.results[0]);

                expect(calls[1].args[0]).toEqual('snapshot');
                expect(Object.keys(calls[1].args[1]).length).toEqual(2);
                expect(calls[1].args[1].lastModifiedAt).toEqual('2014-08-20T09:22:36.569Z');
                expect(calls[1].args[1].unsyncedOrders).toEqual({});

                expect(calls[2].args[0]).toEqual('end');
            });
        });
    });

    describe('test behaviour of syncedCustomersOnly=true', function() {
        var msg;
        var self;
        var cfg;

        beforeEach(function() {

            nock('https://auth.sphere.io')
                .filteringRequestBody(/.*/, '*')
                .post('/oauth/token', '*')
                .reply(200, {
                    'access_token': 'i0NC8wC8Z49uwBJKTS6MkFQN9_HhsSSA',
                    'token_type': 'Bearer',
                    'expires_in': 172800,
                    'scope': 'manage_project:test_project'
                });

            msg = {};
            self = jasmine.createSpyObj('self', ['emit']);
        });

        it('should add order to snapshot.unsyncedOrders if customer has no externalId', function() {

            var snapshot = {};

            var cfg = {
                client: 'test_client',
                clientSecret: 'so_secret',
                project: 'test_project',
                where : 'externalId is defined',
                expandCustomerExternalId: true,
                syncedCustomersOnly: true
            };

            nock('https://api.sphere.io')
                .get(GET_ALL_ENDPOINT + 'where=lastModifiedAt%20%3E%20%221970-01-01T00%3A00%3A00.000Z%22%20and%20externalId%20is%20defined' + LIMIT_SORT_EXPAND)
                .reply(200, reboundedOrders)
                .get('/test_project/customers?where=id%20in%20(%223927ef3d-b5a1-476c-a61c-d719752ae2dd%22)')
                .reply(200, orderCustomersNotSynced);

            queryOrders.process.call(self, msg, cfg, next, snapshot);

            waitsFor(function () {
                return self.emit.calls.length;
            });

            runs(function () {

                var calls = self.emit.calls;
                expect(calls.length).toEqual(3);

                expect(calls[0].args[0]).toEqual('data');
                var newMsg = self.emit.calls[0].args[1];
                expect(newMsg.body.results.length).toEqual(1);
                expect(newMsg.body.results[0].id).toEqual('8fd9f83c-3453-418c-9f3b-5a218bfc8421');
                expect(newMsg.body.results[0].customer).toBeUndefined();

                expect(calls[1].args[0]).toEqual('snapshot');
                expect(Object.keys(calls[1].args[1]).length).toEqual(2);
                expect(calls[1].args[1].lastModifiedAt).toEqual('2013-06-04T14:05:13.564Z');
                expect(calls[1].args[1].unsyncedOrders).toEqual({'ad921e37-0ea1-4aba-a57e-8caadfc093e1': true});

                expect(calls[2].args[0]).toEqual('end');
            });
        });

        it('should emit order & delete it from snapshot.unsyncedOrders if customer has externalId', function() {

            var snapshot = {
                unsyncedOrders: {
                    'ad921e37-0ea1-4aba-a57e-8caadfc093e1': true,
                    '12345678-0ea1-4aba-a57e-8caadfc093e1': true
                }
            };

            var cfg = {
                client: 'test_client',
                clientSecret: 'so_secret',
                project: 'test_project',
                where : 'externalId is defined',
                expandCustomerExternalId: true,
                syncedCustomersOnly: true
            };

            // should query non-synced orders also
            nock('https://api.sphere.io')
                // get up to 20 updated orders
                .get(GET_ALL_ENDPOINT + 'where=lastModifiedAt%20%3E%20%221970-01-01T00%3A00%3A00.000Z%22%20and%20externalId%20is%20defined' + LIMIT_SORT_EXPAND)
                .reply(200, allOrders)
                // and add up to 20 non-synced orders
                .get(GET_ALL_ENDPOINT + 'where=id%20in%20(%22ad921e37-0ea1-4aba-a57e-8caadfc093e1%22%2C%2212345678-0ea1-4aba-a57e-8caadfc093e1%22)' + LIMIT_SORT_EXPAND)
                .reply(200, reboundedOrders)
                .get('/test_project/customers?where=id%20in%20(%223927ef3d-b5a1-476c-a61c-d719752ae2dd%22)')
                .reply(200, orderCustomers);

            queryOrders.process.call(self, msg, cfg, next, snapshot);

            waitsFor(function () {
                return self.emit.calls.length;
            });

            runs(function () {

                var calls = self.emit.calls;
                expect(calls.length).toEqual(3);

                expect(calls[0].args[0]).toEqual('data');
                var newMsg = self.emit.calls[0].args[1];
                expect(newMsg.body.results.length).toEqual(4);
                expect(newMsg.body.results[0].id).toEqual('8fd9f83c-3453-418c-9f3b-5a218bfc842a');
                expect(newMsg.body.results[1].id).toEqual('ad921e37-0ea1-4aba-a57e-8caadfc093eb');
                expect(newMsg.body.results[2].id).toEqual('8fd9f83c-3453-418c-9f3b-5a218bfc8421');
                expect(newMsg.body.results[3].id).toEqual('ad921e37-0ea1-4aba-a57e-8caadfc093e1');


                expect(calls[1].args[0]).toEqual('snapshot');
                expect(Object.keys(calls[1].args[1]).length).toEqual(2);
                expect(calls[1].args[1].lastModifiedAt).toEqual('2014-08-20T09:22:36.569Z');
                expect(calls[1].args[1].unsyncedOrders).toEqual({
                    // this order was not emitted
                    '12345678-0ea1-4aba-a57e-8caadfc093e1': true
                });

                expect(calls[2].args[0]).toEqual('end');
            });
        });

        it('should cleanup unsyncedOrders even if syncedCustomersOnly is not set', function() {

            var snapshot = {
                unsyncedOrders: {
                    '8fd9f83c-3453-418c-9f3b-5a218bfc8421': true,
                    'ad921e37-0ea1-4aba-a57e-8caadfc093e1': true,
                    '12345678-0ea1-4aba-a57e-8caadfc093e1': true
                }
            };

            var cfg = {
                client: 'test_client',
                clientSecret: 'so_secret',
                project: 'test_project',
                where : 'externalId is defined',
                expandCustomerExternalId: true
            };

            // should query unsyncedOrders also
            nock('https://api.sphere.io')
                // get up to 20 updated orders
                .get(GET_ALL_ENDPOINT + 'where=lastModifiedAt%20%3E%20%221970-01-01T00%3A00%3A00.000Z%22%20' +
                'and%20externalId%20is%20defined' + LIMIT_SORT_EXPAND)
                .reply(200, allOrders)
                // add up to 20 unsyncedOrders
                .get(GET_ALL_ENDPOINT + 'where=id%20in%20(%228fd9f83c-3453-418c-9f3b-5a218bfc8421%22%2C%22ad921e37-0ea1-4aba-a57e-8caadfc093e1%22%2C%2212345678-0ea1-4aba-a57e-8caadfc093e1%22)' + LIMIT_SORT_EXPAND)
                .reply(200, reboundedOrders)
                .get('/test_project/customers?where=id%20in%20(%223927ef3d-b5a1-476c-a61c-d719752ae2dd%22)')
                .reply(200, orderCustomers);

            queryOrders.process.call(self, msg, cfg, next, snapshot);

            waitsFor(function () {
                return self.emit.calls.length;
            });

            runs(function () {

                var calls = self.emit.calls;
                expect(calls.length).toEqual(3);

                expect(calls[0].args[0]).toEqual('data');
                var newMsg = self.emit.calls[0].args[1];
                expect(newMsg.body.results.length).toEqual(4);
                expect(newMsg.body.results[0].id).toEqual('8fd9f83c-3453-418c-9f3b-5a218bfc842a');
                expect(newMsg.body.results[1].id).toEqual('ad921e37-0ea1-4aba-a57e-8caadfc093eb');
                expect(newMsg.body.results[2].id).toEqual('8fd9f83c-3453-418c-9f3b-5a218bfc8421');
                expect(newMsg.body.results[3].id).toEqual('ad921e37-0ea1-4aba-a57e-8caadfc093e1');

                expect(calls[1].args[0]).toEqual('snapshot');
                expect(Object.keys(calls[1].args[1]).length).toEqual(2);
                expect(calls[1].args[1].lastModifiedAt).toEqual('2014-08-20T09:22:36.569Z');
                expect(calls[1].args[1].unsyncedOrders).toEqual({
                    // this order was not emitted
                    '12345678-0ea1-4aba-a57e-8caadfc093e1': true
                });

                expect(calls[2].args[0]).toEqual('end');
            });
        });
    });

    describe('Sphere.io queryOrders.js getMetaModel', function () {

        var cfg = {
            client: 'test_client',
            clientSecret: 'so_secret',
            project: 'test_project',
            expandCustomerExternalId: true
        };

        beforeEach(function(){
            nock('https://auth.sphere.io')
                .filteringRequestBody(/.*/, '*')
                .post('/oauth/token', '*')
                .times(40)
                .reply(200, {
                    'access_token': 'i0NC8wC8Z49uwBJKTS6MkFQN9_HhsSSA',
                    'token_type': 'Bearer',
                    'expires_in': 172800,
                    'scope': 'manage_project:test_project'
                });
        });

        it('should convert lstring to array of 2 strings', function () {

            nock('https://api.sphere.io')
                .get('/test_project')
                .reply(200, {languages: ['en', 'de']});

            var nameSchemaConverted = {
                type : 'object',
                properties : {
                    de: {
                        title : 'Item Name (de)',
                        type : 'string',
                        required : true
                    },
                    en: {
                        title : 'Item Name (en)',
                        type : 'string',
                        required : true
                    }
                }
            };

            var next = jasmine.createSpy('next');
            queryOrders.getMetaModel(cfg, next);

            waitsFor(function () {
                return next.calls.length;
            });

            runs(function () {
                expect(next.calls.length).toEqual(1);
                var schema = next.calls[0].args[1];
                var nameProperty = schema.out.properties.results.properties.lineItems.properties.name;
                expect(nameProperty).toEqual(nameSchemaConverted);
            });
        });

        it('should convert lstring to array of 3 strings', function () {

            nock('https://api.sphere.io')
                .get('/test_project')
                .reply(200, {languages: ['en', 'de', 'ru']});

            var nameSchemaConverted = {
                type : 'object',
                properties : {
                    de : {
                        title : 'Item Name (de)',
                        type : 'string',
                        required : true
                    },
                    en : {
                        title : 'Item Name (en)',
                        type : 'string',
                        required : true
                    },
                    ru : {
                        title : 'Item Name (ru)',
                        type : 'string',
                        required : true
                    }
                }
            };

            var next = jasmine.createSpy('next');
            queryOrders.getMetaModel(cfg, next);

            waitsFor(function () {
                return next.calls.length;
            });

            runs(function () {
                expect(next.calls.length).toEqual(1);
                var schema = next.calls[0].args[1];
                var nameProperty = schema.out.properties.results.properties.lineItems.properties.name;
                expect(nameProperty).toEqual(nameSchemaConverted);
            });
        });
    });
});

