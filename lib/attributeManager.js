var sphere = require('./sphere.js');
var _ = require('underscore');

/**
 * Get product type parameters from sphereio
 * (we're interested in attrubutes)
 */
function promiseProductTypeData(cfg){
    var client = sphere.createClient('productTypes', cfg);
    return client.byId(cfg.productType).fetch();
}

/**
 * Add attribute definitions to JSON schema
 */
exports.addOptionalAttributes = function(schema, cfg, cb){
    promiseProductTypeData(cfg).then(function(productTypeData){
        if (productTypeData && productTypeData.body.attributes) {
            describeAttributes(schema.in.properties.masterVariant, productTypeData.body.attributes);
            describeAttributes(schema.in.properties.variants, productTypeData.body.attributes);
        }
        cb(schema);
    });
};

/**
 * Read product from a message
 */
exports.readProduct = function (msg, cfg, cb){

    var product = {};
    product.name = msg.body.name;
    product.productType = {
        typeId: 'product-type',
        id: cfg.productType
    };
    product.slug = msg.body.slug;
    product.description = msg.body.description;
    product.categories = msg.body.categories;

    product.metaTitle = msg.body.metaTitle;
    product.metaDescription = msg.body.metaDescription;
    product.metaKeywords = msg.body.metaKeywords;
    product.masterVariant = msg.body.masterVariant;

    promiseProductTypeData(cfg).then(function(productTypeData){
        product.masterVariant.attributes = readAttributes(product.masterVariant, productTypeData);
        cleanupValues(product);
        formatCentAmounts(product);
        cb(null, product);
    });
};

/**
 * Build attributes json
 */
function describeAttributes(variant, attributes) {
    var result = {
        "type": "object",
        "required": false,
        "properties": {}
    };
    for (var i = 0; i < attributes.length; i++) {
        result.properties[attributes[i].name] = describeAttribute(attributes[i]);
        result.properties[attributes[i].name].title = variant.title + ' ' + result.properties[attributes[i].name].title;
    }
    variant.properties.attributes = result;
}

/**
 * Build 1 attribute json
 */
function describeAttribute(attribute) {
    var result = {
        title: _.values(attribute.label)[0],
        required: attribute.isRequired
    };
    switch (attribute.type.name) {
        case "text":
        case "enum":
        case "date":
        case "time":
        case "datetime":
            result.type = "string";
            break;
        case "ltext":
            result.type = "lstring";
            break;
        case "number":
            result.type = "number";
            break;
        case "money":
            result.type = "object";
            result.properties = {
                currencyCode: {
                    "type":"string",
                    "title": result.title + " (currency)",
                    "required": result.required
                },
                centAmount: {
                    "type":"number",
                    "title": result.title + " (amount)",
                    "required": result.required
                }
            };
            break;
        default:
            result.type = "string";
    }

    return result;
}

/**
 * Build master variant of a product
 */
function readAttributes(masterVariant, productTypeData){
    var results = [];
    _.each(productTypeData.body.attributes, function(attribute){
        var value = readAttribute(attribute, masterVariant.attributes);
        if (value !== undefined) {
            results.push({name: attribute.name, value: value});
        }
    });
    return results;
}

/**
 * Read attribute
 */
function readAttribute(attribute, attributes) {
    var attr = attribute.name;
    var type = attribute.type.name;
    var value;

    // if attribute is not in body - return
    if (attributes && attributes[attr]) {
        switch (type) {
            case "text":
            case "enum":
            case "date":
            case "time":
            case "datetime":
                value = attributes[attr];
                break;
            case "ltext":
                value = attributes[attr];
                break;
            case "number":
                // parse float
                value = parseFloat(attributes[attr]);
                break;
            case "money":
                value = {"currencyCode": attributes[attr]['currencyCode'], "centAmount": parseFloat(attributes[attr]['centAmount'])};
                break;
        }
    }

    return value;
}

/**
 * Remove empty values from body
 * like {param: ''} or {param: {v1: '', v2: ''}}
 */
function cleanupValues(body){
    _.each(_.keys(body), function(key) {
        var value  = body[key];
        var hasValue = false;
        if (_.isObject(value)) {
            _.each(_.values(value), function(value) {
                if (value && value != '') hasValue = true;
            });
        } else {
            if (value && value != '') hasValue = true;
        }
        if (!hasValue) {
            delete body[key];
        }
    });
};

/**
 * Remove empty values from body
 * like {param: ''} or {param: {v1: '', v2: ''}}
 */
function formatCentAmounts(object){
    _.each(_.keys(object), function(key) {
        if (_.isObject(object[key])) {
            formatCentAmounts(object[key]);
        } else {
            if (key === 'centAmount') {
                object[key] = parseFloat(object[key]);
            }
        }
    });
};