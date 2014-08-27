describe('Sphereio create product', function () {
    var createProduct = require('../../lib/actions/createProduct.js');
    var nock = require('nock');
    var fs = require('fs');

    var cfg = {
        client: 'c7bsQTE5gopuIh-hEcBm4k26',
        clientSecret: '-mMPrPnv_vSNQr4v4YASnX716ggQ_D_z',
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

    describe('request product meta data', function() {
        var callback = jasmine.createSpy('callback');

        var expectedMetaData = JSON.parse(fs.readFileSync(__dirname + '/expectedProductMetaData.json').toString());

        beforeEach(function() {
            var scope = nock('https://api.sphere.io');
            scope.get('/elasticio').reply(200, { key: 'elasticio',
                     name: 'elastic.io Demo Project',
                     countries: [ 'AS', 'DE', 'DZ', 'US' ],
                     currencies: [ 'EUR' ],
                     languages: [ 'en' ],
                     createdAt: '1970-01-01T00:00:00.000Z',
                     trialUntil: '2014-01' });

            runs(function() {
                createProduct.getMetaModel(cfg, callback);
            });

            waitsFor(function() {
                return callback.calls.length;
            }, "Timed out", 1000);

        });

        it('should call callback with metadata', function() {
            expect(callback).toHaveBeenCalledWith(null, expectedMetaData);
        });
    });

    describe('post product to service', function() {
        var callback = jasmine.createSpy('callback');
        var product = {
            slug: { en: 'brain'},
            name: { en: 'brain'},
            metaTitle: { en: 'human brain'},
            metaDescription: { en: 'delicious forzombies'},
            description: { en: 'delicious forzombies'},
            productType: '5dfdc7a9-76a7-4e02-8c4e-6b5b9bd58ef8'
        };
        var msg = {
            body: product
        };
        var self;

        beforeEach(function() {
            self = jasmine.createSpyObj('self', ['emit']);
            nock('https://api.sphere.io').post('/elasticio/products')
                .reply(201, { id: 'c5d24489-22e6-4c86-a441-f6733be10ac1',
                              version: 1});

            runs(function() {
                createProduct.process.call(self, msg, cfg, callback);
            });

            waitsFor(function() {
                return self.emit.calls.length;
            }, "Timed out", 1000);
        });

        it('should call callback with right params', function() {
            var data = self.emit.calls[0].args[1].body;
            expect(data).toEqual({ version: 1, id: 'c5d24489-22e6-4c86-a441-f6733be10ac1'});
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
        var product = { };
        var msg = {
            body: product
        };
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
            }, "Timed out", 1000);
        });

        it('should emit an error', function() {
            expect(self.emit).toHaveBeenCalledWith('error', { message : 'Request body does not contain valid JSON.', originalRequest : { endpoint : '/products', payload : { productType : { typeId : 'product-type', id : undefined } } } });
        });

        it('should emit end event', function() {
            expect(self.emit).toHaveBeenCalledWith('end');
        });

        it('should not emit more then two events', function() {
            expect(self.emit.calls.length).toEqual(2);
        });
    });

});