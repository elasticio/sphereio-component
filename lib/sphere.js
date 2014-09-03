var SphereClient = require('sphere-node-client');

exports.createClient = createClient;

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