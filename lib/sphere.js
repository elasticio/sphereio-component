var SphereClient = require('sphere-node-client');

exports.createClient = createClient;
exports.createServiceClient = createServiceClient;
exports.getProductTypeAttributes = getProductTypeAttributes;

function createClient(cfg, debug) {
    var logger;
    if (debug) {
        logger = {
            path: './sphere-elastic-debug.log',
            levelFile: 'debug'
        };
    } else {
        logger = {
            silent: true,
            streams: [
                {level: 'info', stream: process.stdout }
            ]
        };
    }

    return new SphereClient({
        logConfig: logger,
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