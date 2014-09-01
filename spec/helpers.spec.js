describe('Sphere.io queryCustomers.js', function () {
    var helpers = require('../lib/helpers.js');
    var allCustomers = require('./data/all_customers.json.js');

    it('Should update snapshot field `lastModifiedAt` if this field is empty', function () {
        var snapshot = {};
        helpers.updateSnapshotWithLastModified(allCustomers.results, snapshot);
        expect(snapshot.lastModifiedAt).toEqual("2014-08-19T00:00:00.001Z");
    });

    it('Should update snapshot field `lastModifiedAt` if snapshot\'s field in the past', function () {
        var snapshot = {
            lastModifiedAt: "2014-08-18T00:00:00.001Z"
        };
        helpers.updateSnapshotWithLastModified(allCustomers.results, snapshot);
        expect(snapshot.lastModifiedAt).toEqual("2014-08-19T00:00:00.001Z");
    });

    it('Should not update snapshot field `lastModifiedAt` if snapshot\'s field in the future', function () {
        var future = "2014-08-22T00:00:00.001Z";
        var snapshot = {
            lastModifiedAt: future
        };
        helpers.updateSnapshotWithLastModified(allCustomers.results, snapshot);
        expect(snapshot.lastModifiedAt).toEqual(future);
    });
});
