var request = require("request");

const OAUTH_URL = 'https://auth-v0.sphere.io/oauth/token';

var preProcess = function (msg, cfg, snapshot, cb) {
    var clientId = cfg.client;

    console.log("Requesting access token for client: %s", clientId);

    var uri = require('url').parse(OAUTH_URL);

    uri.auth = [clientId, cfg.clientSecret].join(':');

    request.post({
        uri: uri,
        form: {
            grant_type: 'client_credentials',
            scope: 'manage_project:' + cfg.project
        }
    }, function (err, response, body) {

        if (err) {
            return cb(err);
        }

        if (response.statusCode != 200) {
            return cb(
                new Error('Can not get Bearer token - return code '
                    + response.statusCode + ' received instead of expected 200'));
        }

        var payload = JSON.parse(body);

        console.log("Received new access token for client: %s", clientId);

        cfg.oauth = {
            "access_token": payload["access_token"]
        };

        cb();
    })
};

exports.preProcess = preProcess;