var sphere = require('../sphere.js');
var messages = require('../messages.js');
var fs = require('fs');
var helper = require('../helpers.js');

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
        var input = helper.convertLStrings(schema.in, languages);
        var output = helper.convertLStrings(schema.out, languages);
        callback(null, {in: input, out: output});
    }
}

function process(msg, cfg, next) {
    var self = this;

    var client = sphere.createClient("products", cfg);
    msg.body.productType = {
        typeId: 'product-type',
        id :msg.body.productType
    };
    client.save(msg.body).then(handleResult).fail(hanldeError).done(end);

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
