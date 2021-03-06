var sphere = require('./sphere.js');
var sphere2elastic = require('./sphere2elastic.js');
var _ = require('underscore');

/**
 * Add attribute definitions to JSON schema
 */
function addAttributes(schema, productTypeAttributes) {
    if (!productTypeAttributes) return;
    if (!productTypeAttributes.length) return;

    var masterVariant = schema.in.properties.masterVariant;
    var variants = schema.in.properties.variants || schema.in;

    if (masterVariant) {
        masterVariant.properties.attributes = describeAttributes(productTypeAttributes, masterVariant.title);
    }
    variants.properties.attributes = describeAttributes(productTypeAttributes, variants.title);
}

/**
 * Read product from a message
 */
function readProduct(cfg, msg, productTypeAttributes) {
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
        if (product.masterVariant.attributes) {
            product.masterVariant.attributes = readAttributes(product.masterVariant.attributes, productTypeAttributes);
        }
    }

    if (msg.body.variants) {
        product.variants = msg.body.variants;
        for (var i = 0; i < product.variants.length; i++) {
            if (product.variants[i].attributes) {
                product.variants[i].attributes = readAttributes(product.variants[i].attributes, productTypeAttributes);
            }
        }
    }

    cleanupValues(product);
    formatCentAmounts(product);
    return product;
}

function readVariantActionAttributes (variantAction, productTypeAttributes) {

    if (variantAction.attributes) {
        variantAction.attributes = readAttributes(variantAction.attributes, productTypeAttributes);
    }
}

/**
 * Remove empty values from body
 * like {param: ''} or {param: {v1: '', v2: ''}}
 */
function cleanupValues(body) {
    _.each(_.keys(body), function(key) {
        var value = body[key];
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
 * Each "centAmount" property should be parsed to float
 */
function formatCentAmounts(object) {
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

function describeAttributes(productTypeAttributes, prefix) {
    var result = {
        'type': 'object',
        'required': false,
        'properties': {}
    };
    _.each(productTypeAttributes, function(productTypeAttribute) {
        var attr = sphere2elastic.describeAttribute(productTypeAttribute);
        if (attr !== undefined) {
            attr.title = prefix + ' ' + attr.title;
            result.properties[productTypeAttribute.name] = attr;
        }
    });

    return result;
}

function readAttributes(data, productTypeAttributes) {
    var results = [];
    if (data && productTypeAttributes) {
        _.each(productTypeAttributes, function(productTypeAttribute) {
            var value = sphere2elastic.readAttribute(productTypeAttribute, data);
            if (value !== undefined) {
                results.push({
                    name: productTypeAttribute.name,
                    value: value
                });
            }
        });
    }
    return results;
}

exports.readVariantActionAttributes = readVariantActionAttributes;
exports.addAttributes = addAttributes;
exports.readProduct = readProduct;
exports.cleanupValues = cleanupValues;

exports.describeAttributes = describeAttributes;
exports.readAttributes = readAttributes;