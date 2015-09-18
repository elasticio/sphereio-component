describe('Sphereio update customers external id', function () {
    var updateCustomer = require('../../lib/actions/updateCustomer.js');
    var oneCustomer = require('../data/one_customer.json.js');
    var oneModifiedCustomer = require('../data/one_modified_customer.json.js');
    var nock = require('nock');

    var cfg = {
        client: 1,
        clientSecret: 1,
        project: 'elasticio'
    };
     
    beforeEach(function() {
        nock('https://auth.sphere.io').post('/oauth/token')
            .reply(200, {
                "access_token":"70kNDuiU_UstkLgWro3UYlhLbpXO5ywU",
                "token_type":"Bearer",
                "expires_in":172800,"scope":"manage_project:elasticio"
            });
    });

    describe('successful update', function() {
        var callback = jasmine.createSpy('callback');
        var self;

        beforeEach(function () {
            self = jasmine.createSpyObj('self', ['emit']);
            var msg = {
                body: {
                    id: 42,
                    external_id: '4200'
                }
            };

            var scope = nock('https://api.sphere.io');
            scope.get('/elasticio/customers/42').reply(200, {"version":12, id: 42});
            scope.post('/elasticio/customers/42').reply(200, {"version":12, id: 42});

            runs(function() {
                updateCustomer.process.call(self, msg, cfg, callback);
            });

            waitsFor(function() {
                return self.emit.calls.length;
            }, "Timed out", 1000);
        });

        it('should call callback with right params', function() {
            var data = self.emit.calls[0].args[1].body;
            expect(data).toEqual({ version: 12, id: 42 });
        });

        it('should call end event', function() {
            expect(self.emit).toHaveBeenCalledWith('end');
        });

        it('should not emit more then two events', function() {
            expect(self.emit.calls.length).toEqual(2);
        });
    });

    describe('concurrency error', function() {
        var callback = jasmine.createSpy('callback');
        var self;
        beforeEach(function () {
            self = jasmine.createSpyObj('self', ['emit']);
            var msg = {
                body: {
                    id: 42,
                    external_id: '4200'
                }
            };

            var scope = nock('https://api.sphere.io');
            scope.get('/elasticio/customers/42').reply(200, {"version":12, id: 42});
            scope.post('/elasticio/customers/42').reply(409, {statusCode: 409});

            runs(function() {
                updateCustomer.process.call(self, msg, cfg, callback);
            });

            waitsFor(function() {
                return self.emit.calls.length;
            }, "Timed out", 1000);
        });

        it('should rebound message', function() {
            expect(self.emit).toHaveBeenCalledWith('rebound');
        });

        it('should emit end', function() {
            expect(self.emit).toHaveBeenCalledWith('end');
        });

        it('should not emit more then two events', function() {
            expect(self.emit.calls.length).toEqual(2);
        });
    });

    describe('not found error', function() {
        var callback = jasmine.createSpy('callback');
        var self;
        beforeEach(function () {
            self = jasmine.createSpyObj('self', ['emit']);
            var msg = {
                body: {
                    id: 54,
                    external_id: '5400'
                }
            };

            var scope = nock('https://api.sphere.io');
            scope.get('/elasticio/customers/54').reply(404, {statusCode: 404});
            
            runs(function() {
                updateCustomer.process.call(self, msg, cfg, callback);
            });

            waitsFor(function() {
                return self.emit.calls.length;
            }, "Timed out", 1000);
        });

        it('should emit right error', function() {
            expect(self.emit).toHaveBeenCalledWith('error', {
                message: 'Endpoint \'/elasticio/customers/54\' not found.',
                name: 'NotFound',
                body: {
                    statusCode: 404,
                    message: 'Endpoint \'/elasticio/customers/54\' not found.',
                    originalRequest: {
                        endpoint: '/customers/54'
                    }
                }, statusCode: 404, code: 404
            });
        });

        it('should emmit end', function() {
            expect(self.emit).toHaveBeenCalledWith('end');
        });

        it('should not emit more then two events', function() {
            expect(self.emit.calls.length).toEqual(2);
        });
    });

    describe('when updated customer has addresses', function() {
        var self;
        var callback = jasmine.createSpy('callback');

        beforeEach(function () {
            self = jasmine.createSpyObj('self', ['emit']);
            var msg = {
                body: {
                    id: '3927ef3d-b5a1-476c-a61c-d719752ae2dd',
                    external_id: '4200'
                }
            };

            var scope = nock('https://api.sphere.io');
            scope.get('/elasticio/customers/3927ef3d-b5a1-476c-a61c-d719752ae2dd').reply(200, oneCustomer);
            scope.post('/elasticio/customers/3927ef3d-b5a1-476c-a61c-d719752ae2dd').reply(200, oneCustomer);

            runs(function() {
                updateCustomer.process.call(self, msg, cfg, callback);
            });

            waitsFor(function() {
                return self.emit.calls.length;
            }, "Timed out", 1000);
        });

        it('should set shipping and billing addresses types', function() {
            var customer = self.emit.calls[0].args[1].body;

            expect(customer.addresses).toEqual(oneModifiedCustomer.addresses);
            expect(customer.defaultBillingAddressId).toEqual('vc4aX5Cd');
            expect(customer.defaultShippingAddressId).toEqual('CdKj2Gn7');
        });

    });
});