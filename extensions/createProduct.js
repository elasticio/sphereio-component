var sphereio = require('./sphereio');

exports.preRequest = function (options, cfg) {

    var body = JSON.parse(options.body);

    body.productType = {
        type: "product-type",
        id: body.productType
    };

    options.body = JSON.stringify(body);
    options.json = body;
};

exports.getMetaModel = function (cfg, availableMetadata, callback) {

    sphereio.getMetaModel({
        cfg: cfg,
        avaliableMetadata: availableMetadata,
        resourceName: 'products',
        modelName: 'product'
    }, callback);
};