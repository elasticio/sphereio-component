var _ = require('underscore');
var Q = require('q');
var request = require('request');

/**
 * Get product type parameters from sphereio
 * (we're interested in attrubutes)
 */
exports.promiseProductTypeData = function(cfg){
    var productTypeRequest = {
        uri: "https://api-v0.sphere.io/" + cfg.project + '/product-types/' + cfg.productType,
        headers: {
            "Authorization": "Bearer " + cfg.oauth.access_token
        }
    };
    var deferred = Q.defer();
    request.get(productTypeRequest, function(error, response, body) {
        if (error) {
            deferred.reject();
        }
        body = JSON.parse(body);
        deferred.resolve(body);
    });
    return deferred.promise;
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
                value = {"currencyCode": messageBody[attr]['currencyCode'], "centAmount": parseFloat(messageBody[attr]['centAmount']) * 100};
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
exports.getMasterVariant = function(msg, cfg, cb){
    // get product type attribute definitions
    exports.promiseProductTypeData(cfg).then(function(productTypeData){
        // read product type attributes from message, and put to masterVariant
        var masterVariant = {
            attributes: exports.readAttributesFromMessage(productTypeData.attributes, msg)
        };
        cb(null, masterVariant);
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