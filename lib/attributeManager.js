var sphere = require('./sphere.js');
var _ = require('underscore');

/**
 * Get product type parameters from sphereio
 * (we're interested in attrubutes)
 */
exports.promiseProductTypeData = function(cfg){
    var client = sphere.createClient('productTypes', cfg);
    return client.byId(cfg.productType).fetch();
};

exports.addProductTypeData = function(schema, cfg, cb){
    exports.promiseProductTypeData(cfg).then(function(productTypeData){
        if (productTypeData && productTypeData.body.attributes) {
            exports.addAttributes(schema, productTypeData.body.attributes);
        }
        cb(schema);
    });
};

exports.buildProduct = function (msg, cfg, cb){

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

    exports.getMasterVariantAttributes(msg, cfg, function(err, attributes){
        if (err) {
            return cb(err);
        }
        product.masterVariant.attributes = attributes;
        exports.cleanupValues(product);
        exports.formatCentAmounts(product);
        cb(null, product);
    });
};


/**
 * Build attribute json for metadata
 */
exports.buildAttributeMeta = function (attribute) {
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
};

/**
 * Add attributes json to metadata
 */
exports.addAttributes = function (metadata, attributes) {
    if (metadata === undefined || metadata.in === undefined) return;
    if (metadata.in.properties === undefined) metadata.in.properties = [];
    for (var i = 0; i < attributes.length; i++) {
        metadata.in.properties[attributes[i].name] = exports.buildAttributeMeta(attributes[i]);
    }
    return metadata;
};

/**
 * Read product type attribute from message
 */
exports.readAttributeFromMessage = function (attribute, messageBody) {
    var attr = attribute.name;
    var type = attribute.type.name;
    var value;

    // if attribute is not in body - return
    if (messageBody && messageBody[attr]) {
        switch (type) {
            case "text":
            case "enum":
            case "date":
            case "time":
            case "datetime":
                value = messageBody[attr];
                break;
            case "ltext":
                value = messageBody[attr];
                break;
            case "number":
                // parse float
                value = parseFloat(messageBody[attr]);
                break;
            case "money":
                value = {"currencyCode": messageBody[attr]['currencyCode'], "centAmount": parseFloat(messageBody[attr]['centAmount'])};
                break;
        }
    }

    return value;
};

/**
 * Read product type attributes from message
 */
exports.readAttributesFromMessage = function (attributes, msg) {
    var results = [];

    if (msg && msg.body) {
        _.each(attributes, function(attribute){
            var value = exports.readAttributeFromMessage(attribute, msg.body);
            if (value !== undefined) {
                results.push({name: attribute.name, value: value});
            }
        });
    }

    return results;
};

/**
 * Build master variant of a product
 */
exports.getMasterVariantAttributes = function(msg, cfg, cb){
    // get product type attribute definitions
    exports.promiseProductTypeData(cfg).then(function(productTypeData){
        // read product type attributes from message, and put to masterVariant
        var attributes = exports.readAttributesFromMessage(productTypeData.body.attributes, msg);
        cb(null, attributes);
    }).fail(function(err){
        cb(err);
    }).done();
};

/**
 * Remove empty values from body
 * like {param: ''} or {param: {v1: '', v2: ''}}
 */
exports.cleanupValues = function(body){
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
exports.formatCentAmounts = function formatCentAmounts(object){
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