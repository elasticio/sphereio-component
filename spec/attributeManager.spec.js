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