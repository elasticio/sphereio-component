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

    var callback = jasmine.createSpy('callback');

    var expectedMetaData = JSON.parse(fs.readFileSync(__dirname + '/actions/expectedProductMetaData.json').toString());

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

        runs(function() {
            metaModel.getMetaModel(cfg, 'product.json', callback);
        });

        waitsFor(function() {
            return callback.calls.length;
        }, 'Timed out', 1000);

    });

    it('should call callback with metadata', function() {
        expect(callback).toHaveBeenCalledWith(null, expectedMetaData);
    });
});