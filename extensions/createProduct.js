exports.preProcess = function (msg, cfg, snapshot, cb) {

    var id = msg.body.productType;

    msg.body.productType = {
        type: "product-type",
        id: id
    };

    cb();
};