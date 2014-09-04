var sphere = require('../sphere.js');
var messages = require('../messages.js');
var fs = require('fs');
var helper = require('../helpers.js');
var attributeManager = require('../attributeManager.js');

exports.getMetaModel = getMetaModel;
exports.process = process;
exports.getProductTypeSelectModel = getProductTypeSelectModel;


function getMetaModel(cfg, callback) {
    var connection = sphere.createConnection(cfg);
    var languages;

    connection.project.fetch()
        .then(getLanguages)
        .then(getProductTypeAttributes)
        .then(constructMetaData)
        .fail(hanldeError)
        .done();

    function getLanguages(data) {
        languages = data.body.languages;
    }

    function getProductTypeAttributes() {
        return sphere.getProductTypeAttributes(connection, cfg.productType);
    }

    function constructMetaData(productTypeAttributes) {
        fs.readFile(__dirname + '/../schemas/product.json', function(err, schema) {
            if (err) return hanldeError(err);
            schema = JSON.parse(schema.toString());
            attributeManager.addAttributes(schema, productTypeAttributes);
            var input = helper.convertLStrings(schema.in, languages);
            var output = helper.convertLStrings(schema.out, languages);
            handleResult({in: input, out: output});
        });
    }

    function handleResult(data) {
        callback(null, data);
    }

    function hanldeError(err) {
        callback(err);
    }
}

function process(msg, cfg) {
    var self = this;

    var connection = sphere.createConnection(cfg);

    sphere.getProductTypeAttributes(connection, cfg.productType)
        .then(saveProduct)
        .then(handleResult)
        .fail(hanldeError)
        .done(end);

    function saveProduct(productTypeAttributes){
        var product = attributeManager.readProduct(cfg, msg, productTypeAttributes);
        return connection.products.save(product);
    }

    function handleResult(data) {
        self.emit('data', messages.newMessageWithBody(data.body));
    }

    function hanldeError(err) {
        self.emit('error', err);
    }

    function end() {
        self.emit('end');
    }
}

function getProductTypeSelectModel(cfg, callback) {

    sphere.createClient('productTypes', cfg).fetch()
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
}
