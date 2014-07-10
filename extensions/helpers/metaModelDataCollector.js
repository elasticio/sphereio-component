var Q = require('q');
var path = require('path');
var request = require('request');
var fs = require('fs');
var _ = require('underscore');
var attributeManager = require('./attributeManager.js');

exports.getData = function (options) {

    var basePath = "https://api-v0.sphere.io/";
    var cfg = options.cfg;
    var availableMetadata = options.availableMetadata;
    var resourceName = options.resourceName;

    var projectInfoRequest = {
        uri: basePath + cfg.project,
        headers: {
            "Authorization": "Bearer " + cfg.oauth.access_token
        }
    };

    return Q.all([
            Q.nfcall(request.get, projectInfoRequest),
            Q.nfcall(fs.readFile, path.resolve(__dirname, '../../', resourceName + '.json'), "utf8"),
            Q.fcall(function () {
                return availableMetadata ? availableMetadata : {};
            })
        ]).spread(function (response, resourceContent, availableMetadata) {

            var res = response[0];
            var body = JSON.parse(response[1]);

            if (res.statusCode !== 200) {
                throw new Error(JSON.stringify(body));
            }

            var languageMeta = exports.createLanguagesMetaData(body.languages);

            //prepare out meta
            var resource = JSON.parse(resourceContent);
            var model = exports.findModel(resource, options.modelName);

            var outMeta = undefined;
            if(model) {
                outMeta = {};
                outMeta.type = 'object',
                outMeta.properties = model.properties
            }

            //prepare in meta
            var inMeta = undefined;

            if(availableMetadata.in) {
                inMeta = JSON.parse(JSON.stringify(availableMetadata.in));
            }

            //create metadata
            var metadata = {
                out:outMeta,
                "in":inMeta
            };

            return [metadata, languageMeta];
        }).spread(function(metadata, languageMeta) {
            // get also productTypeData
            return attributeManager.promiseProductTypeData(options.cfg).then(function(productTypeData){
                if (productTypeData && productTypeData.attributes) {
                    attributeManager.addAttributes(metadata, productTypeData.attributes);
                }
                return [metadata, languageMeta];
            })
        });
};

exports.findModel = function (resource, modelName) {

    return _.find(resource.models, function (model) {
        return model.id.toLowerCase() === modelName.toLowerCase();
    }) || null;

}

exports.createLanguagesMetaData = function getLanguagesMetaData(arrayOfLanguages) {

    return arrayOfLanguages.reduce(function (previousResult, language) {

        previousResult[language] = {type: "string"};

        return previousResult;

    }, {});
};