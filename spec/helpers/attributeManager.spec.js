var attributeManager = require('../../extensions/helpers/attributeManager');

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