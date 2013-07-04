var sphereio = require("./sphereio.js");

exports.preProcess = sphereio.setWhereLastModifiedGreaterThan;

exports.postProcess = sphereio.updateSnapshotWithLastModified;