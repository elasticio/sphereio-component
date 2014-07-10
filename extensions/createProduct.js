var sphereio = require('./sphereio');
var attributeManager = require('./helpers/attributeManager.js');
var _ = require('underscore');

exports.preProcess = function (msg, cfg, snapshot, cb) {

    // build masterVariant and put it to the message
    attributeManager.getMasterVariant(msg, cfg, function(err, masterVariant){
        if (err) {
            return cb(err);
        }
        msg.masterVariant = masterVariant;
        cb();
    })
};

exports.preRequest = function (options, cfg, msg) {

    var body = JSON.parse(options.body);

    body.productType = {
        typeId: "product-type",
        id: body.productType
    };

    body.masterVariant = msg.masterVariant;
    attributeManager.cleanupValues(body);

    options.body = JSON.stringify(body);
    options.json = body;
};

exports.getMetaModel = function (cfg, callback, availableMetadata) {

    sphereio.getMetaModel({
        cfg: cfg,
        availableMetadata: availableMetadata,
        resourceName: 'products',
        modelName: 'product'
    }, callback);
};