var moment = require("moment");
var sphere = require('./sphere');
var _ = require('underscore');

exports.getProductTypeSelectModel = function getProductTypeSelectModel(cfg, callback) {

    sphere.createServiceClient('productTypes', cfg).fetch()
        .then(handleResult)
        .fail(callback)
        .done();

    function handleResult(data) {
        var productTypes = data.body.results;
        var result = {};
        productTypes.forEach(function(productType) {
            result[productType.id] = productType.name;
        });
        callback(null, result);
    }
};

exports.updateSnapshotWithLastModified = function updateSnapshotWithLastModified(results, snapshot) {
    results.forEach(function (result) {
        updateSnapshot(result, snapshot);
    });
};

function updateSnapshot(data, snapshot) {
    var lastModifiedAt = data.lastModifiedAt;
    var maxLastModifiedAt = snapshot.lastModifiedAt || "1970-01-01T00:00:00.000Z";

    if (moment(lastModifiedAt).isAfter(maxLastModifiedAt)) {
        snapshot.lastModifiedAt = lastModifiedAt;
    }
}

function convertLStrings(nodes, languages) {
    for (var property in nodes.properties) {
        var node = nodes.properties[property];
        if (node.type === 'lstring') {
            node = extendLString(node, languages);
        }
        if (node.type === 'object' || node.type === 'array') {
            node = convertLStrings(node, languages);
        }
        nodes.properties[property] = node;
    }
    return nodes;
}


function extendLString(node, languages) {
    var result = {};
    result.type = 'object';
    result.properties = {};
    for (var i = languages.length - 1; i >= 0; i--) {
        result.properties[languages[i]] = {
            title: node.title + ' (' + languages[i] + ')',
            type: 'string',
            required: node.required
        };
    }
    return result;
}

// check if value is a number and not NaN
function isValidNumber(value){
    return typeof(value) === 'number' && !isNaN(value);
}

// check that value is a string with . or a number
function isValidAmountValue(value){
    if (typeof(value) === 'string' && value.match(/^-?\d*\.?\d+$/)) return true;
    if (typeof(value) === 'number' && !isNaN(value)) return true;
    return false;
}

// check that value is an integer string or an integer number
function isValidCentAmountValue(value){
    if (typeof(value) === 'string' && value.match(/^\d+$/)) return true;
    if (typeof(value) === 'number' && !isNaN(value) && value % 1 === 0) return true;
    return false;
}

// convert amount to centAmount
function amountToCentAmount(amount){
    if (isValidAmountValue(amount)) {
        var result = parseFloat(amount, 10) * 100;
        if (isValidNumber(result)) {
            return result;
        }
    }

    throw new Error('"' + amount + '" is not valid amount value');
}

// convert centAmount to amount
function centAmountToAmount(centAmount){
    if (isValidCentAmountValue(centAmount)) {
        var result = parseInt(centAmount) / 100;
        if (isValidNumber(result)) {
            return result;
        }
    }

    throw new Error('"' + centAmount + '" is not valid centAmount value');
}

// convert all 'centAmount' to 'amount'
function centAmountsToAmounts(object) {
    _.each(object, function(value, key) {
        if (key == 'centAmount') {
            object.amount = centAmountToAmount(object.centAmount);
            delete object.centAmount;
        }
        if (_.isObject(value)) {
            centAmountsToAmounts(value);
        }
    });
    return object;
}

// convert all 'amount' to 'centAmount'
function amountsToCentAmounts(object) {
    _.each(object, function(value, key) {
        if (key == 'amount') {
            object.centAmount = amountToCentAmount(object.amount);
            delete object.amount;
        }
        if (_.isObject(value)) {
            amountsToCentAmounts(value);
        }
    });
    return object;
}

exports.convertLStrings = convertLStrings;

exports.amountToCentAmount = amountToCentAmount;
exports.centAmountToAmount = centAmountToAmount;

exports.centAmountsToAmounts = centAmountsToAmounts;
exports.amountsToCentAmounts = amountsToCentAmounts;