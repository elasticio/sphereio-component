describe('MetaModel#getMetaModel', function() {

    var cfg = {
        client: '1',
        clientSecret: '2',
        project: 'elasticio',
        productType: '3'
    };
    var nock = require('nock');
    var fs = require('fs');
    var metaModel = require('../lib/metaModel');



    beforeEach(function() {

        nock('https://auth.sphere.io').post('/oauth/token')
            .reply(200, {
                'access_token': '73',
                'token_type': 'Bearer',
                'expires_in': 172800,
                'scope': 'manage_project:elasticio'
            });

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

        var scope = nock('https://api.sphere.io');
        scope.get('/elasticio').reply(200, {
            key: 'elasticio',
            name: 'elastic.io Demo Project',
            countries: ['AS', 'DE', 'DZ', 'US'],
            currencies: ['EUR'],
            languages: ['en'],
            createdAt: '1970-01-01T00:00:00.000Z',
            trialUntil: '2014-01'
        });



    });

    it('should call callback with metadata for product', function() {
        var expectedMetaData = JSON.parse(fs.readFileSync(__dirname + '/actions/expectedProductMetaData.json').toString());
        var callback = jasmine.createSpy('callback');

        runs(function() {
            metaModel.getMetaModel(cfg, 'createProduct.json', callback);
        });

        waitsFor(function() {
            return callback.calls.length;
        }, 'Timed out', 1000);

        runs(function() {
            expect(callback).toHaveBeenCalledWith(null, expectedMetaData);
        });
    });

    it('should call callback with metadata for variant', function() {

        var callback = jasmine.createSpy('callback');

        runs(function() {
            metaModel.getMetaModel(cfg, 'addVariant.json', callback);
        });

        waitsFor(function() {
            return callback.calls.length;
        }, 'Timed out', 1000);

        var expectedMetadata = { in : {
                type: 'object',
                title: 'Variant',
                properties: {
                    masterVariantSku: {
                        type: 'string',
                        title: 'Master Variant SKU',
                        required: true
                    },
                    sku: {
                        type: 'string',
                        title: 'Sku',
                        required: true
                    },
                    attributes: {
                        type: 'object',
                        required: false,
                        properties: {
                            attribute1: {
                                title: 'Variant Attribute 1',
                                required: true,
                                type: 'string'
                            },
                            attribute2: {
                                title: 'Variant Attribute 2',
                                required: false,
                                type: 'string'
                            }
                        }
                    }
                }
            },
            out: {}
        };

        runs(function() {
            expect(callback).toHaveBeenCalledWith(null, expectedMetadata);
        });

    });

});