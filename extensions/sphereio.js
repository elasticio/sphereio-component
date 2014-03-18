var util = require("util");
var moment = require("moment");
var request = require('request');
var fs = require('fs');
var _ = require("underscore");

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

var updateSnapshot = function(data, snapshot) {
    var lastModifiedAt = data.lastModifiedAt;

    var maxLastModifiedAt = snapshot.lastModifiedAt || "1970-01-01T00:00:00.000Z";

    if(moment(lastModifiedAt).isAfter(maxLastModifiedAt)) {

        snapshot.lastModifiedAt = lastModifiedAt;
    }
};

exports.getMetaModel = function (options, callback) {

    exports.createMetaModelRequirements(options.cfg, options.resourceName, function (err, resource, languages) {

        if (err) {
            return callback(err);
        }

        var languagesMetaData = createLanguagesMetaData(languages);

        var model = _.find(resource.models, function (model) {
            return model.id.toLowerCase() === options.modelName;
        });

        var outMeta = {
            "type": "object",
            "properties": model.properties
        };

        //perform deep copy
        var inMeta = JSON.parse(JSON.stringify(options.availableMetadata.in));

        injectLocalizedStrings(outMeta, languagesMetaData);
        injectLocalizedStrings(inMeta, languagesMetaData);

        var metaData = {
            "in": inMeta,
            "out": outMeta
        }

        callback(null, metaData);
    });
}

var injectLocalizedStrings = function (model, languageMeta) {

    _.each(model.properties, function (property, propertyName) {

        if (property.type === "lstring") {

            var title = property.title || (_.first(propertyName).toUpperCase() + _.rest(propertyName).join(''));

            //deep copy of language meta data as we will manipulate it's properties
            var languageMetaCopy = JSON.parse(JSON.stringify(languageMeta));

            _.each(languageMetaCopy, function (languageCodeProperties, languageCode) {
                languageCodeProperties.title = title + " (" + languageCode + ")";
            });

            property.type = "object";
            property.properties = languageMetaCopy;

            return;
        }

        if (property.properties) injectLocalizedStrings(property, languageMeta);
    });
};

var createLanguagesMetaData = function getLanguagesMetaData(arrayOfLanguages) {
    return arrayOfLanguages.reduce(function (previousResult, language) {

        previousResult[language] = {type: "string"};

        return previousResult;

    }, Object.create(Object.prototype));
};

exports.createMetaModelRequirements = function (cfg, resourceName, cb) {
    exports.attachTokenTo(cfg,

        function (err) {

            if (err) {
                console.log(err);
                return cb(err);
            }

            fs.readFile(__dirname + '/../api-docs.json', function (err, apiDocsContent) {

                if (err) {
                    console.log(err);
                    return cb(err);
                }

                fs.readFile(__dirname + '/../' + resourceName + '.json', function (err, resourceContent) {
                    if (err) {
                        console.log(err);
                        return cb(err);
                    }
                    var apiDocs = JSON.parse(apiDocsContent);
                    var resource = JSON.parse(resourceContent);

                    var projectUri = apiDocs.basePath + cfg.project;

                    request.get({
                        uri: projectUri,
                        headers: {
                            "Authorization": "Bearer " + cfg.oauth.access_token
                        }
                    }, function (err, response, body) {
                        if (err) {
                            console.log(err);
                            return cb(err);
                        }

                        if (response.statusCode != 200) {
                            console.log(body);
                            return cb(new Error(body));
                        }
                        console.log(typeof body);
                        console.log(JSON.stringify(body));
                        var languages = JSON.parse(body).languages;

                        cb(null, resource, languages);
                    });
                });
            });
        });
}

const OAUTH_URL = 'https://auth-v0.sphere.io/oauth/token';

exports.attachTokenTo = function (cfg, cb) {
    var clientId = cfg.client;

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