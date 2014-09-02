var sphere = require('../sphere.js');
var messages = require('../messages.js');
var fs = require('fs');
var attributeManager = require('../attributeManager.js');

exports.getMetaModel = getMetaModel;
exports.process = process;
exports.getProductTypeSelectModel = getProductTypeSelectModel;

function getMetaModel(cfg, callback) {
    var client = sphere.createClient('project', cfg);
    var languages;
    
    client.fetch().then(readSchema).fail(callback).done();

    function readSchema(data) {
        languages = data.body.languages;
        fs.readFile(__dirname + '/../schemas/product.json', constructMetaData);
    }

    function constructMetaData(err, schema) {
        schema = JSON.parse(schema.toString());

        attributeManager.addProductTypeData(schema, cfg, function(){
            var input = convertNode(schema.in);
            var output = convertNode(schema.out);
            callback(null, {in: input, out: output});
        });
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

    console.log(JSON.stringify(msg));
    console.log(JSON.stringify(cfg));

    attributeManager.buildProduct(msg, cfg, function(err, product) {
        if (err) {
            return hanldeError(err);
        }

        console.log(JSON.stringify(product));

        var client = sphere.createClient("products", cfg);

        client.save(product).then(handleResult).fail(hanldeError).done(end);

        function handleResult(data) {
            self.emit('data', messages.newMessageWithBody(data.body));
        }

        function hanldeError(err) {
            console.log(JSON.stringify(msg.body));
            console.log(err);
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
