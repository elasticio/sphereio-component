var customers = require('../customers.js');

exports.process = require('./getByID.js').build('customers', customers.handleAddresses);