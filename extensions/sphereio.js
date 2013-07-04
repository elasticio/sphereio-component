var util = require("util");
var moment = require("moment");
var _ = require("underscore");

exports.setWhereLastModifiedGreaterThan = function (msg, cfg, snapshot, cb) {

    var where = msg.body.where;

    if (!where) {

        var lastModifiedAt = snapshot.lastModifiedAt;

        if (lastModifiedAt) {

            where = util.format('lastModifiedAt > \"%s\"', lastModifiedAt);

            console.log(where);

            msg.body.where = where;
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