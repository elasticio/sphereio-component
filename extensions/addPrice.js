exports.preRequest = function (options, cfg, msg) {

    var body = JSON.parse(options.body);
    console.log(body);

    body.actions = [];

    var action = {};

    action.action = 'addPrice';
    action.variantId = body.variantId+;
    action.price = {};
    action.price.value = {};
    action.price.value.currencyCode = body.currencyCode;
    action.price.value.centAmount = body.amount * 100;
    action.country = body.country;
    action.staged = !!body.staged;

    body.actions.push(action);

    delete body.currencyCode;
    delete body.amount;
    delete body.country;
    delete body.variantId;
    delete body.staged;

    options.body = JSON.stringify(body);
    options.json = body;
};