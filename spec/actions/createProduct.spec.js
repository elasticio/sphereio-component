describe('Sphereio create product', function () {
    var createProduct = require('../../lib/actions/createProduct.js');
    var attributeManager = require('../../lib/attributeManager.js');
    var nock = require('nock');
    var fs = require('fs');

    var cfg = {
        client: '1',
        clientSecret: '2',
        project: 'elasticio',
        productType: '3'
    };

    beforeEach(function() {
        nock('https://auth.sphere.io').post('/oauth/token')
            .reply(200, {
                'access_token':'73',
                'token_type':'Bearer',
                'expires_in':172800,'scope':'manage_project:elasticio'
            });

        nock('https://api.sphere.io').get('/elasticio/product-types/3')
            .reply(200, {
                attributes: [
                    {
                        'name': 'attribute1',
                        'label': { 'en': 'Attribute 1'},
                        'type': {'name': 'text'},
                        'isRequired': true
                    },{
                        'name': 'attribute2',
                        'label': { 'en': 'Attribute 2'},
                        'type': {'name': 'text'},
                        'isRequired': false
                    }
                ]
            });
    });

    describe('post product to service', function() {
        var callback = jasmine.createSpy('callback');
        var msg = {
            body: {
                slug: { en: 'brain'},
                name: { en: 'brain'},
                metaTitle: { en: 'human brain'},
                metaDescription: { en: 'delicious forzombies'},
                description: { en: 'delicious forzombies'},
                productType: '5dfdc7a9-76a7-4e02-8c4e-6b5b9bd58ef8',
                masterVariant: {
                    sku: 'master-variant-sku',
                    prices: [
                        {currencyCode: 'EUR', amount: 12},
                        {currencyCode: 'USD', amount: 33}
                    ]
                },
                variants: [
                    {
                        sku: 'variant-sku',
                        prices: [
                            {currencyCode: 'EUR', amount: 5},
                            {currencyCode: 'USD', amount: 8}
                        ]
                    }
                ]
            }
        };

        // in request, all 'amount' should become 'centAmount'
        var convertedMsg = {
            body: {
                slug: { en: 'brain'},
                name: { en: 'brain'},
                metaTitle: { en: 'human brain'},
                metaDescription: { en: 'delicious forzombies'},
                description: { en: 'delicious forzombies'},
                productType: '5dfdc7a9-76a7-4e02-8c4e-6b5b9bd58ef8',
                masterVariant: {
                    sku: 'master-variant-sku',
                    prices: [
                        {currencyCode: 'EUR', centAmount: 1200},
                        {currencyCode: 'USD', centAmount: 3300}
                    ]
                },
                variants: [
                    {
                        sku: 'variant-sku',
                        prices: [
                            {currencyCode: 'EUR', centAmount: 500},
                            {currencyCode: 'USD', centAmount: 800}
                        ]
                    }
                ]
            }
        };

        var sphereResponse = {
            id: 'c5d24489-22e6-4c86-a441-f6733be10ac1',
            version: 1,
            masterData: {
                current: {
                    variants: [
                        {
                            sku: 'variant-sku',
                            prices: [
                                {currencyCode: 'EUR', centAmount: 500},
                                {currencyCode: 'USD', centAmount: 800}
                            ]
                        }
                    ]
                }
            }
        };

        // in response, all 'centAmount' should become 'amount'
        var componentResponse = {
            id: 'c5d24489-22e6-4c86-a441-f6733be10ac1',
            version: 1,
            masterData: {
                current: {
                    variants: [
                        {
                            sku: 'variant-sku',
                            prices: [
                                {currencyCode: 'EUR', amount: 5},
                                {currencyCode: 'USD', amount: 8}
                            ]
                        }
                    ]
                }
            }
        };

        var self;

        beforeEach(function() {
            self = jasmine.createSpyObj('self', ['emit']);

            spyOn(attributeManager, 'readProduct').andCallThrough();

            nock('https://api.sphere.io')
                .post('/elasticio/products')
                .reply(201, sphereResponse);

            runs(function() {
                createProduct.process.call(self, msg, cfg, callback);
            });

            waitsFor(function() {
                return self.emit.calls.length;
            }, 'Timed out', 1000);
        });

        it('function readProduct should receive centAmounts instead of amounts', function() {
            expect(attributeManager.readProduct.calls[0].args[1]).toEqual(convertedMsg);
        });

        it('should call callback with right params', function() {
            var data = self.emit.calls[0].args[1].body;
            expect(data).toEqual(componentResponse);
        });

        it('should call end event', function() {
            expect(self.emit).toHaveBeenCalledWith('end');
        });

        it('should not emit more then two events', function() {
            expect(self.emit.calls.length).toEqual(2);
        });
    });

    describe('post product to service with some error', function() {
        var callback = jasmine.createSpy('callback');
        var msg = {body: {}};
        var self;

        beforeEach(function() {
            self = jasmine.createSpyObj('self', ['emit']);
            nock('https://api.sphere.io').post('/elasticio/products')
                .reply(400, {message: 'Request body does not contain valid JSON.'});

            runs(function() {
                createProduct.process.call(self, msg, cfg, callback);
            });

            waitsFor(function() {
                return self.emit.calls.length;
            }, 'Timed out', 1000);
        });

        it('should emit an error', function() {
            expect(self.emit).toHaveBeenCalledWith('error', { message : 'Request body does not contain valid JSON.', originalRequest : { endpoint : '/products', payload : { productType : { typeId : 'product-type', id : '3' } } } });
        });

        it('should emit end event', function() {
            expect(self.emit).toHaveBeenCalledWith('end');
        });

        it('should not emit more then two events', function() {
            expect(self.emit.calls.length).toEqual(2);
        });
    });

    describe('report an error if failed to read a product from message', function() {
        var callback = jasmine.createSpy('callback');
        var msg = {};
        var self;

        beforeEach(function() {
            self = jasmine.createSpyObj('self', ['emit']);
            runs(function() {
                createProduct.process.call(self, msg, cfg, callback);
            });

            waitsFor(function() {
                return self.emit.calls.length;
            }, 'Timed out', 1000);
        });

        it('should emit an error', function() {
            expect(self.emit).toHaveBeenCalled();
        });

        it('should emit end event', function() {
            expect(self.emit).toHaveBeenCalledWith('end');
        });

        it('should not emit more then two events', function() {
            expect(self.emit.calls.length).toEqual(2);
        });
    });

    describe('request product types', function() {
        var callback = jasmine.createSpy('callback');

        beforeEach(function() {
            var scope = nock('https://api.sphere.io');
            scope.get('/elasticio/product-types').reply(200, {results: [
                {
                    id: 1,
                    name: 'food'
                },
                {
                    id:2,
                    name: 'arms'
                }
            ]});

            runs(function() {
                createProduct.getProductTypeSelectModel(cfg, callback);
            });

            waitsFor(function() {
                return callback.calls.length;
            }, 'Timed out', 1000);

        });

        it('should call callback with formated product types', function() {
            expect(callback).toHaveBeenCalledWith(null, { 1 : 'food', 2 : 'arms' });
        });
    });

});