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

                expect(executor.emit).toHaveBeenCalledWith('data', {
                    id: '33afbe8a-fd02-4b4f-80ac-66ff05dbaed3',
                    version: 5,
                    productType: {
                        typeId: 'product-type',
                        id: '5dfdc7a9-76a7-4e02-8c4e-6b5b9bd58ef8'
                    },
                    catalogs: [],
                    masterData: {
                        current: {
                            name: {
                                en: 'WB ATHLETIC TANK'
                            },
                            description: {
                                en: 'Sample description'
                            },
                            categories: [{
                                typeId: 'category',
                                id: '9ac573d5-8f0b-4451-aa57-7626f264aaef'
                            }],
                            slug: {
                                en: 'wb-athletic-tank1368609991639'
                            },
                            masterVariant: {
                                id: 1,
                                sku: 'sku_WB_ATHLETIC_TANK_variant1_1368609991639',
                                prices: [{
                                    value: {
                                        currencyCode: 'EUR',
                                        centAmount: 8400
                                    }
                                }],
                                images: [{
                                    url: 'https://www.commercetools.com/cli/data/253265444_1.jpg',
                                    dimensions: {
                                        w: 1400,
                                        h: 1400
                                    }
                                }],
                                attributes: []
                            },
                            variants: []
                        },
                        staged: {
                            name: {
                                en: 'WB ATHLETIC TANK'
                            },
                            description: {
                                en: 'Sample description'
                            },
                            categories: [{
                                typeId: 'category',
                                id: '9ac573d5-8f0b-4451-aa57-7626f264aaef'
                            }],
                            slug: {
                                en: 'wb-athletic-tank1368609991639'
                            },
                            masterVariant: {
                                id: 1,
                                sku: 'sku_WB_ATHLETIC_TANK_variant1_1368609991639',
                                prices: [{
                                    value: {
                                        currencyCode: 'EUR',
                                        centAmount: 50
                                    }
                                }],
                                images: [{
                                    url: 'https://www.commercetools.com/cli/data/253265444_1.jpg',
                                    dimensions: {
                                        w: 1400,
                                        h: 1400
                                    }
                                }],
                                attributes: []
                            },
                            variants: [{
                                id: 2,
                                sku: 'anSku',
                                prices: [],
                                images: [],
                                attributes: []
                            }]
                        },
                        published: true,
                        hasStagedChanges: true
                    },
                    catalogData: {},
                    taxCategory: {
                        typeId: 'tax-category',
                        id: '36ce04f7-6e1c-4115-be37-b14abb8eff3e'
                    },
                    lastVariantId: 2,
                    createdAt: '1970-01-01T00:00:00.001Z',
                    lastModifiedAt: '2014-09-15T13:20:13.891Z'
                });

                expect(executor.emit).toHaveBeenCalledWith('end');
            });
        });
    });

});