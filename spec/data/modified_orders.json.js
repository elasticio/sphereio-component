module.exports = {"offset": 0, "count": 2, "total": 2, "results": [
    {
        "type": "Order",
        "id": "8fd9f83c-3453-418c-9f3b-5a218bfc842a",
        "version": 12,
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
        "lastMessageSequenceNumber": 0
    }
]};