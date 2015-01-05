var uuid = require('node-uuid');

function newEmptyMessage() {
    return {
        id: uuid.v1(),
        attachments: {},
        body: {},
        headers: {},
        metadata: {}
    };
}

function newMessageWithBody(body) {
    var msg = newEmptyMessage();

    msg.body = body;

    return msg;
}

exports.newEmptyMessage = newEmptyMessage;
exports.newMessageWithBody = newMessageWithBody;
