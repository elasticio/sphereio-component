var _ = require('underscore');
var Q = require('q');
var attributeManager = require('./attributeManager.js');

exports.processData = function (metadata, languageMeta, attributes) {

    if (attributes) {
        attributeManager.addAttributes(metadata, attributes);
    }

    _.each(metadata, function (meta) {
        exports.updateMetadata(meta, languageMeta);
    });

    return Q.fcall(function () {
        return metadata;
    });
};

exports.updateMetadata = function (metadata, languageMeta) {
    if(!languageMeta || !metadata) return;

    _.each(metadata.properties, function (property, propertyName) {

        if (property.type === "lstring") {

            var title = property.title || (_.first(propertyName).toUpperCase() + _.rest(propertyName).join(''));

            //deep copy of language meta data as we will manipulate it's properties
            var languageMetaCopy = JSON.parse(JSON.stringify(languageMeta));

            _.each(languageMetaCopy, function (languageCodeProperties, languageCode) {
                languageCodeProperties.title = title + " (" + languageCode + ")";
                if (property.required !== undefined) {
                    languageCodeProperties.required = property.required;
                }
            });

            property.type = "object";
            property.properties = languageMetaCopy;

            return;
        }

        if (property.properties) exports.updateMetadata(property, languageMeta);
    });
}
