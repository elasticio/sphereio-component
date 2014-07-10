var attributeManager = require('../../extensions/helpers/attributeManager');
var _ = require('underscore');
var nock = require('nock');

describe('promiseProductTypeData', function () {

    var cfg = {
        project: "aSphereioProject",
        productType: 'productTypeId',
        oauth: {
            access_token: "aToken"
        }
    };

    it('When valid productTypeData is returned', function(){

        var productTypeData = {
            param1: 'value1',
            param2: 'value2'
        };

        nock('https://api-v0.sphere.io').get('/aSphereioProject/product-types/productTypeId').reply(200, productTypeData);

        var result, error;

        runs(function () {
            attributeManager.promiseProductTypeData(cfg).then(function (data) {
                result = data;
            }).fail(function (err) {
                error = err;
            }).done();
        });

        waitsFor(function () {
            return result;
        });

        runs(function () {
            expect(result).toBeDefined();
            expect(result).toEqual(productTypeData);
            expect(error).not.toBeDefined();
        });
    });

    it('When statusCode <> 200 it should return an error', function(){

        nock('https://api-v0.sphere.io').get('/aSphereioProject/product-types/productTypeId').reply(404, 'Product type not found');

        var result, error;

        runs(function () {
            attributeManager.promiseProductTypeData(cfg).then(function (data) {
                result = data;
            }).fail(function (err) {
                error = err;
            }).done();
        });

        waitsFor(function () {
            return result || error;
        });

        runs(function () {
            expect(result).not.toBeDefined();
            expect(error).toBeDefined();
            expect(error.message).toEqual('Product type not found');
        });
    });

    it('When invalid JSON it should return an error', function(){

        nock('https://api-v0.sphere.io').get('/aSphereioProject/product-types/productTypeId').reply(200, 'invalid-json');

        var result, error;

        runs(function () {
            attributeManager.promiseProductTypeData(cfg).then(function (data) {
                result = data;
            }).fail(function (err) {
                error = err;
            }).done();
        });

        waitsFor(function () {
            return result || error;
        });

        runs(function () {
            expect(result).not.toBeDefined();
            expect(error).toBeDefined();
            expect(error.message).toEqual('Invalid JSON: invalid-json');
        });
    });

});

describe('buildAttributeField', function () {

    it('Should format text attribute', function(){

        var attribute = {
            "type": {
                "name": "text"
            },
            "name": "attr1",
            "label": {
                "en": "Attr1 Label"
            },
            "isRequired": true
        };

        var expected = {
            "type": "string",
            "title": "Attr1 Label",
            "required": true
        };

        var result = attributeManager.buildAttributeMeta(attribute);
        expect(result).toEqual(expected);
    });

    it('Should format number attribute', function(){

        var attribute = {
            "type": {
                "name": "number"
            },
            "name": "attr2",
            "label": {
                "en": "Attr2 Label"
            },
            "isRequired": true
        };

        var expected = {
            "type": "number",
            "title": "Attr2 Label",
            "required": true
        };

        var result = attributeManager.buildAttributeMeta(attribute);
        expect(result).toEqual(expected);
    });

    it('Should format money attribute', function(){

        var attribute = {
            "type": {
                "name": "money"
            },
            "name": "attr3",
            "label": {
                "en": "Attr3 Label"
            },
            "isRequired": true
        };

        var expected = {
            title: 'Attr3 Label',
            required : true,
            type : 'object',
            properties : {
                currencyCode : {
                    type : 'string',
                    title : 'Attr3 Label (currency)',
                    required : true },
                centAmount : {
                    type : 'number',
                    title : 'Attr3 Label (amount)',
                    required : true
                }
            }
        };

        var result = attributeManager.buildAttributeMeta(attribute);
        expect(result).toEqual(expected);
    });

    it('Should format ltext attribute', function(){

        var attribute = {
            "type": {
                "name": "ltext"
            },
            "name": "attr4",
            "label": {
                "en": "Attr4 Label"
            },
            "isRequired": true
        };

        var expected = {
            "type": "lstring",
            "title": "Attr4 Label",
            "required": true
        };

        var result = attributeManager.buildAttributeMeta(attribute);
        expect(result).toEqual(expected);
    });
});


describe('cleanupValues', function () {

    it('Should remove empty values', function(){

        var input = {
            name: { en: 'NAMENAME-en', de: 'NAMENAME-de'},
            productType: { typeId: 'product-type', id: '7710c3cd-8ab9-4c7e-95e9-80d89f3cce20'},
            slug: { en: 'SLUG-en', de: 'SLUG-de'},
            description: { en: '', de: ''}, // will be cleaned up
            title: { en: 'TITLE-en', de: 'TITLE-de'}
        };

        var expected = {
            name: { en: 'NAMENAME-en', de: 'NAMENAME-de'},
            productType: { typeId: 'product-type', id: '7710c3cd-8ab9-4c7e-95e9-80d89f3cce20'},
            slug: { en: 'SLUG-en', de: 'SLUG-de'},
            title: { en: 'TITLE-en', de: 'TITLE-de'}
        };

        attributeManager.cleanupValues(input);
        expect(input).toEqual(expected);
    });

    it('Should leave non-empty values', function(){

        var input = {
            name: { en: 'NAMENAME-en', de: 'NAMENAME-de'},
            productType: { typeId: 'product-type', id: '7710c3cd-8ab9-4c7e-95e9-80d89f3cce20'},
            slug: { en: 'SLUG-en', de: 'SLUG-de'},
            description: { en: '', de: ''}, // will be cleaned up
            title: 'sometitle',
            title2: '' // will be cleaned up
        };

        var expected = {
            name: { en: 'NAMENAME-en', de: 'NAMENAME-de'},
            productType: { typeId: 'product-type', id: '7710c3cd-8ab9-4c7e-95e9-80d89f3cce20'},
            slug: { en: 'SLUG-en', de: 'SLUG-de'},
            title: 'sometitle'
        };

        attributeManager.cleanupValues(input);
        expect(input).toEqual(expected);
    });

});


