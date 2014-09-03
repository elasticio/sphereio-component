var SphereClient = require('sphere-node-client');

exports.createConnection = createConnection;
exports.createClient = createClient;
exports.getProductTypeAttributes = getProductTypeAttributes;

function createConnection(cfg, debug) {
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

function createClient(service, cfg, debug) {
    var client = createConnection(cfg, debug);
    return client[service];
}

/**
 * Get product type attributes from sphereio
 */
function getProductTypeAttributes(connection, productType, callback){
    connection.productTypes.byId(productType).fetch().then(function (data) {
        if (data && data.body.attributes) {
            return callback(null, data.body.attributes);
        } else {
            return callback(null, []);
        }
    }).fail(callback).done();
}