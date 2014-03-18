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

exports.getMetaModel = function (cfg, availableMetadata, resourceName, callback) {

    createMetaModelRequirements(cfg, resourceName, function (err, resource, languages) {
        console.log('Getting meta model with requirements provideid: ' + JSON.stringify(resource) + "\n languages: " + JSON.stringify(languages))

        if (err) {
            return callback(err);
        }

        var languagesMetaData = createLanguagesMetaData(languages);

        var model = _.find(resource.models, function (model) {
            return model.id.toLowerCase() === resourceName;
        });

        var outMeta = {
            "type": "object",
            "properties": model.properties
        };

        //perform deep copy
        var inMeta = JSON.parse(JSON.stringify(availableMetadata.in));

        injectLocalizedStrings(outMeta, languagesMetaData);
        injectLocalizedStrings(inMeta, languagesMetaData);

        var metaData = {
            "in": inMeta,
            "out": outMeta
        }
    });
}

var injectLocalizedStrings = function (model, languageMeta) {
    console.log('Injecting localize strings');
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

        if (property.properties) replaceLStrings(property, languageMeta);
    });
};

var createLanguagesMetaData = function getLanguagesMetaData(arrayOfLanguages) {
    console.log('Creating languages meta');
    return arrayOfLanguages.reduce(function (previousResult, language) {

        previousResult[language] = {type: "string"};

        return previousResult;

    }, Object.create(Object.prototype));
};

var createMetaModelRequirements = function (cfg, resourceName, cb) {
    exports.attachTokenTo(cfg,

        function (err) {

            if (err) {
                return cb(err);
            }

            fs.readFile(__dirname + '/../api-docs.json', function (err, apiDocsContent) {

                fs.readFile(__dirname + '/../' + resourceName + '.json', function (err, resourceContent) {
                    if (err) {
                        return cb(err);
                    }

                    var resource = JSON.parse(resourceContent);

                    var projectUri = apiDocs.basePath + cfg.project;

                    request.get({
                        uri: projectUri,
                        headers: {
                            "Authorization": "Bearer " + cfg.oauth.access_token
                        }
                    }, function (err, response, body) {
                        if (err) {
                            return cb(err);
                        }

                        if (response.statusCode != 200) {
                            return cb(new Error(body));
                        }

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