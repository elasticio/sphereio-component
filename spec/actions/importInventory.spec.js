const logger = require('@elastic.io/component-logger')();

xdescribe('Sphereio import inventory', function () {
    var importInventory = require('../../lib/actions/importInventory.js');
    var getInventoryJson = require('../data/getInventory.json.js');
    var inventoryJson = require('../data/inventory.json.js');
    var nock = require('nock');

    var cfg = {
        client: "foo",
        clientSecret: "bar",
        project: 'elasticio'
    };

    beforeEach(function () {

        nock('https://auth.sphere.io').post('/oauth/token')
            .reply(200, {
                "access_token": "70kNDuiU_UstkLgWro3UYlhLbpXO5ywU",
                "token_type": "Bearer",
                "expires_in": 172800, "scope": "manage_project:elasticio"
            });
    });

    describe('missing sku', function () {
        var callback = jasmine.createSpy('callback');
        var self;

        beforeEach(function () {
            self = jasmine.createSpyObj('self', ['emit']);
            self.logger = logger;

            var msg = {
                body: {}
            };

            runs(function () {
                importInventory.process.call(self, msg, cfg);
            });

            waitsFor(function () {
                return self.emit.calls.length === 2;
            }, "Timed out", 1000);
        });

        it('should call callback with right params', function () {
            var emitDataCall = self.emit.calls[0];

            expect(emitDataCall.args[0]).toEqual('error');
            expect(emitDataCall.args[1].message).toEqual('SKU is missing');

            var emitEndCall = self.emit.calls[1];

            expect(emitEndCall.args[0]).toEqual('end');
        });
    });

    describe('missing quantity', function () {
        var callback = jasmine.createSpy('callback');
        var self;

        beforeEach(function () {
            self = jasmine.createSpyObj('self', ['emit']);
            self.logger = logger;

            var msg = {
                body: {
                    sku: 'sku_MB_PREMIUM_TECH_T_variant1_1412674273743'
                }
            };

            runs(function () {
                importInventory.process.call(self, msg, cfg);
            });

            waitsFor(function () {
                return self.emit.calls.length === 2;
            }, "Timed out", 1000);
        });

        it('should call callback with right params', function () {
            var emitDataCall = self.emit.calls[0];

            expect(emitDataCall.args[0]).toEqual('error');
            expect(emitDataCall.args[1].message).toEqual('Quantity is missing');

            var emitEndCall = self.emit.calls[1];

            expect(emitEndCall.args[0]).toEqual('end');
        });
    });

    describe('create new inventory', function () {
        var callback = jasmine.createSpy('callback');
        var self;

        beforeEach(function () {
            self = jasmine.createSpyObj('self', ['emit']);
            self.logger = logger;

            var msg = {
                body: {
                    sku: 'sku_MB_PREMIUM_TECH_T_variant1_1412674273743',
                    quantity: '106'
                }
            };
            var scope = nock('https://api.sphere.io');

            scope.get('/elasticio/inventory?where=sku%3D%22sku_MB_PREMIUM_TECH_T_variant1_1412674273743%22&limit=1')
                .reply(200, {
                    results: []
                });

            scope.post('/elasticio/inventory', {
                "sku": "sku_MB_PREMIUM_TECH_T_variant1_1412674273743",
                "quantityOnStock": 106
            })
                .reply(200, getInventoryJson.body);

            runs(function () {
                importInventory.process.call(self, msg, cfg);
            });

            waitsFor(function () {
                return self.emit.calls.length === 2;
            }, "Timed out", 1000);
        });

        it('should call callback with right params', function () {
            var emitDataCall = self.emit.calls[0];

            expect(emitDataCall.args[0]).toEqual('data');
            expect(emitDataCall.args[1].body).toEqual(getInventoryJson.body);

            var emitEndCall = self.emit.calls[1];

            expect(emitEndCall.args[0]).toEqual('end');
        });
    });

    describe('update existing inventory with new data', function () {
        var callback = jasmine.createSpy('callback');
        var self;

        beforeEach(function () {
            self = jasmine.createSpyObj('self', ['emit']);
            self.logger = logger;

            var msg = {
                body: {
                    sku: 'sku_MB_PREMIUM_TECH_T_variant1_1412674273743',
                    quantity: '106'
                }
            };
            var scope = nock('https://api.sphere.io');

            scope.get('/elasticio/inventory?where=sku%3D%22sku_MB_PREMIUM_TECH_T_variant1_1412674273743%22&limit=1')
                .reply(200, inventoryJson.body);

            scope.post('/elasticio/inventory/33b122db-17fc-4348-977f-94bf4a848b98', {
                "actions": [
                    {
                        "quantity": 6,
                        "action": "addQuantity"
                    }
                ],
                "version": 1
            })
                .reply(200, getInventoryJson.body);

            runs(function () {
                importInventory.process.call(self, msg, cfg);
            });

            waitsFor(function () {
                return self.emit.calls.length === 2;
            }, "Timed out", 1000);
        });

        it('should call callback with right params', function () {
            var emitDataCall = self.emit.calls[0];

            expect(emitDataCall.args[0]).toEqual('data');
            expect(emitDataCall.args[1].body).toEqual(getInventoryJson.body);

            var emitEndCall = self.emit.calls[1];

            expect(emitEndCall.args[0]).toEqual('end');
        });
    });

    describe('update existing inventory with same data', function () {
        var callback = jasmine.createSpy('callback');
        var self;

        beforeEach(function () {
            self = jasmine.createSpyObj('self', ['emit']);
            self.logger = logger;

            var msg = {
                body: {
                    sku: 'sku_MB_PREMIUM_TECH_T_variant1_1412674273743',
                    quantity: '100'
                }
            };
            var scope = nock('https://api.sphere.io');

            scope.get('/elasticio/inventory?where=sku%3D%22sku_MB_PREMIUM_TECH_T_variant1_1412674273743%22&limit=1')
                .reply(200, inventoryJson.body);


            runs(function () {
                importInventory.process.call(self, msg, cfg);
            });

            waitsFor(function () {
                return self.emit.calls.length === 2;
            }, "Timed out", 1000);
        });

        it('should call callback with right params', function () {
            var emitDataCall = self.emit.calls[0];

            expect(emitDataCall.args[0]).toEqual('data');
            expect(emitDataCall.args[1].body).toEqual(getInventoryJson.body);

            var emitEndCall = self.emit.calls[1];

            expect(emitEndCall.args[0]).toEqual('end');
        });
    });
});
