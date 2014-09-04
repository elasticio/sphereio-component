describe('getProductTypeAttributes', function () {

    var callback = jasmine.createSpy('callback');
    var nock = require('nock');
    var sphere = require('../lib/sphere.js');

    var cfg = {
        client: '1',
        clientSecret: '2',
        project: 'test_project',
        productType: '3'
    };

    beforeEach(function() {

        nock('https://auth.sphere.io')
            .filteringRequestBody(/.*/, '*')
            .post('/oauth/token', '*')
            .times(4)
            .reply(200, {
                'access_token': 'i0NC8wC8Z49uwBJKTS6MkFQN9_HhsSSA',
                'token_type': 'Bearer',
                'expires_in': 172800,
                'scope': 'manage_project:test_project'
            });
    });

    it('should call callback with formated product types', function() {

        nock('https://api.sphere.io')
            .get('/test_project/product-types/3')
            .reply(200, {attributes: { attr1 : 'value1', attr2 : 'value2' }});

        runs(function() {
            var connection = sphere.createConnection(cfg);
            sphere.getProductTypeAttributes(connection, cfg.productType).then(callback);
        });

        waitsFor(function() {
            return callback.calls.length;
        }, 'Timed out', 1000);

        runs(function() {
            expect(callback).toHaveBeenCalledWith({ attr1 : 'value1', attr2 : 'value2' });
        });
    });
});