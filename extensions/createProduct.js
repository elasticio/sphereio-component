exports.preRequest = function (options, cfg) {

    var body = JSON.parse(options.body);

    body.productType = {
        type: "product-type",
        id: body.productType
    };

    options.body = JSON.stringify(body);

};