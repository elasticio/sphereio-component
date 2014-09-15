exports.addVariantResponse = {
    "id": "33afbe8a-fd02-4b4f-80ac-66ff05dbaed3",
    "version": 5,
    "productType": {
        "typeId": "product-type",
        "id": "5dfdc7a9-76a7-4e02-8c4e-6b5b9bd58ef8"
    },
    "catalogs": [],
    "masterData": {
        "current": {
            "name": {
                "en": "WB ATHLETIC TANK"
            },
            "description": {
                "en": "Sample description"
            },
            "categories": [{
                "typeId": "category",
                "id": "9ac573d5-8f0b-4451-aa57-7626f264aaef"
            }],
            "slug": {
                "en": "wb-athletic-tank1368609991639"
            },
            "masterVariant": {
                "id": 1,
                "sku": "sku_WB_ATHLETIC_TANK_variant1_1368609991639",
                "prices": [{
                    "value": {
                        "currencyCode": "EUR",
                        "centAmount": 8400
                    }
                }],
                "images": [{
                    "url": "https://www.commercetools.com/cli/data/253265444_1.jpg",
                    "dimensions": {
                        "w": 1400,
                        "h": 1400
                    }
                }],
                "attributes": []
            },
            "variants": []
        },
        "staged": {
            "name": {
                "en": "WB ATHLETIC TANK"
            },
            "description": {
                "en": "Sample description"
            },
            "categories": [{
                "typeId": "category",
                "id": "9ac573d5-8f0b-4451-aa57-7626f264aaef"
            }],
            "slug": {
                "en": "wb-athletic-tank1368609991639"
            },
            "masterVariant": {
                "id": 1,
                "sku": "sku_WB_ATHLETIC_TANK_variant1_1368609991639",
                "prices": [{
                    "value": {
                        "currencyCode": "EUR",
                        "centAmount": 50
                    }
                }],
                "images": [{
                    "url": "https://www.commercetools.com/cli/data/253265444_1.jpg",
                    "dimensions": {
                        "w": 1400,
                        "h": 1400
                    }
                }],
                "attributes": []
            },
            "variants": [{
                "id": 2,
                "sku": "anSku",
                "prices": [],
                "images": [],
                "attributes": []
            }]
        },
        "published": true,
        "hasStagedChanges": true
    },
    "catalogData": {},
    "taxCategory": {
        "typeId": "tax-category",
        "id": "36ce04f7-6e1c-4115-be37-b14abb8eff3e"
    },
    "lastVariantId": 2,
    "createdAt": "1970-01-01T00:00:00.001Z",
    "lastModifiedAt": "2014-09-15T13:20:13.891Z"
};

exports.queryProductResponse = {
    "offset": 0,
    "count": 1,
    "total": 1,
    "results": [{
        "id": "anId",
        "version": 3,
        "productType": {
            "typeId": "product-type",
            "id": "aProductType"
        },
        "catalogs": [],
        "masterData": {
            "current": {
                "name": {
                    "en": "Live-test-name-11111111111"
                },
                "categories": [],
                "slug": {
                    "en": "Live-test-slug-11111111111"
                },
                "masterVariant": {
                    "id": 1,
                    "sku": "aMasterVariantReference",
                    "prices": [],
                    "images": [],
                    "attributes": []
                },
                "variants": []
            },
            "staged": {
                "name": {
                    "en": "Live-test-name-11111111111"
                },
                "categories": [],
                "slug": {
                    "en": "Live-test-slug-11111111111"
                },
                "masterVariant": {
                    "id": 1,
                    "sku": "aMasterVariantReference",
                    "prices": [],
                    "images": [],
                    "attributes": [{
                        "name": "textattr",
                        "value": "Nenad"
                    }]
                },
                "variants": []
            },
            "published": false,
            "hasStagedChanges": true
        },
        "catalogData": {},
        "lastVariantId": 1,
        "createdAt": "2014-09-10T13:43:49.400Z",
        "lastModifiedAt": "2014-09-15T12:38:20.632Z"
    }]
};

exports.reboundResponse = {
    "statusCode": 409,
    "message": "A duplicate combination of the variant values (sku, images, prices, attributes) exists.",
    "errors": [{
        "code": "DuplicateVariantValues",
        "message": "A duplicate combination of the variant values (sku, images, prices, attributes) exists.",
        "variantValues": {
            "sku": "anSku",
            "prices": [],
            "images": [],
            "attributes": []
        }
    }],
    "originalRequest": {
        "endpoint": "/products/33afbe8a-fd02-4b4f-80ac-66ff05dbaed3",
        "payload": {
            "version": 10,
            "actions": [{
                "action": "addVariant",
                "sku": "anSku"
            }]
        }
    }
};