describe('Add Variant', function() {

    var addVariant = require('../../lib/actions/addVariant');
    var nock = require('nock');
    var responseData = require('../data/add_variant_data.json');

    var cfg = {
        client: '1',
        clientSecret: '2',
        project: 'elasticio',
    };

    describe('with invalid input', function() {

        it('should emit an error when no masterVariantReference is provided', function() {

            var msg = {
                body: {
                    sku: "anSKU"
                }
            };

            var executor = jasmine.createSpyObj('executor', ['emit']);
            runs(function() {
                addVariant.process.call(executor, msg, cfg);
            });

            waitsFor(function() {
                return executor.emit.calls.length;
            });

            runs(function() {
                expect(executor.emit).toHaveBeenCalledWith('error', new Error);
                expect(executor.emit).toHaveBeenCalledWith('end');
            });

        });

        it('should emit an error when no sku is provided', function() {

            var msg = {
                body: {
                    masterVariantReference: "aMasterVariantReference"
                }
            };

            var executor = jasmine.createSpyObj('executor', ['emit']);
            runs(function() {
                addVariant.process.call(executor, msg, cfg);
            });

            waitsFor(function() {
                return executor.emit.calls.length;
            });

            runs(function() {
                expect(executor.emit).toHaveBeenCalledWith('error', new Error);
                expect(executor.emit).toHaveBeenCalledWith('end');
            });
        });

    });

    describe('with no product found', function() {

        beforeEach(function() {
            nock('https://auth.sphere.io').post('/oauth/token')
                .reply(200, {
                    'access_token': '73',
                    'token_type': 'Bearer',
                    'expires_in': 172800,
                    'scope': 'manage_project:elasticio'
                });

            nock('https://api.sphere.io:443')
                .get('/elasticio/products?where=masterData(current(masterVariant(sku%3D%22aMasterVariantReference%22)))')
                .reply(200, {
                    "statusCode": 200,
                    "body": {
                        "offset": 0,
                        "count": 0,
                        "total": 0,
                        "results": []
                    }
                });
        });

        it('should emit rebound when no poduct is found for the search criteria', function() {

            var msg = {
                body: {
                    sku: "anSKU",
                    masterVariantReference: "aMasterVariantReference"
                }
            };

            var executor = jasmine.createSpyObj('executor', ['emit']);
            runs(function() {
                addVariant.process.call(executor, msg, cfg);
            });

            waitsFor(function() {
                return executor.emit.calls.length;
            });

            runs(function() {
                expect(executor.emit).toHaveBeenCalledWith('rebound', 'No product with masterVariantReference aMasterVariantReference found.');
                expect(executor.emit).toHaveBeenCalledWith('end');
                expect(executor.emit).not.toHaveBeenCalledWith('data', {});
            });
        });

    });

    describe('when a product update fails for whatever reason', function() {
        beforeEach(function() {

            nock('https://auth.sphere.io').post('/oauth/token')
                .reply(200, {
                    'access_token': '73',
                    'token_type': 'Bearer',
                    'expires_in': 172800,
                    'scope': 'manage_project:elasticio'
                });

            nock('https://api.sphere.io:443')
                .get('/elasticio/products?where=masterData(current(masterVariant(sku%3D%22aMasterVariantReference%22)))')
                .reply(200, responseData.queryProductResponse);


            nock('https://api.sphere.io:443')
                .post('/elasticio/products/anId', [])
                .reply(400, {});
        });

        it('should emit an error', function() {
            var msg = {
                body: {
                    sku: "anSKU",
                    masterVariantReference: "aMasterVariantReference"
                }
            };

            var executor = jasmine.createSpyObj('executor', ['emit']);
            runs(function() {
                addVariant.process.call(executor, msg, cfg);
            });

            waitsFor(function() {
                return executor.emit.calls.length;
            });

            runs(function() {
                expect(executor.emit).not.toHaveBeenCalledWith('rebound', 'No product with masterVariantReference aMasterVariantReference found.');
                expect(executor.emit).toHaveBeenCalledWith('error', jasmine.any(Object));
                expect(executor.emit).toHaveBeenCalledWith('end');
                expect(executor.emit).not.toHaveBeenCalledWith('data', {});
            });
        });

    });

    describe('when a product update fails because of 409', function() {
        beforeEach(function() {

            nock('https://auth.sphere.io').post('/oauth/token')
                .reply(200, {
                    'access_token': '73',
                    'token_type': 'Bearer',
                    'expires_in': 172800,
                    'scope': 'manage_project:elasticio'
                });

            nock('https://api.sphere.io:443')
                .get('/elasticio/products?where=masterData(current(masterVariant(sku%3D%22aMasterVariantReference%22)))')
                .reply(200, responseData.queryProductResponse);


            nock('https://api.sphere.io:443')
                .post('/elasticio/products/anId', [])
                .reply(409, responseData.reboundResponse);
        });

        it('should emit rebound', function() {
            var msg = {
                body: {
                    sku: "anSKU",
                    masterVariantReference: "aMasterVariantReference"
                }
            };

            var executor = jasmine.createSpyObj('executor', ['emit']);
            runs(function() {
                addVariant.process.call(executor, msg, cfg);
            });

            waitsFor(function() {
                return executor.emit.calls.length;
            });

            runs(function() {
                expect(executor.emit).toHaveBeenCalledWith('rebound', 'Mismatched version for addVariant action on product with masterVariant sku: aMasterVariantReference');
                expect(executor.emit).toHaveBeenCalledWith('end');
                expect(executor.emit).not.toHaveBeenCalledWith('data', {});
            });
        });

    });
    describe('success case', function() {

        beforeEach(function() {

            nock('https://auth.sphere.io').post('/oauth/token')
                .reply(200, {
                    'access_token': '73',
                    'token_type': 'Bearer',
                    'expires_in': 172800,
                    'scope': 'manage_project:elasticio'
                });

            nock('https://api.sphere.io:443')
                .get('/elasticio/products?where=masterData(current(masterVariant(sku%3D%22aMasterVariantReference%22)))')
                .reply(200, responseData.queryProductResponse);


            nock('https://api.sphere.io:443')
                .post('/elasticio/products/anId', [])
                .reply(200, responseData.addVariantResponse);
        });

        it('should emit the response of product update', function() {

            var msg = {
                body: {
                    sku: "anSKU",
                    masterVariantReference: "aMasterVariantReference"
                }
            };

            var executor = jasmine.createSpyObj('executor', ['emit']);
            runs(function() {
                addVariant.process.call(executor, msg, cfg);
            });

            waitsFor(function() {
                return executor.emit.calls.length;
            });

            runs(function() {
                expect(executor.emit).not.toHaveBeenCalledWith('rebound', 'No product with masterVariantReference aMasterVariantReference found.');

                expect(executor.emit).toHaveBeenCalledWith('data', responseData.addVariantResponse);

                expect(executor.emit).toHaveBeenCalledWith('end');
            });
        });
    });

});