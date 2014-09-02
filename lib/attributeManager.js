var sphere = require('./sphere.js');
var _ = require('underscore');

/**
 * Get product type parameters from sphereio
 * (we're interested in attrubutes)
 */
function getProductTypeAttributes(cfg){
    var client = sphere.createClient('productTypes', cfg);
    return client.byId(cfg.productType).fetch().then(function getAttributes(data) {
        if (data && data.body.attributes) {
            return data.body.attributes;
        } else {
            return [];
        }
    });
}

/**
 * Add attribute definitions to JSON schema
 */
function addAttributes(schema, cfg, cb){
    getProductTypeAttributes(cfg).then(function(productTypeAttributes){
        var masterVariant = schema.in.properties.masterVariant;
        var variants = schema.in.properties.variants;
        masterVariant.properties.attributes = describeAttributes(masterVariant.title, productTypeAttributes);
        variants.properties.attributes = describeAttributes(variants.title, productTypeAttributes);
        cb(schema);
    });
}

/**
 * Read product from a message
 */
function readProduct(msg, cfg, cb){
    getProductTypeAttributes(cfg).then(function(productTypeAttributes){
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

        if (msg.body.masterVariant) {
            product.masterVariant = msg.body.masterVariant;
            product.masterVariant.attributes = readAttributes(product.masterVariant.attributes, productTypeAttributes);
        }

        if (msg.body.variants) {
            product.variants = msg.body.variants;
            for (var i = 0; i< product.variants.length; i++) {
                product.variants[i].attributes = readAttributes(product.variants[i].attributes, productTypeAttributes);
            }
        }

        cleanupValues(product);
        formatCentAmounts(product);
        cb(null, product);
    });
}

/**
 * Build attributes json
 */
function describeAttributes(prefix, productTypeAttributes) {
    var result = {
        "type": "object",
        "required": false,
        "properties": {}
    };
    for (var i = 0; i < productTypeAttributes.length; i++) {
        result.properties[productTypeAttributes[i].name] = describeAttribute(productTypeAttributes[i]);
        result.properties[productTypeAttributes[i].name].title = prefix + ' ' + result.properties[productTypeAttributes[i].name].title;
    }
    return result;
}

/**
 * Build 1 attribute json
 */
function describeAttribute(productTypeAttribute) {
    var result = {
        title: _.values(productTypeAttribute.label)[0],
        required: productTypeAttribute.isRequired
    };
    switch (productTypeAttribute.type.name) {
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
function readAttributes(data, productTypeAttributes){
    var results = [];
    _.each(productTypeAttributes, function(productTypeAttribute){
        var value = readAttribute(productTypeAttribute, data);
        if (value !== undefined) {
            results.push({name: productTypeAttribute.name, value: value});
        }
    });
    return results;
}

/**
 * Read attribute
 */
function readAttribute(productTypeAttribute, data) {
    var attr = productTypeAttribute.name;
    var type = productTypeAttribute.type.name;
    var value;

    // if attribute is not in body - return
    if (data && data[attr]) {
        switch (type) {
            case "text":
            case "enum":
            case "date":
            case "time":
            case "datetime":
                value = data[attr];
                break;
            case "ltext":
                value = data[attr];
                break;
            case "number":
                // parse float
                value = parseFloat(data[attr]);
                break;
            case "money":
                value = {"currencyCode": data[attr]['currencyCode'], "centAmount": parseFloat(data[attr]['centAmount'])};
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
}

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
}

exports.addAttributes = addAttributes;
exports.readProduct = readProduct;

exports.describeAttributes = describeAttributes;
exports.describeAttribute = describeAttribute;
exports.cleanupValues = cleanupValues;
exports.readAttributes = readAttributes;
exports.readAttribute = readAttribute;

