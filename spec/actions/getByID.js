exports.testSuite = testSuite;

function testSuite(service, fileName, responseData, expectedData) {
    var action = require('../../lib/actions/'+fileName);
    var nock = require('nock');

    var cfg = {
        client: "foo",
        clientSecret: "bar",
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

        var replyWithData = responseData ? responseData : {"version":12, id: 42};

        beforeEach(function () {
            self = jasmine.createSpyObj('self', ['emit']);
            var msg = {
                body: {
                    id: 42
                }
            };

            var path = '/elasticio/' +service + '/42';

            var scope = nock('https://api.sphere.io');

            scope.get(path).reply(200, replyWithData);

            runs(function() {
                action.process.call(self, msg, cfg);
            });

            waitsFor(function() {
                return self.emit.calls.length;
            }, "Timed out", 1000);
        });

        it('should call callback with right params', function() {

            expect(self.emit.calls[0].args[0]).toEqual('data');
            var data = self.emit.calls[0].args[1].body;

            var expected = expectedData ? expectedData : replyWithData;

            expect(data).toEqual(expected);
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
                action.process.call(self, msg, cfg);
            });

            waitsFor(function() {
                return self.emit.calls.length;
            }, "Timed out", 1000);
        });

        it('should emit right error', function() {
            expect(self.emit).toHaveBeenCalledWith('error', {
                message: 'Endpoint \'' + path + '\' not found.',
                name: 'NotFound',
                body: {
                    statusCode: 404,
                    message: 'Endpoint \'' + path + '\' not found.',
                    originalRequest: {
                        endpoint: '/' + service + '/54'
                    }
                }, statusCode: 404, code: 404
            });
        });

        it('should emmit end', function() {
            var errorCallArgs = self.emit.calls[1].args;

            expect(errorCallArgs[0]).toEqual('end');
        });

        it('should not emit more then two events', function() {
            expect(self.emit.calls.length).toEqual(2);
        });
    });
}