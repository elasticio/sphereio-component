describe('Sphere.io helpers', function () {
    var helpers = require('../lib/helpers.js');
    var allCustomers = require('./data/all_customers.json.js');
    var allOrders = require('./data/all_orders.json.js');

    describe('Sphere.io helpers: updateSnapshotWithLastModified', function () {

        it('Should update snapshot field `lastModifiedAt` if this field is empty', function () {
            var snapshot = {};
            helpers.updateSnapshotWithLastModified(allCustomers.results, snapshot);
            expect(snapshot.lastModifiedAt).toEqual('2014-08-19T00:00:00.001Z');
        });

        it('Should update snapshot field `lastModifiedAt` if snapshot\'s field in the past', function () {
            var snapshot = {
                lastModifiedAt: '2014-08-18T00:00:00.001Z'
            };
            helpers.updateSnapshotWithLastModified(allCustomers.results, snapshot);
            expect(snapshot.lastModifiedAt).toEqual('2014-08-19T00:00:00.001Z');
        });

        it('Should not update snapshot field `lastModifiedAt` if snapshot\'s field in the future', function () {
            var future = '2014-08-22T00:00:00.001Z';
            var snapshot = {
                lastModifiedAt: future
            };
            helpers.updateSnapshotWithLastModified(allCustomers.results, snapshot);
            expect(snapshot.lastModifiedAt).toEqual(future);
        });

        it('Should update snapshot field `lastModifiedAt` if this field is empty', function () {
            var snapshot = {};
            helpers.updateSnapshotWithLastModified(allOrders.results, snapshot);
            expect(snapshot.lastModifiedAt).toEqual(allOrders.results[1].lastModifiedAt);
        });

    });

    describe('Sphere.io helpers: convertLStrings', function () {

        var input = {
            'type': 'object',
            'properties': {
                'offset': {
                    'type': 'number',
                    'title': 'Offset',
                    'required': true
                },
                'total': {
                    'type': 'number',
                    'title': 'Total',
                    'required': true
                },
                'results': {
                    'type': 'array',
                    'required': true,
                    'properties': {
                        'id': {
                            'title': 'ID',
                            'type': 'string',
                            'required': true
                        },
                        'name': {
                            'title': 'Name',
                            'type': 'lstring',
                            'required': true
                        }
                    }
                }
            }
        };

        var nameConverted = {
            type : 'object',
            properties : {
                en : {
                    title : 'Name (en)',
                    type : 'string',
                    required : true
                },
                de : {
                    title : 'Name (de)',
                    type : 'string',
                    required : true
                }
            }
        };

        it('Should convert lstring property to array of string properties', function () {
            var result = helpers.convertLStrings(input, ['de', 'en']);
            expect(result.properties.results.properties.name).toEqual(nameConverted);
        });
    });


    describe('Sphere.io helpers: centAmountFromAmount', function () {

        it('Should convert to centAmount strings with .', function () {
            var result = helpers.centAmountFromAmount("12.35");
            expect(result).toEqual(1235);
        });

        it('Should convert to centAmount numbers', function () {
            var result = helpers.centAmountFromAmount(12.35);
            expect(result).toEqual(1235);
        });

        it('Should raise exception if string is empty', function () {
            expect(function(){
                helpers.centAmountFromAmount("");
            }).toThrow('"" is not valid amount value');
        });

        it('Should raise exception if string is a number with ,', function () {
            expect(function(){
                helpers.centAmountFromAmount("12,35");
            }).toThrow('"12,35" is not valid amount value');
        });

        it('Should raise exception if string is a number with , and .', function () {
            expect(function(){
                helpers.centAmountFromAmount("12,352.66");
            }).toThrow('"12,352.66" is not valid amount value');
        });
    });

    describe('Sphere.io helpers: amountFromCentAmount', function () {

        it('Should convert number in a correct way', function () {
            var result = helpers.amountFromCentAmount(1200);
            expect(result).toEqual(12.00);
        });

        it('Should convert string in a correct way', function () {
            var result = helpers.amountFromCentAmount('1234');
            expect(result).toEqual(12.34);
        });

        it('Should raise exception if centAmount is floating point number', function () {
            expect(function(){
                helpers.amountFromCentAmount(12.35);
            }).toThrow('"12.35" is not valid centAmount value');
        });

        it('Should raise exception if centAmount is a string with ,', function () {
            expect(function(){
                helpers.amountFromCentAmount("12,35");
            }).toThrow('"12,35" is not valid centAmount value');
        });

        it('Should raise exception if centAmount is a string with .', function () {
            expect(function(){
                helpers.amountFromCentAmount("12.35");
            }).toThrow('"12.35" is not valid centAmount value');
        });
    });

    describe('Sphere.io helpers: centAmountsToAmounts and amountsToCentAmounts', function () {

        var objWithCentAmounts = {
            name: 'Jessica',
            surname: 'Simpson',
            cartItems: [{
                name: 'Book',
                price: {
                    currencyCode: 'EUR',
                    centAmount: 1234
                }
            }]
        };

        var objWithAmounts = {
            name: 'Jessica',
            surname: 'Simpson',
            cartItems: [{
                name: 'Book',
                price: {
                    currencyCode: 'EUR',
                    amount: 12.34
                }
            }]
        };

        function clone(obj){
            return JSON.parse(JSON.stringify(obj));
        }

        it('centAmountsToAmounts should convert centAmounts to amounts', function () {
            var input = clone(objWithCentAmounts);
            var output = clone(objWithAmounts);

            var result = helpers.centAmountsToAmounts(input);
            expect(result).toEqual(output);
        });

        it('amountsToCentAmounts should convert amounts to centAmounts', function () {
            var input = clone(objWithAmounts);
            var output = clone(objWithCentAmounts);

            var result = helpers.amountsToCentAmounts(input);
            expect(result).toEqual(output);
        });

    });


});
