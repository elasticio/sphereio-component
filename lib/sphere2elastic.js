var _ = require('underscore');

var READERS = {
    'text': _readAttribute,
    'enum': _readAttribute,
    'date': _readAttribute,
    'time': _readAttribute,
    'datetime': _readAttribute,
    'ltext': _readAttribute,
    'number': _readNumberAttribute,
    'money': _readMoneyAttribute
};

var DESCRIBERS = {
    'text': _describeAttribute('string'),
    'enum': _describeAttribute('string'),
    'date': _describeAttribute('string'),
    'time': _describeAttribute('string'),
    'datetime': _describeAttribute('string'),
    'ltext': _describeAttribute('lstring'),
    'number': _describeAttribute('number'),
    'money': _describeMoneyAttribute
};

function _readAttribute(attr, data){
    return data[attr];
}

function _readNumberAttribute(attr, data){
    return parseFloat(data[attr]);
}

function _readMoneyAttribute(attr, data){
    return data[attr] && {'currencyCode': data[attr]['currencyCode'], 'centAmount': parseFloat(data[attr]['centAmount'])};
}

function _describeAttribute(type) {
    return function(attr) {
        return {
            title: _.values(attr.label)[0],
            required: attr.isRequired,
            type: type
        };
    };
}

function _describeMoneyAttribute(attr) {
    var title = _.values(attr.label)[0];
    var isRequired = attr.isRequired;
    return {
        title: title,
        required: isRequired,
        type: 'object',
        properties: {
            currencyCode: {
                'type': 'string',
                'title': title + ' (currency)',
                'required': isRequired
            },
            centAmount: {
                'type': 'number',
                'title': title + ' (amount)',
                'required': isRequired
            }
        }
    };
}

function describeAttribute(productTypeAttribute) {
    if (DESCRIBERS[productTypeAttribute.type.name]) {
        return DESCRIBERS[productTypeAttribute.type.name](productTypeAttribute);
    }
}

function readAttribute(productTypeAttribute, data) {
    if (READERS[productTypeAttribute.type.name]) {
        return READERS[productTypeAttribute.type.name](productTypeAttribute.name, data);
    }
}

exports.describeAttribute = describeAttribute;
exports.readAttribute = readAttribute;