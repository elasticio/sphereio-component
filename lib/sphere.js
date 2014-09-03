var SphereClient = require('sphere-node-client');

exports.createClient = createClient;
exports.getProductTypeAttributes = getProductTypeAttributes;

function createClient(cfg) {
    var client = new SphereClient({
        logConfig: {
            silent: true,
            streams: [
                {level: 'info', stream: process.stdout }
            ]
        },
        config: {
            client_id: cfg.client,
            client_secret:  cfg.clientSecret,
            project_key:  cfg.project
        }
    });

    return client;
}

/**
 * Get product type attributes from sphereio
 */
function getProductTypeAttributes(client, productType){
    return client.productTypes.byId(productType).fetch().then(function getAttributes(data) {
        if (data && data.body.attributes) {
            return data.body.attributes;
        } else {
            return [];
        }
    });
}