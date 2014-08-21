describe('Sphereio update customers external id', function () {
    var updateCustomers = require('../../lib/actions/updateCustomer.js');
    var nock = require('nock');


    describe('successful update', function() {
        var callback = jasmine.createSpy('callback');
        var self;

        beforeEach(function () {
            self = jasmine.createSpyObj('self', ['emit']);
            var msg = {
                body: {
                    id: 42,
                    external_id: '4200'
                }
            };

            var cfg = {
                client: 1,
                clientSecret: 1,
                project: 'elasticio'
            };
     
            nock('https://auth.sphere.io').post('/oauth/token')
                    .reply(200, {
                        "access_token":"70kNDuiU_UstkLgWro3UYlhLbpXO5ywU",
                        "token_type":"Bearer",
                        "expires_in":172800,"scope":"manage_project:elasticio"
                    });

            var scope = nock('https://api.sphere.io');

            scope.get('/elasticio/customers/42').reply(200, {"version":12, id: 42});


            scope.post('/elasticio/customers/42').reply(200, {"version":12, id: 42});

            
            runs(function() {
                updateCustomers.process.call(self, msg, cfg, callback);
            });

            waitsFor(function() {
                return self.emit.calls.length;
            }, "Timed out", 1000);
        });

        it('should call callback with right params', function() {
            expect(self.emit).toHaveBeenCalled();
            expect(self.emit).toHaveBeenCalledWith('end');
            expect(self.emit).not.toHaveBeenCalledWith('error');
        });
    });

    describe('concurrency error', function() {
        var callback = jasmine.createSpy('callback');
        var self;
        beforeEach(function () {
            self = jasmine.createSpyObj('self', ['emit']);
            var msg = {
                body: {
                    id: 42,
                    external_id: '4200'
                }
            };

            var cfg = {
                client: 1,
                clientSecret: 1,
                project: 'elasticio'
            };
     
            nock('https://auth.sphere.io').post('/oauth/token')
                    .reply(200, {
                        "access_token":"70kNDuiU_UstkLgWro3UYlhLbpXO5ywU",
                        "token_type":"Bearer",
                        "expires_in":172800,"scope":"manage_project:elasticio"
                    });

            var scope = nock('https://api.sphere.io');

            scope.get('/elasticio/customers/42').reply(200, {"version":12, id: 42});


            scope.post('/elasticio/customers/42').reply(409, {statusCode: 409});

            
            runs(function() {
                updateCustomers.process.call(self, msg, cfg, callback);
            });

            waitsFor(function() {
                return self.emit.calls.length;
            }, "Timed out", 1000);
        });

        it('should rebound message', function() {
            expect(self.emit).toHaveBeenCalledWith('rebound');
            expect(self.emit).toHaveBeenCalledWith('end');
            expect(self.emit).not.toHaveBeenCalledWith('error');
        });
    });

    describe('not found error', function() {
        var callback = jasmine.createSpy('callback');
        var self;
        beforeEach(function () {
            self = jasmine.createSpyObj('self', ['emit']);
            var msg = {
                body: {
                    id: 54,
                    external_id: '5400'
                }
            };

            var cfg = {
                client: 1,
                clientSecret: 1,
                project: 'elasticio'
            };
     
            nock('https://auth.sphere.io').post('/oauth/token')
                    .reply(200, {
                        "access_token":"70kNDuiU_UstkLgWro3UYlhLbpXO5ywU",
                        "token_type":"Bearer",
                        "expires_in":172800,"scope":"manage_project:elasticio"
                    });

            var scope = nock('https://api.sphere.io');

            scope.get('/elasticio/customers/54').reply(404, {statusCode: 404});
            
            runs(function() {
                updateCustomers.process.call(self, msg, cfg, callback);
            });

            waitsFor(function() {
                return self.emit.calls.length;
            }, "Timed out", 1000);
        });

        it('should emit error', function() {
            expect(self.emit).toHaveBeenCalledWith('error', { statusCode : 404, message : 'Endpoint \'/elasticio/customers/54\' not found.', originalRequest : { endpoint : '/customers/54' } });
            expect(self.emit).toHaveBeenCalledWith('end');
            expect(self.emit).not.toHaveBeenCalledWith('data');
        });
    });
});