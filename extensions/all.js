var sphereio = require('./sphereio');

exports.preProcess = function (msg, cfg, snapshot, callback) {
    sphereio.attachTokenTo(cfg, callback);
}