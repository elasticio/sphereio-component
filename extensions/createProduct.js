exports.preRequest = function (options, cfg) {

    console.log("preRequest createProduct")
    console.log(options)
    console.log("+++++++++++++++++")

    var body = JSON.parse(options.body);

    body.productType = {
        type: "product-type",
        id: body.productType
    };

    options.body = JSON.stringify(body);

    console.log(options);

};