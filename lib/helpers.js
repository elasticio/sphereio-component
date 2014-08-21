var moment = require("moment");
var _ = require("underscore");

exports.updateSnapshotWithLastModified = function updateSnapshotWithLastModified(results, snapshot) {
    _.each(results, function (result) {
        updateSnapshot(result, snapshot);
    });
};

function updateSnapshot(data, snapshot) {
    var lastModifiedAt = data.lastModifiedAt;
    var maxLastModifiedAt = snapshot.lastModifiedAt || "1970-01-01T00:00:00.000Z";

    if (moment(lastModifiedAt).isAfter(maxLastModifiedAt)) {
        snapshot.lastModifiedAt = lastModifiedAt;
    }
}