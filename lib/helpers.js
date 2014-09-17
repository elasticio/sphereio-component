var moment = require("moment");

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

exports.convertLStrings = convertLStrings;