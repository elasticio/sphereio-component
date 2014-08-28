var helper = require('../helpers.js');
var messages = require("../messages.js");

var sphere = require('../sphere.js');

exports.process = function (msg, cfg, next, snapshot) {
    var self = this;

    var client = sphere.createClient("orders", cfg);

    var lastModifiedAt = snapshot.lastModifiedAt || '1970-01-01T00:00:00.000Z';

    var where = 'lastModifiedAt > "' + lastModifiedAt + '"';

    if (cfg.where) {
        where += " and " + cfg.where;
    }

    function handleResults(response) {
        if (response.body.count) {
            helper.updateSnapshotWithLastModified(response.body.results, snapshot);
            self.emit('data', messages.newMessageWithBody(response.body));
        }
        self.emit('snapshot', snapshot);
    }

    client
        .where(where)
        .perPage(20)
        .sort('lastModifiedAt', true)
        .fetch()
        .then(handleResults)
        .fail(function (err) {
            self.emit('error', err);
        })
        .done(function(){
            self.emit('end');
        });
};
