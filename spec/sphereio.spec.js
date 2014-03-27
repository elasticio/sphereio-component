var sphereio = require('../extensions/sphereio');
var nock = require('nock');
var url = require('url');
var metaModelDataCollector = require('../extensions/helpers/metaModelDataCollector');
var metaModelDataProcessor = require('../extensions/helpers/metaModelDataProcessor');

var Q = require('q');

describe('SphereIO helpers', function () {
    xdescribe('attachTokenTo', function () {

        var interceptor;
        var cfg;

        it('should callback with an error if one occured', function () {
            interceptor = nock('https://auth-v0.sphere.io')
                .post("/oauth/token", "grant_type=client_credentials&scope=manage_project%3AaSphereioProject");

            cfg = {
                client: "someClient",
                clientSecret: "verySecretStuff",
                project: "aSphereioProject"
            };
            interceptor.reply(400, "ok");

            sphereio.attachTokenTo(cfg, function (err) {
                expect(err).toBeDefined();
                expect(cfg.ouath).toBeUndefined();
            });
        });

        it('should attach a token to cfg object', function () {
            interceptor = nock('https://auth-v0.sphere.io')
                .post("/oauth/token", "grant_type=client_credentials&scope=manage_project%3AaSphereioProject");

            cfg = {
                client: "someClient",
                clientSecret: "verySecretStuff",
                project: "aSphereioProject"
            };

            interceptor.reply(200, {
                "access_token": "aToken"
            });


            var error;
            runs(function () {
                sphereio.attachTokenTo(cfg, function () {
                });
            });

            waitsFor(function () {
                return cfg.oauth;
            });

            runs(function () {
                expect(cfg.oauth).toBeDefined();
            });
        });

    });

    describe('getMetaModel', function () {

        it('should callback with the processed metaModel', function () {

            var options = {
                cfg: {
                    client: "someClient",
                    clientSecret: "verySecretStuff",
                    project: "aSphereioProject"
                },
                resourceName: 'products',
                modelName: 'product'
            };

            spyOn(sphereio, 'attachTokenTo').andCallFake(function (err, callback) {
                console.log(arguments);

                callback();
            });

            spyOn(metaModelDataCollector, 'getData').andCallFake(function (result) {

                console.log(arguments);
                return Q.fcall(function () {
                    return [
                        {
                            "out": {
                                "type:": "object",
                                properties: {
                                    "name": {
                                        type: "string"
                                    }
                                }
                            }
                        },
                        {
                            "en": {
                                type: "string"
                            }
                        }
                    ];
                });
            });

            spyOn(metaModelDataProcessor, 'processData').andCallFake(function (metadata, languageMeta) {
                return Q.fcall(function () {
                    return metadata;
                });
            });

            sphereio.getMetaModel(options, function (err, result) {
                expect(result).toEqual(result);
            });
        });

        it('should handle callback with an error if it occurs somewhere in the promise chain', function () {
            var options = {
                cfg: {
                    client: "someClient",
                    clientSecret: "verySecretStuff",
                    project: "aSphereioProject"
                },
                resourceName: 'products',
                modelName: 'product'
            };

            spyOn(sphereio, 'attachTokenTo').andCallFake(function (err, callback) {
                console.log(arguments);

                callback();
            });

            spyOn(metaModelDataCollector, 'getData').andCallFake(function (result) {
                Q.fcall(function () {
                    throw error;
                });
            });

            spyOn(metaModelDataProcessor, 'processData').andCallFake(function (metadata, languageMeta) {
                return Q.fcall(function () {
                    return metadata;
                });
            });

            var error;
            runs(function () {
                sphereio.getMetaModel(options, function (err, result) {
                    error = err;
                });
            });

            waitsFor(function () {
                return error;
            });

            runs(function () {
                expect(error).toBeDefined();
            });
        });
    });

});