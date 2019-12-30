const logger = require('@elastic.io/component-logger')();

xdescribe('Query Product Variant', function () {
    var nock = require('nock');
    var masterProduct = require('../data/product_master_variant.json.js');
    var queryProductVariant = require('../../lib/actions/queryProductVariant.js');
    var cfg = {
        client: 'test_client',
        clientSecret: 'so_secret',
        project: 'test_project'
    };


    beforeEach(function() {
        nock('https://auth.sphere.io').post('/oauth/token')
            .reply(200, {
                "access_token":"70kNDuiU_UstkLgWro3UYlhLbpXO5ywU",
                "token_type":"Bearer",
                "expires_in":172800,"scope":"manage_project:elasticio"
            });
    });


    describe('get master variant', function () {
        var msg;
        var self;
        var next = jasmine.createSpy();
        var snapshot;

        beforeEach(function () {
            msg = {
                body: {
                    id: 'timex-wr30m',
                    amount: 100,
                    currency: 'UAH'
                }
            };

            self = jasmine.createSpyObj('self', ['emit']);
            self.logger = logger;

            nock('https://api.sphere.io')
                .get('/test_project/products?where=masterData(current(variants(sku%20%3D%20%22timex-wr30m%22)%20or%20masterVariant(sku%20%3D%20%22timex-wr30m%22)))')
                .reply(200, masterProduct);

            runs(function () {
                queryProductVariant.process.call(self, msg, cfg, next, snapshot);
            });

            waitsFor(function() {
                return self.emit.calls.length;
            });
        });

        it('should call emit only 2 times', function () {
            expect(self.emit.calls.length).toEqual(2);
        });

        it('should emit proper data message', function () {
            var event = self.emit.calls[0].args[0];
            var data = self.emit.calls[0].args[1].body;
            expect(event).toEqual('data');
            expect(data.productId).toEqual('f499d66d-5bb7-48b0-b2ee-891317abfd69');
            expect(data.variantId).toEqual(1);
            expect(data.amount).toEqual(100);
            expect(data.currency).toEqual("UAH");
        });

        it('should emit end message', function () {
            var args = self.emit.calls[1].args;
            expect(args[0]).toEqual('end');
        });
    });

    describe('get not master variant', function () {
        var msg;
        var self;
        var next = jasmine.createSpy();
        var snapshot;

        beforeEach(function () {
            msg = {
                body: {
                    id: 'timex-wr30m-metal',
                    amount: 200,
                    currency: 'EUR'
                }
            };

            self = jasmine.createSpyObj('self', ['emit']);
            self.logger = logger;

            nock('https://api.sphere.io')
                .get('/test_project/products?where=masterData(current(variants(sku%20%3D%20%22timex-wr30m-metal%22)%20or%20masterVariant(sku%20%3D%20%22timex-wr30m-metal%22)))')
                .reply(200, masterProduct);

            runs(function () {
                queryProductVariant.process.call(self, msg, cfg, next, snapshot);
            });

            waitsFor(function() {
                return self.emit.calls.length;
            });
        });

        it('should call emit only 2 times', function () {
            expect(self.emit.calls.length).toEqual(2);
        });

        it('should emit proper data message', function () {
            var event = self.emit.calls[0].args[0];
            var data = self.emit.calls[0].args[1].body;
            expect(event).toEqual('data');
            expect(data.productId).toEqual('f499d66d-5bb7-48b0-b2ee-891317abfd69');
            expect(data.variantId).toEqual(3);
            expect(data.amount).toEqual(200);
            expect(data.currency).toEqual("EUR");
        });

        it('should emit end message', function () {
            var args = self.emit.calls[1].args;
            expect(args[0]).toEqual('end');
        });
    });

    describe('not found variant', function () {
        var msg;
        var self;
        var next = jasmine.createSpy();
        var snapshot;

        beforeEach(function () {
            msg = {
                body: {
                    id: 'timex-wr30m-gold',
                    amount: 200,
                    currency: 'EUR'
                }
            };

            self = jasmine.createSpyObj('self', ['emit']);
            self.logger = logger;

            nock('https://api.sphere.io')
                .get('/test_project/products?where=masterData(current(variants(sku%20%3D%20%22timex-wr30m-gold%22)%20or%20masterVariant(sku%20%3D%20%22timex-wr30m-gold%22)))')
                .reply(200, {results: [], total: 0, count: 0, offset: 0});

            runs(function () {
                queryProductVariant.process.call(self, msg, cfg, next, snapshot);
            });

            waitsFor(function() {
                return self.emit.calls.length;
            });
        });

        it('should call emit only 2 times', function () {
            expect(self.emit.calls.length).toEqual(2);
        });

        it('should emit rebound message', function () {
            var event = self.emit.calls[0].args[0];
            expect(event).toEqual('rebound');
        });

        it('should emit end message', function () {
            var args = self.emit.calls[1].args;
            expect(args[0]).toEqual('end');
        });
    });
    describe('error handling', function () {
        var msg;
        var self;
        var next = jasmine.createSpy();
        var snapshot;

        beforeEach(function () {
            msg = {
                body: {
                    id: 'timex-wr30m-error',
                    amount: 200,
                    currency: 'EUR'
                }
            };

            self = jasmine.createSpyObj('self', ['emit']);
            self.logger = logger;

            nock('https://api.sphere.io')
                .get('/test_project/products?where=masterData(current(variants(sku%20%3D%20%22timex-wr30m-error%22)%20or%20masterVariant(sku%20%3D%20%22timex-wr30m-error%22)))')
                .reply(500, {message: "Internal Server Error"});

            runs(function () {
                queryProductVariant.process.call(self, msg, cfg, next, snapshot);
            });

            waitsFor(function() {
                return self.emit.calls.length;
            });
        });

        it('should call emit only 2 times', function () {
            expect(self.emit.calls.length).toEqual(2);
        });

        it('should emit error message', function () {
            var event = self.emit.calls[0].args[0];

            var data = self.emit.calls[0].args[1];
            expect(event).toEqual('error');

            expect(data.message).toEqual('Internal Server Error');

        });

        it('should emit end message', function () {
            var args = self.emit.calls[1].args;
            expect(args[0]).toEqual('end');
        });
    });
});
