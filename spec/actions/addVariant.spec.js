describe('Add Variant', function() {

    var addVariant = require('../../lib/actions/addVariant');
    var nock = require('nock');
    var responseData = require('../data/add_variant_data.json');

    var cfg = {
        client: '1',
        clientSecret: '2',
        project: 'elasticio',
        productType: '3'
    };

    var authResponse = {
        'access_token': '73',
        'token_type': 'Bearer',
        'expires_in': 172800,
        'scope': 'manage_project:elasticio'
    };

    var action = [{
        "action": "addVariant",
        "sku": "anSKU",
        "staged": false
    }];

    beforeEach(function() {
        nock('https://api.sphere.io').get('/elasticio/product-types/3')
            .reply(200, {
                attributes: [{
                    'name': 'attribute1',
                    'label': {
                        'en': 'Attribute 1'
                    },
                    'type': {
                        'name': 'text'
                    },
                    'isRequired': true
                }, {
                    'name': 'attribute2',
                    'label': {
                        'en': 'Attribute 2'
                    },
                    'type': {
                        'name': 'text'
                    },
                    'isRequired': false
                }]
            });
    });

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
                expect(executor.emit).toHaveBeenCalledWith('error', new Error('A master variant reference has to be provided.'));
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
                expect(executor.emit).toHaveBeenCalledWith('error', new Error('Variant SKU has to be provided.'));
                expect(executor.emit).toHaveBeenCalledWith('end');
            });
        });

    });

    describe('with no product found', function() {

        beforeEach(function() {
            nock('https://auth.sphere.io').post('/oauth/token').reply(200, authResponse);

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

            nock('https://auth.sphere.io').post('/oauth/token').reply(200, authResponse);

            nock('https://api.sphere.io:443')
                .get('/elasticio/products?where=masterData(current(masterVariant(sku%3D%22aMasterVariantReference%22)))')
                .reply(200, responseData.queryProductResponse);


            nock('https://api.sphere.io:443')
                .post('/elasticio/products/anId', action)
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

            nock('https://auth.sphere.io').post('/oauth/token').reply(200, authResponse);

            nock('https://api.sphere.io:443')
                .get('/elasticio/products?where=masterData(current(masterVariant(sku%3D%22aMasterVariantReference%22)))')
                .reply(200, responseData.queryProductResponse);


            nock('https://api.sphere.io:443')
                .post('/elasticio/products/anId', action)
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
                .reply(200, authResponse);

            nock('https://api.sphere.io:443')
                .get('/elasticio/products?where=masterData(current(masterVariant(sku%3D%22aMasterVariantReference%22)))')
                .reply(200, responseData.queryProductResponse);


            nock('https://api.sphere.io:443')
                .post('/elasticio/products/anId', [{"action":"addVariant","sku":"anSKU","staged":false,"attributes":{"attribute1":"Nenad","attribute2":"Nikolic"}}])
                .reply(200, responseData.addVariantResponse);
        });

        it('should emit the response of product update', function() {

            var msg = {
                body: {
                    sku: "anSKU",
                    masterVariantReference: "aMasterVariantReference",
                    attributes: {
                        attribute1: "Nenad",
                        attribute2: "Nikolic"
                    }
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