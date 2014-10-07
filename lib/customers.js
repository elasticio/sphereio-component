exports.handleAddresses = handleAddresses;

var BILLING_ADDRESS_TYPE = 'billing';
var SHIPPING_ADDRESS_TYPE = 'shipping';

function handleAddresses(customer) {
    var addresses = customer.addresses || [];

    addresses.forEach(addAddressType(customer));

    return customer;
}

function addAddressType(customer) {
    return function(address) {
        var addressId = address.id;

        var type;

        if (addressId === customer.defaultShippingAddressId) {
            type = SHIPPING_ADDRESS_TYPE;
        }
        if (addressId === customer.defaultBillingAddressId) {
            type = BILLING_ADDRESS_TYPE;
        }

        if (type) {
            address._type = type;
        }
    }
}