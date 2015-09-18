module.exports = {"offset": 0, "count": 2, "total": 2, "results": [
    {
        "type": "Order",
        "id": "8fd9f83c-3453-418c-9f3b-5a218bfc842a",
        "version": 11,
        "createdAt": "2013-06-04T14:05:13.564Z",
        "lastModifiedAt": "2013-06-04T14:05:13.564Z",
        "orderState": "Open",
        "totalPrice": {
            "currencyCode": "EUR",
            "centAmount": 10200
        },
        "taxedPrice": {
            "totalNet": {
                "currencyCode": "EUR",
                "centAmount": 8262
            },
            "totalGross": {
                "currencyCode": "EUR",
                "centAmount": 10200
            },
            "taxPortions": [
                {
                    "rate": 0.19,
                    "amount": {
                        "currencyCode": "EUR",
                        "centAmount": 1938
                    }
                }
            ]
        },
        "lineItems": [
            {
                "id": "910baeb9-cddc-4723-a921-5770ed6f474e",
                "productId": "70bd556e-21f8-45da-8742-a0b33e0f0fa7",
                "name": {
                    "en": "GIRLS HARTBREAK CREW"
                },
                "variant": {
                    "id": 1,
                    "sku": "sku_GIRLS_HARTBREAK_CREW_variant1_1368609991619",
                    "prices": [
                        {
                            "value": {
                                "currencyCode": "EUR",
                                "centAmount": 3400
                            }
                        }
                    ],
                    "images": [
                        {
                            "url": "https://sphere.io/cli/data/253234387_1.jpg",
                            "dimensions": {
                                "w": 1400,
                                "h": 1400
                            }
                        }
                    ],
                    "attributes": []
                },
                "price": {
                    "value": {
                        "currencyCode": "EUR",
                        "centAmount": 3400
                    }
                },
                "quantity": 3,
                "taxRate": {
                    "name": "19% MwSt",
                    "amount": 0.19,
                    "includedInPrice": true,
                    "country": "DE",
                    "id": "woNXPp-l"
                },
                "state": [
                    {
                        "quantity": 3,
                        "state": {
                            "typeId": "state",
                            "id": "de672b0b-c9a3-4dc1-8d8d-298cd8d45fe1"
                        }
                    }
                ]
            }
        ],
        "shippingAddress": {
            "firstName": "Igor",
            "lastName": "Drobiazko",
            "country": "DE"
        },
        "customLineItems": [],
        "transactionFee": false,
        "syncInfo": [],
        "returnInfo": [],
        "lastMessageSequenceNumber": 0,
        "shippingInfo": {
            "price": {
                "centAmount": 1111
            },
            "shippingRate": {
                "freeAbove": {
                    "centAmount": 15000
                }
            },
            "taxRate": {
                "amount": 0.3,
                "includedInPrice": false
            }
        },
        "paymentInfo": {
            "payments": [
                {
                    "id": "7a788f93-8eef-4ca4-ab45-ca937ad040a"
                },
                {
                    "id": "some_id2"
                }
            ]
        }
    },
    {
        "type": "Order",
        "id": "ad921e37-0ea1-4aba-a57e-8caadfc093eb",
        "version": 7,
        "createdAt": "2013-06-04T14:09:41.042Z",
        "lastModifiedAt": "2014-08-20T09:22:36.569Z",
        "customerId": "3927ef3d-b5a1-476c-a61c-d719752ae2dd",
        "orderState": "Open",
        "shipmentState": "Ready",
        "paymentState": "Pending",
        "totalPrice": {
            "currencyCode": "EUR",
            "centAmount": 2800
        },
        "taxedPrice": {
            "totalNet": {
                "currencyCode": "EUR",
                "centAmount": 2268
            },
            "totalGross": {
                "currencyCode": "EUR",
                "centAmount": 2800
            },
            "taxPortions": [
                {
                    "rate": 0.19,
                    "amount": {
                        "currencyCode": "EUR",
                        "centAmount": 532
                    }
                }
            ]
        },
        "lineItems": [
            {
                "id": "73fe6845-03c3-46ad-9295-f53f3f78fb7e",
                "productId": "c9a55fc9-7773-42d8-99d2-4937590c933d",
                "name": {
                    "en": "SAPPHIRE"
                },
                "variant": {
                    "id": 1,
                    "sku": "sku_SAPPHIRE_variant1_1368609991591",
                    "prices": [
                        {
                            "value": {
                                "currencyCode": "EUR",
                                "centAmount": 2800
                            }
                        }
                    ],
                    "images": [
                        {
                            "url": "https://sphere.io/cli/data/252542005_1.jpg",
                            "dimensions": {
                                "w": 1400,
                                "h": 1400
                            }
                        }
                    ],
                    "attributes": []
                },
                "price": {
                    "value": {
                        "currencyCode": "EUR",
                        "centAmount": 2800
                    }
                },
                "quantity": 1,
                "taxRate": {
                    "name": "19% MwSt",
                    "amount": 0.19,
                    "includedInPrice": true,
                    "country": "DE",
                    "id": "woNXPp-l"
                },
                "state": [
                    {
                        "quantity": 1,
                        "state": {
                            "typeId": "state",
                            "id": "de672b0b-c9a3-4dc1-8d8d-298cd8d45fe1"
                        }
                    }
                ]
            }
        ],
        "shippingAddress": {
            "firstName": "Igor",
            "lastName": "Drobiazko",
            "country": "DE"
        },
        "customLineItems": [],
        "transactionFee": false,
        "syncInfo": [],
        "returnInfo": [],
        "lastMessageSequenceNumber": 0,
        "shippingInfo": {
            "price": {
                "centAmount": 10000
            },
            "shippingRate": {
                "freeAbove": {
                    "centAmount": 5000
                }
            },
            "taxRate": {
                "amount": 0.3,
                "includedInPrice": false
            }
        },
        "paymentInfo": {
            "payments": [
                {
                    "id": "7a788f93-8eef-4ca4-ab45-ca937ad040b"
                },
                {
                    "id": "some_id2"
                }
            ]
        }
    }
]};