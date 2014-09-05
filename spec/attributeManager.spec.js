var attributeManager = require('../lib/attributeManager');

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

describe('readAttributes', function () {

    var data = {
        attribute1: 'value1',
        attribute2: {'en': 'value2'},
        attribute3: 'value3',
        attribute4: '12',
        attribute5: {'currencyCode': 'USD', 'centAmount': 12},
        attribute7: 'value7'
    };

    var productTypeAttributes = [
        {'name': 'attribute1', 'type': {'name': 'text'}},
        {'name': 'attribute2', 'type': {'name': 'ltext'}},
        {'name': 'attribute3', 'type': {'name': 'enum'}},
        {'name': 'attribute4', 'type': {'name': 'number'}},
        {'name': 'attribute5', 'type': {'name': 'money'}},
        {'name': 'attribute6', 'type': {'name': 'money'}},
        {'name': 'attribute7', 'type': {'name': 'unknownType'}}
    ];

    var expected = [
        {name: 'attribute1',value: 'value1'},
        {name: 'attribute2',value: {en: 'value2'}},
        {name: 'attribute3',value: 'value3'},
        {name: 'attribute4',value: 12},
        {name: 'attribute5',value: {currencyCode: 'USD',centAmount: 12}}
    ];

    it('Should read attributes properly', function(){
        var result = attributeManager.readAttributes(data, productTypeAttributes);
        expect(result).toEqual(expected);
    });

    it('Should return undefined if message is null', function(){
        var result = attributeManager.readAttributes(null, {});
        expect(result).toEqual(undefined);
    });

    it('Should return undefined if message is undefined', function(){
        var result = attributeManager.readAttributes(undefined, {});
        expect(result).toEqual(undefined);
    });

    it('Should return undefined if productTypeAttributes are undefined', function(){
        var result = attributeManager.readAttributes(data, undefined);
        expect(result).toEqual(undefined);
    });


});

describe('describeAttributes', function () {

    var attributes = [
        {
            'type': {
                'name': 'text'
            },
            'name': 'attr1',
            'label': {
                'en': 'Attr1 Label'
            },
            'isRequired': true,
            'inputHint': 'SingleLine',
            'displayGroup': 'Other',
            'isSearchable': true,
            'attributeConstraint': 'None'
        },
        {
            'type': {
                'name': 'number'
            },
            'name': 'attr2',
            'label': {
                'en': 'Attr2 Label 1',
                'au': 'Attr2 Label 2'
            },
            'isRequired': false,
            'inputHint': 'SingleLine',
            'displayGroup': 'Other',
            'isSearchable': true,
            'attributeConstraint': 'None'
        },
        {
            'type': {
                'name': 'ltext'
            },
            'name': 'attr3',
            'label': {
                'en': 'Attr3 Label 1',
                'au': 'Attr3 Label 2'
            },
            'isRequired': true,
            'inputHint': 'SingleLine',
            'displayGroup': 'Other',
            'isSearchable': true,
            'attributeConstraint': 'None'
        }
    ];

    var description = {
        type : 'object',
        required : false,
        properties : {
            attr1 : {
                title : 'Master Variant Attr1 Label',
                required : true,
                type : 'string'
            },
            attr2 : {
                title : 'Master Variant Attr2 Label 1',
                required : false,
                type : 'number'
            },
            attr3 : {
                title : 'Master Variant Attr3 Label 1',
                required : true,
                type : 'lstring'
            }
        }
    };

    it('Should describe attributes', function(){
        var result = attributeManager.describeAttributes(attributes, 'Master Variant');
        expect(result).toEqual(description);
    });
});

describe('readProduct', function () {

    it('Should read product in correct way', function(){

        var msg = {
            body: {
                name: {
                    en: 'Product Name'
                },
                slug:  {
                    en: 'Product Slug'
                },
                description: {
                    en: 'Product Description'
                },
                categories: '',
                metaTitle: {
                    en: 'Product metaTitle'
                },
                metaDescription: {
                    en: 'Product metaDescription'
                },
                metaKeywords: {
                    en: 'Product metaKeywords'
                },
                masterVariant: {
                    sku: 'master-variant-sku',
                    prices: [{
                        value: {
                            'currencyCode': 'EUR',
                            'centAmount': '1200'
                        }
                    }],
                    attributes: {
                        attribute1: 'Lorem Ipsum',
                        attribute2: '500',
                        attribute3: {
                            en: 'English',
                            de: 'Deutsch'
                        }
                    }
                },
                variants: [{
                    sku: 'variant-sku',
                    prices: [{
                        value: {
                            'currencyCode': 'EUR',
                            'centAmount': '8000'
                        }
                    }],
                    attributes: {
                        attribute1: 'Lorem Ipsum',
                        attribute2: '700'
                    }
                }]
            }
        };

        var expectedProduct = {
            "name": {
                "en": "Product Name"
            },
            "productType": {
                "typeId": "product-type",
                "id": "product-type-id"
            },
            "slug": {
                "en": "Product Slug"
            },
            "description": {
                "en": "Product Description"
            },
            "metaTitle": {
                "en": "Product metaTitle"
            },
            "metaDescription": {
                "en": "Product metaDescription"
            },
            "metaKeywords": {
                "en": "Product metaKeywords"
            },
            "masterVariant": {
                "sku": "master-variant-sku",
                "prices": [
                    {
                        "value": {
                            "currencyCode": "EUR",
                            "centAmount": 1200
                        }
                    }
                ],
                "attributes": [
                    {
                        "name": "attribute1",
                        "value": "Lorem Ipsum"
                    },
                    {
                        "name": "attribute2",
                        "value": 500
                    },
                    {
                        "name": "attribute3",
                        "value": {
                            "en": "English",
                            "de": "Deutsch"
                        }
                    }
                ]
            },
            "variants": [
                {
                    "sku": "variant-sku",
                    "prices": [
                        {
                            "value": {
                                "currencyCode": "EUR",
                                "centAmount": 8000
                            }
                        }
                    ],
                    "attributes": [
                        {
                            "name": "attribute1",
                            "value": "Lorem Ipsum"
                        },
                        {
                            "name": "attribute2",
                            "value": 700
                        }
                    ]
                }
            ]
        };

        var cfg = {
            productType: 'product-type-id'
        };

        var attributeDescriptions = [
            {'name': 'attribute1', 'type': {'name': 'text'}},
            {'name': 'attribute2', 'type': {'name': 'number'}},
            {'name': 'attribute3', 'type': {'name': 'ltext'}}
        ];

        var result = attributeManager.readProduct(cfg, msg, attributeDescriptions);
        expect(result).toEqual(expectedProduct);
    });

    it('Should throw an error if readProduct failed', function(){

        var msg = {};
        var cfg = {};
        var attributeDescriptions = [];

        expect(function(){
            attributeManager.readProduct(cfg, msg, attributeDescriptions);
        }).toThrow();
    });
});