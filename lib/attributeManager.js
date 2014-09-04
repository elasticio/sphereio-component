var sphere = require('./sphere.js');
var mapper = require('./sphere2elastic.js');
var _ = require('underscore');

/**
 * Add attribute definitions to JSON schema
 */
function addAttributes(schema, productTypeAttributes){
    var masterVariant = schema.in.properties.masterVariant;
    var variants = schema.in.properties.variants;
    masterVariant.properties.attributes = mapper.describeAttributes(productTypeAttributes, masterVariant.title);
    variants.properties.attributes = mapper.describeAttributes(productTypeAttributes, variants.title);
}

/**
 * Read product from a message
 */
function readProduct(cfg, msg, productTypeAttributes){
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
        product.masterVariant.attributes = mapper.readAttributes(product.masterVariant.attributes, productTypeAttributes);
    }

    if (msg.body.variants) {
        product.variants = msg.body.variants;
        for (var i = 0; i< product.variants.length; i++) {
            product.variants[i].attributes = mapper.readAttributes(product.variants[i].attributes, productTypeAttributes);
        }
    }

    cleanupValues(product);
    formatCentAmounts(product);
    return product;
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
exports.cleanupValues = cleanupValues;

