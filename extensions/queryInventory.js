var sphereio = require('./sphereio');

exports.preProcess = sphereio.setWhereLastModifiedGreaterThan;

exports.postProcess = sphereio.updateSnapshotWithLastModified;