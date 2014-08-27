var sphere = require('../sphere.js');
var messages = require('../messages.js');
var request = require('request').defaults({json: true});
var fs = require('fs');

exports.getMetaModel = getMetaModel;
exports.process = process;

function getMetaModel(cfg, callback) {
    var client = sphere.createClient("project", cfg);
    var languages;
    
    client.fetch().then(readSchema).fail(callback);

    function readSchema(data) {
        languages = data.body.languages;
        fs.readFile(__dirname + '/../schemas/product.json', constructMetaData);
    }

    function constructMetaData(err, schema) {
        schema = JSON.parse(schema.toString());
        for (var property in schema.properties) {
            var node = schema.properties[property];
            if (node.type !== 'lstring') {
                continue;
            }

            schema.properties[property] = extendLString(node);
        }
        callback(null, {in: schema});
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
function process(msg, cfg, next) {
    var self = this;

    var client = sphere.createClient("products", cfg);
    msg.body.productType = {
        typeId: 'product-type',
        id :msg.body.productType
    };
    client.save(msg.body).then(handleResult).fail(hanldeError);

    function handleResult(data) {
        self.emit('data', messages.newMessageWithBody(data.body));
        self.emit('end');
    }

    function hanldeError(err) {
        self.emit('error', err);
        self.emit('end');
    }
}