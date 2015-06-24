var SphereClient = require('sphere-node-sdk').SphereClient;

exports.createClient = createClient;
exports.createServiceClient = createServiceClient;
exports.getProductTypeAttributes = getProductTypeAttributes;

function createClient(cfg) {
    return new SphereClient({
        config: {
            client_id: cfg.client,
            client_secret:  cfg.clientSecret,
            project_key:  cfg.project
        }
    });
}

function createServiceClient(service, cfg, debug) {
    var client = createClient(cfg, debug);
    return client[service];
}

/**
 * Get product type attributes from sphereio
 */
function getProductTypeAttributes(client, productType){
    return client.productTypes.byId(productType).fetch().then(function(data){
        if (data && data.body.attributes) {
            return data.body.attributes;
        }
    });
}