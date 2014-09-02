var sphere = require('./lib/sphere.js');
var attributeManager = require('./lib/attributeManager.js');

var msg = {"id":"d8315da0-3294-11e4-bb4e-0bd1ea5c4f1d","body":{"masterVariant":{
    "prices":[{"value":{"centAmount":'800',"currencyCode":"EUR"}}]
    "textattr":"textattribute","numattr":"15"
},
    "slug":{"en":"SLUG-PROD34534"},"name":{"en":"NAME-PRO34534534"}},
    "headers":{},"attachments":{},"query":{},"metadata":{}};

var cfg = {"productType":"d61f0985-f818-4c09-aed3-55e515b31ad7","_account":"540573702a88db3a59000002","project":"elasticio",
    "clientSecret":"-mMPrPnv_vSNQr4v4YASnX716ggQ_D_z","client":"c7bsQTE5gopuIh-hEcBm4k26"};

attributeManager.buildProduct(msg, cfg, function(err, product) {

    console.log(product);

    var client = sphere.createClient("products", cfg);
    client.save(product).then(handleResult).fail(hanldeError).done(end);

    function handleResult(data) {
        console.log(data);
    }

    function hanldeError(err) {
        console.log(JSON.stringify(msg.body));
        console.log(err);
    }

    function end() {
        console.log('end');
    }
});