describe('addAttributes', function () {

    var metadata = require(__dirname + '/json/metadata.json');
    var attributes = require(__dirname + '/json/attributes.json');
    var metadata_with_attributes = require(__dirname + '/json/metadata_with_attributes.json');

    it('Should add attributes', function(){
        attributeManager.addAttributes(metadata, attributes);
        expect(metadata).toEqual(metadata_with_attributes);
    });

    it('Should not fail when metadata is undefined', function(){
        expect(function(){
            attributeManager.addAttributes(undefined, attributes);
        }).not.toThrow();
    });

    it('Should not fail when metadata.in is undefined', function(){
        expect(function(){
            attributeManager.addAttributes({}, attributes);
        }).not.toThrow();
    });

    it('Should not fail when metadata.in.properties are undefined', function(){
        var metadata = {in: {someParameter: 'someParameterValue'}};
        attributeManager.addAttributes(metadata, attributes);
        expect(metadata.in.properties).toBeDefined();
        expect(_.keys(metadata.in.properties).length).toEqual(attributes.length);
    });
});


describe('readAttributeFromMessage', function () {

    it('Should read attributes properly', function(){

        var message = {
            body: {
                attribute1: 'value1',
                attribute2: {'en': 'value2'},
                attribute3: 'value3',
                attribute4: '12',
                attribute5: {"currencyCode": 'USD', "centAmount": 12},
                attribute7: 'value7'
            }
        };

        var attr1 = {"name": "attribute1", "type": {"name": "text"}};
        var value1 = attributeManager.readAttributeFromMessage(attr1, message.body);
        expect(value1).toEqual('value1');

        var attr2 = {"name": "attribute2", "type": {"name": "ltext"}};
        var value2 = attributeManager.readAttributeFromMessage(attr2, message.body);
        expect(value2).toEqual({'en': 'value2'});

        var attr3 = {"name": "attribute3", "type": {"name": "enum"}};
        var value3 = attributeManager.readAttributeFromMessage(attr3, message.body);
        expect(value3).toEqual('value3');

        var attr4 = {"name": "attribute4", "type": {"name": "number"}};
        var value4 = attributeManager.readAttributeFromMessage(attr4, message.body);
        expect(value4).toEqual(12);

        var attr5 = {"name": "attribute5", "type": {"name": "money"}};
        var value5 = attributeManager.readAttributeFromMessage(attr5, message.body);
        expect(value5).toEqual({"currencyCode": 'USD', "centAmount": 1200});

        var attr6 = {"name": "attribute6", "type": {"name": "money"}};
        var value6 = attributeManager.readAttributeFromMessage(attr6, message.body);
        expect(value6).toEqual(undefined);

        var attr7 = {"name": "attribute7", "type": {"name": "unknownType"}};
        var value7 = attributeManager.readAttributeFromMessage(attr7, message.body);
        expect(value7).toEqual(undefined);
    });
});

describe('readAttributesFromMessage', function () {

    var message = {
        body: {
            attribute1: 'value1',
            attribute2: {'en': 'value2'},
            attribute3: 'value3',
            attribute4: '12',
            attribute5: {"currencyCode": 'USD', "centAmount": 12},
            attribute7: 'value7'
        }
    };

    var attributes = [
        {"name": "attribute1", "type": {"name": "text"}},
        {"name": "attribute2", "type": {"name": "ltext"}},
        {"name": "attribute3", "type": {"name": "enum"}},
        {"name": "attribute4", "type": {"name": "number"}},
        {"name": "attribute5", "type": {"name": "money"}},
        {"name": "attribute6", "type": {"name": "money"}},
        {"name": "attribute7", "type": {"name": "unknownType"}}
    ];

    var expected = [
        {name: 'attribute1',value: 'value1'},
        {name: 'attribute2',value: {en: 'value2'}},
        {name: 'attribute3',value: 'value3'},
        {name: 'attribute4',value: 12},
        {name: 'attribute5',value: {currencyCode: 'USD',centAmount: 1200}}
    ];

    it('Should read attributes properly', function(){
        var result = attributeManager.readAttributesFromMessage(attributes, message);
        expect(result).toEqual(expected);
    });

    it('Should return empty array if message is undefined', function(){
        var result = attributeManager.readAttributesFromMessage(attributes, undefined);
        expect(result).toEqual([]);
    });

    it('Should return empty array if message body is empty', function(){
        var result = attributeManager.readAttributesFromMessage(attributes, {});
        expect(result).toEqual([]);
    });
});


