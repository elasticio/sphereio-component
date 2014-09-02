var SphereClient = require('sphere-node-client');

exports.createClient = createClient;

function createClient(service, cfg, debug) {
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
    var client = new SphereClient({
        logConfig: logger,
        config: {
            client_id: cfg.client,
            client_secret:  cfg.clientSecret,
            project_key:  cfg.project
        }
    });

    return client[service];
}