describe('Add Price', function () {
    var nock = require('nock');
    var masterProduct = require('../data/product_master_variant.json.js');
    var addPrice = require('../../lib/actions/addPrice.js');
    var cfg = {
        client: 'test_client',
        clientSecret: 'so_secret',
        project: 'test_project'
    };


    beforeEach(function () {
        nock('https://auth.sphere.io').post('/oauth/token')
            .reply(200, {
                access_token: '70kNDuiU_UstkLgWro3UYlhLbpXO5ywU',
                token_type: 'Bearer',
                expires_in: 172800,
                scope: 'manage_project:elasticio'
            });
    });


    describe('successful adding price', function () {
        var msg;
        var self;

        beforeEach(function () {
            msg = {
                body: {
                    productId: 'f499d66d-5bb7-48b0-b2ee-891317abfd69',
                    variantId: 2,
                    amount: 100,
                    currency: 'UAH'
                }
            };

            self = jasmine.createSpyObj('self', ['emit']);

            nock('https://api.sphere.io')
                .get('/test_project/products/f499d66d-5bb7-48b0-b2ee-891317abfd69')
                .reply(200, masterProduct.results[0])
                .post('/test_project/products/f499d66d-5bb7-48b0-b2ee-891317abfd69')
                .reply(200, {
                    version: 13
                });

            runs(function () {
                addPrice.process.call(self, msg, cfg);
            });

            waitsFor(function () {
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
            expect(data.version).toEqual(13);
        });

        it('should emit end message', function () {
            var args = self.emit.calls[1].args;
            expect(args[0]).toEqual('end');
        });
    });

    describe('concurring version error', function () {
        var msg;
        var self;

        beforeEach(function () {
            msg = {
                body: {
                    productId: 'f499d66d-5bb7-48b0-b2ee-891317abfd69',
                    variantId: 2,
                    amount: 100,
                    currency: 'UAH'
                }
            };

            self = jasmine.createSpyObj('self', ['emit']);

            nock('https://api.sphere.io')
                .get('/test_project/products/f499d66d-5bb7-48b0-b2ee-891317abfd69')
                .reply(200, masterProduct.results[0])
                .post('/test_project/products/f499d66d-5bb7-48b0-b2ee-891317abfd69')
                .reply(409, {
                    message: 'Version mismatch. Concurrent modification.',
                    statusCode: 409
                });

            runs(function () {
                addPrice.process.call(self, msg, cfg);
            });

            waitsFor(function () {
                return self.emit.calls.length;
            });
        });

        it('should call emit only 2 times', function () {
            expect(self.emit.calls.length).toEqual(2);
        });

        it('should emit rebound message', function () {
            var event = self.emit.calls[0].args[0];
            var data = self.emit.calls[0].args[1];
            expect(event).toEqual('rebound');
            expect(data).toEqual('Mismatched version for adding price to variant 2 to product f499d66d-5bb7-48b0-b2ee-891317abfd69');
        });

        it('should emit end message', function () {
            var args = self.emit.calls[1].args;
            expect(args[0]).toEqual('end');
        });
    });

    describe('Price in scope exists should execute changePrice', function () {
        var msg;
        var self;

        beforeEach(function () {
            msg = {
                body: {
                    productId: 'f499d66d-5bb7-48b0-b2ee-891317abfd69',
                    variantId: 2,
                    amount: 100,
                    currency: 'EUR'
                }
            };

            self = jasmine.createSpyObj('self', ['emit']);

            nock('https://api.sphere.io')
                .get('/test_project/products/f499d66d-5bb7-48b0-b2ee-891317abfd69')
                .reply(200, masterProduct.results[0])
                .post('/test_project/products/f499d66d-5bb7-48b0-b2ee-891317abfd69', {
                    'version': 12,
                    'actions': [{
                        'action': 'changePrice',
                        'variantId': 2,
                        'price': {
                            'value': {
                                'currencyCode': 'EUR',
                                'centAmount': 10000
                            }
                        }
                    }]
                })
                .reply(200, {
                    version: 13
                });

            runs(function () {
                addPrice.process.call(self, msg, cfg);
            });

            waitsFor(function () {
                return self.emit.calls.length;
            });
        });

        it('and call emit only 2 times', function () {
            expect(self.emit.calls.length).toEqual(2);
        });

        it('and emit proper data message', function () {
            var event = self.emit.calls[0].args[0];
            var data = self.emit.calls[0].args[1].body;
            expect(event).toEqual('data');
            expect(data.version).toEqual(13);
        });

        it('and emit end message', function () {
            var args = self.emit.calls[1].args;
            expect(args[0]).toEqual('end');
        });

    });
    describe('Price in scope exists in masterVariant should execute changePrice', function () {
        var msg;
        var self;

        beforeEach(function () {
            msg = {
                body: {
                    productId: 'f499d66d-5bb7-48b0-b2ee-891317abfd69',
                    variantId: 1,
                    amount: 100,
                    currency: 'EUR'
                }
            };

            self = jasmine.createSpyObj('self', ['emit']);

            nock('https://api.sphere.io')
                .get('/test_project/products/f499d66d-5bb7-48b0-b2ee-891317abfd69')
                .reply(200, masterProduct.results[0])
                .post('/test_project/products/f499d66d-5bb7-48b0-b2ee-891317abfd69', {
                    'version': 12,
                    'actions': [{
                        'action': 'changePrice',
                        'variantId': 1,
                        'price': {
                            'value': {
                                'currencyCode': 'EUR',
                                'centAmount': 10000
                            }
                        }
                    }]
                })
                .reply(200, {
                    version: 13
                });

            runs(function () {
                addPrice.process.call(self, msg, cfg);
            });

            waitsFor(function () {
                return self.emit.calls.length;
            });
        });

        it('and call emit only 2 times', function () {
            expect(self.emit.calls.length).toEqual(2);
        });

        it('and emit proper data message', function () {
            var event = self.emit.calls[0].args[0];
            var data = self.emit.calls[0].args[1].body;
            expect(event).toEqual('data');
            expect(data.version).toEqual(13);
        });

        it('and emit end message', function () {
            var args = self.emit.calls[1].args;
            expect(args[0]).toEqual('end');
        });

    });
    describe('general error', function () {
        var msg;
        var self;

        beforeEach(function () {
            msg = {
                body: {
                    productId: 'f499d66d-5bb7-48b0-b2ee-891317abfd69',
                    variantId: 2,
                    amount: 100,
                    currency: 'UAH'
                }
            };

            self = jasmine.createSpyObj('self', ['emit']);

            nock('https://api.sphere.io')
                .get('/test_project/products/f499d66d-5bb7-48b0-b2ee-891317abfd69')
                .reply(200, masterProduct.results[0])
                .post('/test_project/products/f499d66d-5bb7-48b0-b2ee-891317abfd69')
                .reply(400, {
                    message: 'Hey, lucky!',
                    statusCode: 400
                });

            runs(function () {
                addPrice.process.call(self, msg, cfg);
            });

            waitsFor(function () {
                return self.emit.calls.length;
            });
        });

        it('should call emit only 2 times', function () {
            expect(self.emit.calls.length).toEqual(2);
        });

        it('should emit error message', function () {
            var event = self.emit.calls[0].args[0];
            var data = self.emit.calls[0].args[1].body;
            expect(event).toEqual('error');
        });

        it('should emit end message', function () {
            var args = self.emit.calls[1].args;
            expect(args[0]).toEqual('end');
        });
    });

});