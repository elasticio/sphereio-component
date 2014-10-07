describe('Sphere.io queryCustomers.js', function () {
    var nock = require('nock');
    var allCustomers = require('../data/all_customers.json.js');
    var modifiedCustomers = require('../data/modified_customers.json.js');
    var emptyResult = {"offset": 0, "count": 0, "total": 49, "results": []};

    nock('https://auth.sphere.io')
        .filteringRequestBody(/.*/, '*')
        .post('/oauth/token', "*")
        .times(4)
        .reply(200, {
            "access_token": "i0NC8wC8Z49uwBJKTS6MkFQN9_HhsSSA",
            "token_type": "Bearer",
            "expires_in": 172800,
            "scope": "manage_project:test_project"
        });

    nock('https://api.sphere.io')
        .get('/test_project/customers?where=lastModifiedAt%20%3E%20%221970-01-01T00%3A00%3A00.000Z%22&limit=20&sort=lastModifiedAt%20asc')
        .reply(200, allCustomers)
        .get('/test_project/customers?where=lastModifiedAt%20%3E%20%222014-08-21T00%3A00%3A00.000Z%22&limit=20&sort=lastModifiedAt%20asc')
        .reply(200, modifiedCustomers)
        .get('/test_project/customers?where=lastModifiedAt%20%3E%20%222014-09-21T00%3A00%3A00.000Z%22&limit=20&sort=lastModifiedAt%20asc')
        .reply(500, {message:'Ouch'})
        .get('/test_project/customers?where=lastModifiedAt%20%3E%20%222014-08-25T00%3A00%3A00.000Z%22&limit=20&sort=lastModifiedAt%20asc')
        .reply(200, emptyResult);

    var next = jasmine.createSpy('next');
    var queryCustomers = require('../../lib/triggers/queryCustomers.js');
    var helpers = require('../../lib/helpers.js');

    describe('process', function () {
        var msg;
        var self;
        var cfg;

        beforeEach(function () {
            msg = {};
            self = jasmine.createSpyObj('self', ['emit']);
            cfg = {
                client: 'test_client',
                clientSecret: 'so_secret',
                project: 'test_project'
            };
        });

        it('should emit new message if first query was successful', function () {
            spyOn(helpers, 'updateSnapshotWithLastModified').andReturn();

            queryCustomers.process.call(self, msg, cfg, next, {});

            waitsFor(function () {
                return self.emit.calls.length;
            });

            runs(function () {
                expect(self.emit.calls.length).toEqual(3);
                var calls = self.emit.calls;
                expect(calls[0].args[0]).toEqual('data');
                expect(calls[1].args[0]).toEqual('snapshot');
                expect(Object.keys(calls[1].args[1]).length).toEqual(0);
                expect(calls[2].args[0]).toEqual('end');
                var newMsg = self.emit.calls[0].args[1];
                expect(newMsg.body.length).toEqual(allCustomers.length);
            });
        });

        it('should emit new message if second query was successful (with snapshop `lastModifiedAt` param)', function () {
            spyOn(helpers, 'updateSnapshotWithLastModified').andReturn();
            var date = "2014-08-21T00:00:00.000Z";
            var snapshot = {
                "lastModifiedAt": date
            };
            queryCustomers.process.call(self, msg, cfg, next, snapshot);

            waitsFor(function () {
                return self.emit.calls.length;
            });

            runs(function () {
                expect(self.emit.calls.length).toEqual(3);
                var calls = self.emit.calls;
                expect(calls[0].args[0]).toEqual('data');

                expect(calls[1].args[0]).toEqual('snapshot');
                expect(calls[1].args[1].lastModifiedAt).toEqual(date);

                expect(calls[2].args[0]).toEqual('end');
                var newMsg = self.emit.calls[0].args[1];
                expect(newMsg.body.length).toEqual(modifiedCustomers.length);
            });
        });
        
        it('should emit error if request to sphere.io was failed', function () {
            spyOn(helpers, 'updateSnapshotWithLastModified').andReturn();
            var snapshot = {
                "lastModifiedAt": "2014-09-21T00:00:00.000Z"
            };
            
            queryCustomers.process.call(self, msg, cfg, next, snapshot);

            waitsFor(function () {
                return self.emit.calls.length;
            });

            runs(function () {
                expect(self.emit.calls.length).toEqual(2);
                var calls = self.emit.calls;
                expect(calls[0].args[0]).toEqual('error');
                expect(calls[0].args[1].message).toEqual('Ouch');
                expect(calls[1].args[0]).toEqual('end');
            });
        });
        
        it('should emit new message only if customers count more than 0', function () {
            spyOn(helpers, 'updateSnapshotWithLastModified').andReturn();
            var date = "2014-08-25T00:00:00.000Z";
            var snapshot = {
                lastModifiedAt: date
            };
            queryCustomers.process.call(self, msg, cfg, next, snapshot);

            waitsFor(function () {
                return self.emit.calls.length;
            });

            runs(function () {
                expect(self.emit.calls.length).toEqual(2);
                var calls = self.emit.calls;

                expect(calls[0].args[0]).toEqual('snapshot');
                expect(calls[0].args[1].lastModifiedAt).toEqual(date);

                expect(calls[1].args[0]).toEqual('end');
            });
        });
    });

    describe('when sousing where field', function() {
        var msg;
        var self;
        var cfg;

        beforeEach(function() {

            nock('https://auth.sphere.io')
                .filteringRequestBody(/.*/, '*')
                .post('/oauth/token', "*")
                .reply(200, {
                    "access_token": "i0NC8wC8Z49uwBJKTS6MkFQN9_HhsSSA",
                    "token_type": "Bearer",
                    "expires_in": 172800,
                    "scope": "manage_project:test_project"
                });

            nock('https://api.sphere.io')
                .get('/test_project/customers?where=lastModifiedAt%20%3E%20%221970-01-01T00%3A00%3A00.000Z%22%20and%20externalId%20is%20defined&limit=20&sort=lastModifiedAt%20asc')
                .reply(200, allCustomers);

            msg = {};
            self = jasmine.createSpyObj('self', ['emit']);
            cfg = {
                client: 'test_client',
                clientSecret: 'so_secret',
                project: 'test_project',
                where : 'externalId is defined'
            };

            spyOn(helpers, 'updateSnapshotWithLastModified').andReturn();
        });

        it('should emit new message if first query was successful', function() {

            queryCustomers.process.call(self, msg, cfg, next, {});

            waitsFor(function () {
                return self.emit.calls.length;
            });

            runs(function () {
                expect(self.emit.calls.length).toEqual(3);
                var calls = self.emit.calls;
                expect(calls[0].args[0]).toEqual('data');
                expect(calls[1].args[0]).toEqual('snapshot');
                expect(Object.keys(calls[1].args[1]).length).toEqual(0);
                expect(calls[2].args[0]).toEqual('end');
                var newMsg = self.emit.calls[0].args[1];
                expect(newMsg.body.length).toEqual(allCustomers.length);
            });
        });
    });

    describe('when some customer has addresses', function() {
        var msg;
        var self;
        var cfg;

        beforeEach(function() {

            nock('https://auth.sphere.io')
                .filteringRequestBody(/.*/, '*')
                .post('/oauth/token', "*")
                .reply(200, {
                    "access_token": "i0NC8wC8Z49uwBJKTS6MkFQN9_HhsSSA",
                    "token_type": "Bearer",
                    "expires_in": 172800,
                    "scope": "manage_project:test_project"
                });

            nock('https://api.sphere.io')
                .get('/test_project/customers?where=lastModifiedAt%20%3E%20%221970-01-01T00%3A00%3A00.000Z%22&limit=20&sort=lastModifiedAt%20asc')
                .reply(200, allCustomers)
                .get('/test_project/customers?where=lastModifiedAt%20%3E%20%222014-08-21T00%3A00%3A00.000Z%22&limit=20&sort=lastModifiedAt%20asc')
                .reply(200, modifiedCustomers)
                .get('/test_project/customers?where=lastModifiedAt%20%3E%20%222014-09-21T00%3A00%3A00.000Z%22&limit=20&sort=lastModifiedAt%20asc')
                .reply(500, 'Ouch');

            msg = {};
            self = jasmine.createSpyObj('self', ['emit']);
            cfg = {
                client: 'test_client',
                clientSecret: 'so_secret',
                project: 'test_project'
            };
            spyOn(helpers, 'updateSnapshotWithLastModified').andReturn();
            runs(function() {
                queryCustomers.process.call(self, msg, cfg, next, {});
            });
            waitsFor(function () {
                return self.emit.calls.length;
            });
        });

        it('should set shipping and billing addresses types', function() {
            var result = self.emit.calls[0].args[1].body.results;
            var idWidthAddresses = '3927ef3d-b5a1-476c-a61c-d719752ae2dd';
            var customer = result.filter(function(r) { return r.id === idWidthAddresses; }).pop();

            expect(customer.addresses).toEqual([
                {
                    "id": 'vc4aX5Cd',
                    "title": 'te',
                    "salutation": 'mr',
                    "firstName": 'sfdg',
                    "lastName": 'sdfg',
                    "streetName": 'dsfg',
                    "streetNumber": '345',
                    "postalCode": '53453',
                    "country": 'BH',
                    "company": 'sdfg',
                    "department": 'sdfg',
                    "building": '345',
                    "pOBox": '5345',
                    "email": 'sfg@rtrewt.lol',
                    _type : 'billing'
                },
                {
                    "id": 'CdKj2Gn7',
                    "salutation": 'mr',
                    "firstName": 'sdgf',
                    "lastName": 'dgfsgsdfgsdg',
                    "country": 'BH',
                    _type : 'shipping'
                },
                {
                    "id": "hbd76FCC",
                    "firstName": "Homer",
                    "lastName": "Simpson",
                    "streetName": "some street",
                    "streetNumber": "-6",
                    "postalCode": "99999",
                    "city": "NY",
                    "country": "US"
                }
            ]);
            expect(customer.defaultBillingAddressId).toEqual('vc4aX5Cd');
            expect(customer.defaultShippingAddressId).toEqual('CdKj2Gn7');
        });
    });
});