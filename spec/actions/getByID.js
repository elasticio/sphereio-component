exports.testSuite = testSuite;

function testSuite(service, fileName) {
    var action = require('../../lib/actions/'+fileName);
    var nock = require('nock');

    var cfg = {
        client: 1,
        clientSecret: 1,
        project: 'elasticio'
    };

    beforeEach(function() {
        nock('https://auth.sphere.io').post('/oauth/token')
            .reply(200, {
                "access_token":"70kNDuiU_UstkLgWro3UYlhLbpXO5ywU",
                "token_type":"Bearer",
                "expires_in":172800,"scope":"manage_project:elasticio"
            });
    });

    describe('successful get', function() {
        var callback = jasmine.createSpy('callback');
        var self;

        beforeEach(function () {
            self = jasmine.createSpyObj('self', ['emit']);
            var msg = {
                body: {
                    id: 42
                }
            };

            var path = '/elasticio/' +service + '/42';

            var scope = nock('https://api.sphere.io');
            scope.get(path).reply(200, {"version":12, id: 42});

            runs(function() {
                action.process.call(self, msg, cfg, callback);
            });

            waitsFor(function() {
                return self.emit.calls.length;
            }, "Timed out", 1000);
        });

        it('should call callback with right params', function() {
            var data = self.emit.calls[0].args[1].body;
            expect(data).toEqual({ version: 12, id: 42 });
        });

        it('should call end event', function() {
            expect(self.emit).toHaveBeenCalledWith('end');
        });

        it('should not emit more then two events', function() {
            expect(self.emit.calls.length).toEqual(2);
        });
    });

    describe('not found error', function() {
        var callback = jasmine.createSpy('callback');
        var self;

        var path = '/elasticio/' +service + '/54';

        beforeEach(function () {
            self = jasmine.createSpyObj('self', ['emit']);
            var msg = {
                body: {
                    id: 54,
                    external_id: '5400'
                }
            };
            var scope = nock('https://api.sphere.io');
            scope.get(path).reply(404, {statusCode: 404});

            runs(function() {
                action.process.call(self, msg, cfg, callback);
            });

            waitsFor(function() {
                return self.emit.calls.length;
            }, "Timed out", 1000);
        });

        it('should emit right error', function() {
            expect(self.emit).toHaveBeenCalledWith('error', {
                statusCode : 404,
                message : 'Endpoint \'' + path+ '\' not found.',
                originalRequest : {
                    endpoint : '/' +service + '/54'
                }
            });
        });

        it('should emmit end', function() {
            expect(self.emit).toHaveBeenCalledWith('end');
        });

        it('should not emit more then two events', function() {
            expect(self.emit.calls.length).toEqual(2);
        });
    });
}