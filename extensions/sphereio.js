var util = require("util");
var moment = require("moment");
var request = require('request');
var _ = require("underscore");
var Q = require('q');
var metaModelDataCollector = require('./helpers/metaModelDataCollector');
var metaModelDataProcessor = require('./helpers/metaModelDataProcessor');

exports.setWhereLastModifiedGreaterThan = function (msg, cfg, snapshot, cb) {

    var where = cfg.where;

    if (!where) {

        var lastModifiedAt = snapshot.lastModifiedAt;

        if (lastModifiedAt) {

            where = util.format('lastModifiedAt > \"%s\"', lastModifiedAt);

            console.log(where);

            cfg.where = where;
        }
    }

    cb();
};

exports.updateSnapshotWithLastModified = function (msg, snapshot, cb) {
    var body = msg.body;

    var count = body.count || 0;

    if (count < 1) {
        return cb();
    }

    var results = body.results || [];

    _.each(results, function (result) {

        updateSnapshot(result, snapshot);
    });

    cb(null, msg, snapshot);
};

var updateSnapshot = function (data, snapshot) {
    var lastModifiedAt = data.lastModifiedAt;

    var maxLastModifiedAt = snapshot.lastModifiedAt || "1970-01-01T00:00:00.000Z";

    if (moment(lastModifiedAt).isAfter(maxLastModifiedAt)) {

        snapshot.lastModifiedAt = lastModifiedAt;
    }
};

exports.getMetaModel = function (options, callback) {
    Q.nfcall(exports.attachTokenTo, options.cfg).then(function () {
        return options;
    })
        .then(metaModelDataCollector.getData)
        .spread(metaModelDataProcessor.processData)
        .then(function (metaModel) {
            callback(null, metaModel);
        }).fail(function (err) {
            callback(err);
        }).done();
}

const OAUTH_URL = 'https://auth-v0.sphere.io/oauth/token';

exports.attachTokenTo = function (cfg, cb) {

    var uri = require('url').parse(OAUTH_URL);

    uri.auth = [cfg.client, cfg.clientSecret].join(':');

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

        console.log("Received new access token for client: %s", cfg.client);

        cfg.oauth = {
            "access_token": payload["access_token"]
        };

        cb();
    })
};