var SphereClient = require('sphere-node-client');
console.log('SphereClient');
console.log(SphereClient);

exports.createClient = createClient;

function createClient(service, cfg) {
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

    console.log('project');
    console.log(client['project']);
    console.log('projects');
    console.log(client['projects']);
    console.log('orders');
    console.log(client['orders']);

    return client[service];
}