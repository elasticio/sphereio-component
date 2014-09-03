var sphere = require('../sphere.js');
var messages = require('../messages.js');
var fs = require('fs');
var attributeManager = require('../attributeManager.js');

exports.getMetaModel = getMetaModel;
exports.process = process;
exports.getProductTypeSelectModel = getProductTypeSelectModel;

function getMetaModel(cfg, callback) {
    var client = sphere.createClient(cfg);
    var languages;
    
    client.project.fetch().then(readSchema).fail(callback).done();

    function readSchema(data) {
        languages = data.body.languages;
        fs.readFile(__dirname + '/../schemas/product.json', constructMetaData);
    }

    function constructMetaData(err, schema) {
        schema = JSON.parse(schema.toString());

        sphere.getProductTypeAttributes(client, cfg.productType).then(function(productTypeAttributes){
            attributeManager.addAttributes(schema, productTypeAttributes);
            var input = convertNode(schema.in);
            var output = convertNode(schema.out);
            callback(null, {in: input, out: output});
        }).fail(function(err) {
            callback(err);
        }).done();
    }

    function convertNode(nodes) {
        for (var property in nodes.properties) {
            var node = nodes.properties[property];
            if (node.type === 'lstring') {
                node = extendLString(node);
            }
            if (node.type === 'object') {
                node = convertNode(node);
            }
            nodes.properties[property] = node;
        }
        return nodes;
    }


    function extendLString(node) {
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
}

function process(msg, cfg) {
    var self = this;

    var client = sphere.createClient(cfg);

    sphere.getProductTypeAttributes(client, cfg.productType)
        .then(saveProduct)
        .fail(hanldeError)
        .done(end);

    function saveProduct(productTypeAttributes){

        var product = attributeManager.readProduct(cfg, msg, productTypeAttributes);
        return client.products.save(product).then(handleResult);
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
    var client = sphere.createClient(cfg);
    client.productTypes.fetch().then(handleResult).fail(callback).done();

    function handleResult(data) {
        var productTypes = data.body.results;
        var result = {};
        productTypes.forEach(function(productType) {
            result[productType.id] = productType.name;
        });
        callback(null, result);
    }
}
