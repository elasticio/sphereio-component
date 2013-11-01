exports.preProcess = function (msg, cfg, snapshot, cb) {

    console.log("preProcess createProduct");

    console.log(msg.body);

    var id = msg.body.productType;

    msg.body.productType = {
        type: "product-type",
        id: id
    };

    console.log(msg.body);

    cb();
};