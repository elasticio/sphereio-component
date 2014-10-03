describe('Sphere.io queryOrders.js', function () {
    var nock = require('nock');
    var allOrders = require('../data/all_orders.json.js');
    var allOrdersWithException = require('../data/all_orders_with_exception.json.js');
    var allOrdersResponse = require('../data/all_orders_response.json.js');
    var orderCustomers = require('../data/order_customers.json.js');
    var modifiedOrders = require('../data/modified_orders.json.js');
    var emptyResult = {'offset': 0, 'count': 0, 'total': 49, 'results': []};

    nock('https://auth.sphere.io')
        .filteringRequestBody(/.*/, '*')
        .post('/oauth/token', '*')
        .times(5)
        .reply(200, {
            'access_token': 'i0NC8wC8Z49uwBJKTS6MkFQN9_HhsSSA',
            'token_type': 'Bearer',
            'expires_in': 172800,
            'scope': 'manage_project:test_project'
        });

    nock('https://api.sphere.io')
        .get('/test_project/orders?where=lastModifiedAt%20%3E%20%221970-01-01T00%3A00%3A00.000Z%22&limit=20&sort=lastModifiedAt%20asc')
        .times(2)
        .reply(200, allOrders)
        .get('/test_project/orders?where=lastModifiedAt%20%3E%20%222014-08-21T00%3A00%3A00.000Z%22&limit=20&sort=lastModifiedAt%20asc')
        .reply(200, modifiedOrders)
        .get('/test_project/orders?where=lastModifiedAt%20%3E%20%222014-09-21T00%3A00%3A00.000Z%22&limit=20&sort=lastModifiedAt%20asc')
        .reply(500, JSON.stringify({message :'Ouch'}))
        .get('/test_project/orders?where=lastModifiedAt%20%3E%20%222014-08-25T00%3A00%3A00.000Z%22&limit=20&sort=lastModifiedAt%20asc')
        .reply(200, emptyResult)
        .get('/test_project/customers?where=id%20in%20(%223927ef3d-b5a1-476c-a61c-d719752ae2dd%22)')
        .reply(200, orderCustomers);

    var next = jasmine.createSpy('next');
    var queryOrders = require('../../lib/triggers/queryOrders.js');
    var helpers = require('../../lib/helpers.js');

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
                .get('/test_project/orders?where=lastModifiedAt%20%3E%20%221970-01-01T00%3A00%3A00.000Z%22&limit=20&sort=lastModifiedAt%20asc')
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
                .get('/test_project/orders?where=lastModifiedAt%20%3E%20%221970-01-01T00%3A00%3A00.000Z%22&limit=20&sort=lastModifiedAt%20asc')
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
                .get('/test_project/orders?where=lastModifiedAt%20%3E%20%221970-01-01T00%3A00%3A00.000Z%22&limit=20&sort=lastModifiedAt%20asc')
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

        it('should emit new message if second query was successful (with snapshop `lastModifiedAt` param)', function () {

            nock('https://api.sphere.io').get('/test_project/orders?where=lastModifiedAt%20%3E%20%222014-08-21T00%3A00%3A00.000Z%22&limit=20&sort=lastModifiedAt%20asc')
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

            nock('https://api.sphere.io').get('/test_project/orders?where=lastModifiedAt%20%3E%20%222014-09-21T00%3A00%3A00.000Z%22&limit=20&sort=lastModifiedAt%20asc')
                .reply(500, JSON.stringify({message :'Ouch'}));

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
                expect(calls[0].args[1].message).toEqual('Ouch');

                expect(calls[1].args[0]).toEqual('end');
            });
        });

        it('should emit new message only if orders count more than 0', function () {

            nock('https://api.sphere.io').get('/test_project/orders?where=lastModifiedAt%20%3E%20%222014-08-25T00%3A00%3A00.000Z%22&limit=20&sort=lastModifiedAt%20asc')
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
                .get('/test_project/orders?where=lastModifiedAt%20%3E%20%221970-01-01T00%3A00%3A00.000Z%22%20and%20externalId%20is%20defined&limit=20&sort=lastModifiedAt%20asc')
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
                expect(Object.keys(calls[1].args[1]).length).toEqual(1);
                expect(calls[1].args[1].lastModifiedAt).toEqual('2014-08-20T09:22:36.569Z');

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

