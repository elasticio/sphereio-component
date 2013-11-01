exports.preRequest = function (options, cfg) {

    console.log("preRequest createProduct")

    var body = JSON.parse(options.body);

    body.productType = {
        type: "product-type",
        id: body.productType
    };

    options.body = JSON.stringify(body);

    console.log(options);

};