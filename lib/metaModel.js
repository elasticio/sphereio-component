var sphere = require('./sphere.js');
var fs = require('fs');
var helper = require('./helpers.js');
var attributeManager = require('./attributeManager.js');
var path = require('path');

exports.getMetaModel = getMetaModel;

function getMetaModel(cfg, schemaPath, callback) {
    var client = sphere.createClient(cfg);
    var languages;

    client.project.fetch()
        .then(getLanguages)
        .then(getProductTypeAttributes)
        .then(constructMetaData)
        .fail(hanldeError)
        .done();

    function getLanguages(data) {
        languages = data.body.languages;
    }

    function getProductTypeAttributes() {
        return sphere.getProductTypeAttributes(client, cfg.productType);
    }

    function constructMetaData(productTypeAttributes) {
        fs.readFile(path.resolve(__dirname, 'schemas', schemaPath), function(err, schema) {
            if (err) return hanldeError(err);
            schema = JSON.parse(schema.toString());
            attributeManager.addAttributes(schema, productTypeAttributes);
            var input = helper.convertLStrings(schema.in, languages);
            var output = helper.convertLStrings(schema.out, languages);
            handleResult({in: input, out: output});
        });
    }

    function handleResult(data) {
        console.log(JSON.stringify(data));
        callback(null, data);
    }

    function hanldeError(err) {
        callback(err);
    }
}
