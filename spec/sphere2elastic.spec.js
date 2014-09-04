var sphere2elastic = require('../lib/sphere2elastic');

describe('describeAttribute', function () {

    it('Should format text attribute', function(){

        var attribute = {
            'type': {
                'name': 'text'
            },
            'name': 'attr1',
            'label': {
                'en': 'Attr1 Label'
            },
            'isRequired': true
        };

        var result = sphere2elastic.describeAttribute(attribute);

        expect(result).toEqual({
            'type': 'string',
            'title': 'Attr1 Label',
            'required': true
        });
    });

    it('Should format number attribute', function(){

        var attribute = {
            'type': {
                'name': 'number'
            },
            'name': 'attr2',
            'label': {
                'en': 'Attr2 Label'
            },
            'isRequired': true
        };

        var result = sphere2elastic.describeAttribute(attribute);

        expect(result).toEqual({
            'type': 'number',
            'title': 'Attr2 Label',
            'required': true
        });
    });

    it('Should format money attribute', function(){

        var attribute = {
            'type': {
                'name': 'money'
            },
            'name': 'attr3',
            'label': {
                'en': 'Attr3 Label'
            },
            'isRequired': true
        };

        var result = sphere2elastic.describeAttribute(attribute);
        
        expect(result).toEqual({
            title: 'Attr3 Label',
            required : true,
            type : 'object',
            properties : {
                currencyCode : {
                    type : 'string',
                    title : 'Attr3 Label (currency)',
                    required : true
                },
                centAmount : {
                    type : 'number',
                    title : 'Attr3 Label (amount)',
                    required : true
                }
            }
        });
    });

    it('Should format ltext attribute', function(){

        var attribute = {
            'type': {
                'name': 'ltext'
            },
            'name': 'attr4',
            'label': {
                'en': 'Attr4 Label'
            },
            'isRequired': true
        };

        var result = sphere2elastic.describeAttribute(attribute);
        
        expect(result).toEqual({
            'type': 'lstring',
            'title': 'Attr4 Label',
            'required': true
        });
    });
});

describe('readAttribute', function () {

    it('Should read attributes properly', function(){

        var data = {
            attribute1: 'value1',
            attribute2: {'en': 'value2'},
            attribute3: 'value3',
            attribute4: '12',
            attribute5: {'currencyCode': 'USD', 'centAmount': 12},
            attribute7: 'value7'
        };

        var attr1 = {'name': 'attribute1', 'type': {'name': 'text'}};
        var value1 = sphere2elastic.readAttribute(attr1, data);
        expect(value1).toEqual('value1');

        var attr2 = {'name': 'attribute2', 'type': {'name': 'ltext'}};
        var value2 = sphere2elastic.readAttribute(attr2, data);
        expect(value2).toEqual({'en': 'value2'});

        var attr3 = {'name': 'attribute3', 'type': {'name': 'enum'}};
        var value3 = sphere2elastic.readAttribute(attr3, data);
        expect(value3).toEqual('value3');

        var attr4 = {'name': 'attribute4', 'type': {'name': 'number'}};
        var value4 = sphere2elastic.readAttribute(attr4, data);
        expect(value4).toEqual(12);

        var attr5 = {'name': 'attribute5', 'type': {'name': 'money'}};
        var value5 = sphere2elastic.readAttribute(attr5, data);
        expect(value5).toEqual({'currencyCode': 'USD', 'centAmount': 12});

        var attr6 = {'name': 'attribute6', 'type': {'name': 'money'}};
        var value6 = sphere2elastic.readAttribute(attr6, data);
        expect(value6).toEqual(undefined);

        var attr7 = {'name': 'attribute7', 'type': {'name': 'unknownType'}};
        var value7 = sphere2elastic.readAttribute(attr7, data);
        expect(value7).toEqual(undefined);
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
        var result = sphere2elastic.readAttributes(data, productTypeAttributes);
        expect(result).toEqual(expected);
    });

    it('Should return empty array if message is undefined', function(){
        var result = sphere2elastic.readAttributes(data, undefined);
        expect(result).toEqual([]);
    });

    it('Should return empty array if message body is empty', function(){
        var result = sphere2elastic.readAttributes(data, {});
        expect(result).toEqual([]);
    });
});

describe('addAttributes', function () {

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
        var result = sphere2elastic.describeAttributes(attributes, 'Master Variant');
        expect(result).toEqual(description);
    });
});

