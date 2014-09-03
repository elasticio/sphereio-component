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

    connection.project.fetch().then(readSchema).fail(callback).done();

    function readSchema(data) {
        languages = data.body.languages;
        fs.readFile(__dirname + '/../schemas/product.json', constructMetaData);
    }

    function constructMetaData(err, schema) {
        sphere.getProductTypeAttributes(connection, cfg.productType, function (err, productTypeAttributes){
            if (err) return callback(err);
            
            schema = JSON.parse(schema.toString());
            attributeManager.addAttributes(schema, productTypeAttributes);
            var input = helper.convertLStrings(schema.in, languages);
            var output = helper.convertLStrings(schema.out, languages);
            callback(null, {in: input, out: output});
        });
    }
}

function process(msg, cfg) {
    var self = this;

    var connection = sphere.createConnection(cfg);

    sphere.getProductTypeAttributes(connection, cfg.productType, function (err, productTypeAttributes){

        if (err) {
            self.emit('error', err);
            self.emit('end');
            return;
        }

        var product = attributeManager.readProduct(cfg, msg, productTypeAttributes);
        connection.products.save(product).then(handleResult).fail(hanldeError).done(end);

        function handleResult(data) {
            self.emit('data', messages.newMessageWithBody(data.body));
        }

        function hanldeError(err) {
            self.emit('error', err);
        }

        function end() {
            self.emit('end');
        }
    });
}

function getProductTypeSelectModel(cfg, callback) {
    sphere.createClient('productTypes', cfg).fetch().then(handleResult).fail(callback).done();

    function handleResult(data) {
        var productTypes = data.body.results;
        var result = {};
        productTypes.forEach(function(productType) {
            result[productType.id] = productType.name;
        });
        callback(null, result);
    }
}
