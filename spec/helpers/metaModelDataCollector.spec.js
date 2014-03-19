var metaModelDataCollector = require('../../extensions/helpers/metaModelDataCollector');
var nock = require('nock');

describe('Data Collector', function () {

    describe('getData', function () {
        it('should promise only metadata out(if no in metadata is found) and languages metadata', function () {
            var options = {
                cfg: {
                    client: "someClient",
                    clientSecret: "verySecretStuff",
                    project: "aSphereioProject",
                    oauth: {
                        access_token: "aToken"
                    }
                },
                modelName: 'product',
                resourceName: 'products'
            };

            nock('https://api-v0.sphere.io').get('/aSphereioProject').reply(200, {
                "trialUntil": "2014-04",
                "createdAt": "2014-01-31T23:11:21.104Z",
                "languages": [
                    "de",
                    "en"
                ],
                "currencies": [
                    "EUR"
                ],
                "countries": [
                    "AT",
                    "DE"
                ],
                "name": "aSphereioProject",
                "key": "aSphereioProjectKey"
            });

            var meta;
            var langsMeta;

            runs(function () {
                promise = metaModelDataCollector.getData(options).spread(function (metadata, languagesMeta) {
                    meta = metadata;
                    langsMeta = languagesMeta;
                }).done();
            });

            waitsFor(function () {
                return meta;
            })

            runs(function () {

                expect(meta.out).toBeDefined();
                expect(meta.in).toBeUndefined();
                expect(langsMeta).toEqual({
                    "en": {
                        type: "string"
                    },
                    "de": {
                        type: "string"
                    }
                });

            });
        });

        it('should promise only in metadata and languages metadata if no out data is found', function () {
            var options = {
                cfg: {
                    client: "someClient",
                    clientSecret: "verySecretStuff",
                    project: "aSphereioProject",
                    oauth: {
                        access_token: "aToken"
                    }
                },
                modelName: 'products',//wrong name so no out data should be loaded
                resourceName: 'products',
                availableMetadata: {
                    "in": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "title": "name",
                                "type": "string",
                                "required": "true"
                            }
                        }
                    }
                }
            };

            nock('https://api-v0.sphere.io').get('/aSphereioProject').reply(200, {
                "trialUntil": "2014-04",
                "createdAt": "2014-01-31T23:11:21.104Z",
                "languages": [
                    "de",
                    "en"
                ],
                "currencies": [
                    "EUR"
                ],
                "countries": [
                    "AT",
                    "DE"
                ],
                "name": "aSphereioProject",
                "key": "aSphereioProjectKey"
            });

            var meta;
            var langsMeta;

            runs(function () {
                promise = metaModelDataCollector.getData(options).spread(function (metadata, languagesMeta) {
                    meta = metadata;
                    langsMeta = languagesMeta;
                }).done();
            });

            waitsFor(function () {
                return meta;
            })

            runs(function () {

                expect(meta.out).toBeUndefined();
                expect(meta.in).toBeDefined();
                expect(langsMeta).toEqual({
                    "en": {
                        type: "string"
                    },
                    "de": {
                        type: "string"
                    }
                });

            });
        });

        it('should promise both in and out metadata and languagesMeta', function () {
            var options = {
                cfg: {
                    client: "someClient",
                    clientSecret: "verySecretStuff",
                    project: "aSphereioProject",
                    oauth: {
                        access_token: "aToken"
                    }
                },
                modelName: 'product',
                resourceName: 'products',
                availableMetadata: {
                    "in": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "title": "name",
                                "type": "string",
                                "required": "true"
                            }
                        }
                    }
                }
            };

            nock('https://api-v0.sphere.io').get('/aSphereioProject').reply(200, {
                "trialUntil": "2014-04",
                "createdAt": "2014-01-31T23:11:21.104Z",
                "languages": [
                    "de",
                    "en"
                ],
                "currencies": [
                    "EUR"
                ],
                "countries": [
                    "AT",
                    "DE"
                ],
                "name": "aSphereioProject",
                "key": "aSphereioProjectKey"
            });

            var meta;
            var langsMeta;

            runs(function () {
                promise = metaModelDataCollector.getData(options).spread(function (metadata, languagesMeta) {
                    meta = metadata;
                    langsMeta = languagesMeta;
                }).done();
            });

            waitsFor(function () {
                return meta;
            })

            runs(function () {

                expect(meta.out).toBeDefined();
                expect(meta.in).toBeDefined();
                expect(langsMeta).toEqual({
                    "en": {
                        type: "string"
                    },
                    "de": {
                        type: "string"
                    }
                });

            });
        });
    });

    describe('findModel', function () {
        it('should return a model with the specified id', function () {
            var resource = {
                "models": {
                    "Product": {
                        "id": "Product"
                    },
                    "NotProduct": {
                        "id": "NotProduct"
                    }
                }
            };

            var modelName = 'product';

            var model = metaModelDataCollector.findModel(resource, modelName);

            expect(model).toEqual(resource.models.Product);
        });

        it('should return null if no model is found', function () {
            var resource = {
                "models": {
                    "AProduct": {
                        "id": "AProduct"
                    },
                    "NotProduct": {
                        "id": "NotProduct"
                    }
                }
            };

            var modelName = 'product';

            var model = metaModelDataCollector.findModel(resource, modelName);

            expect(model).toEqual(undefined);

        });

    });

    describe('createLanguagesMeta', function () {
        it('should create a metadata object from languages array', function () {
            var languagesArray = ["en", "de"];

            var expected = {
                "en": {
                    type: "string"
                },
                "de": {
                    type: "string"
                }
            };

            var result = metaModelDataCollector.createLanguagesMetaData(languagesArray);

            expect(result).toEqual(expected);
        });

        it('should return empty object if array is empty', function () {
            var languagesArray = [];

            var expected = {};

            var result = metaModelDataCollector.createLanguagesMetaData(languagesArray);

            expect(result).toEqual(expected);
        });
    });

})
;