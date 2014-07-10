var dataProcessor = require('../../extensions/helpers/metaModelDataProcessor');
var Q = require('q');

describe('Data processor', function () {

    var languageMeta = {
        "en": {
            type: "string"
        },
        "de": {
            type: "string"
        }
    };

    describe('updateMetadata', function () {


        it('should replace all lstring type properties with provided languageMeta', function () {
            var metadata = {
                "type": "object",
                "properties": {
                    "name": {
                        "title": "Name",
                        "type": "lstring"
                    }
                }
            };

            var expected = {
                "type": "object",
                "properties": {
                    "name": {
                        "title": "Name",
                        "type": "object",
                        "properties": {
                            "en": {
                                type: "string",
                                "title": "Name (en)"
                            },
                            "de": {
                                type: "string",
                                "title": "Name (de)"
                            }
                        }
                    }
                }
            };

            dataProcessor.updateMetadata(metadata, languageMeta);
            expect(metadata).toEqual(expected);
        });


        it('should replace lstring properties in whichever depth level', function () {
            var metadata = {
                "type": "object",
                "properties": {
                    "productdata": {
                        "type": "object",
                        "properties": {
                            "description": {
                                "type": "lstring",
                                "title": "First Name",
                                "required": true
                            },
                            "data": {
                                "type": "object",
                                "properties": {
                                    "type": {
                                        "type": "lstring",
                                        "title": "Type",
                                        "required": false
                                    }
                                }
                            }
                        }
                    },
                    "summary": {
                        "type": "lstring",
                        "required": false
                    }
                }
            };

            var expected = {
                "type": "object",
                "properties": {
                    "productdata": {
                        "type": "object",
                        "properties": {
                            "description": {
                                "type": "object",
                                "title": "First Name",
                                "required": true,
                                "properties": {
                                    "en": {
                                        "title": "First Name (en)",
                                        type: "string",
                                        "required": true
                                    },
                                    "de": {
                                        "title": "First Name (de)",
                                        type: "string",
                                        "required": true
                                    }
                                }
                            },
                            "data": {
                                "type": "object",
                                "properties": {
                                    "type": {
                                        "type": "object",
                                        "title": "Type",
                                        "required": false,
                                        "properties": {
                                            "en": {
                                                "title": "Type (en)",
                                                type: "string",
                                                "required": false
                                            },
                                            "de": {
                                                "title": "Type (de)",
                                                type: "string",
                                                "required": false
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "summary": {
                        "type": "object",
                        "required": false,
                        "properties": {
                            "en": {
                                "title": "Summary (en)",
                                type: "string",
                                "required": false
                            },
                            "de": {
                                "title": "Summary (de)",
                                type: "string",
                                "required": false
                            }
                        }
                    }
                }
            };

            dataProcessor.updateMetadata(metadata, languageMeta);
            expect(metadata).toEqual(expected);
        });

        it('should replace nothing if no lstring property is found', function () {
            var metadata = {
                "type": "object",
                "properties": {
                    "name": {
                        "title": "Name",
                        "type": "string"
                    }
                }
            };

            var expected = {
                "type": "object",
                "properties": {
                    "name": {
                        "title": "Name",
                        "type": "string"
                    }
                }
            };

            dataProcessor.updateMetadata(metadata, languageMeta);

            expect(metadata).toEqual(expected);
        });

        it('should replace nothing if no language meta is provided', function () {
            var langMeta = null;
            var metadata = {
                "type": "object",
                "properties": {
                    "name": {
                        "title": "Name",
                        "type": "lstring"
                    }
                }
            };
            var expected = {
                "type": "object",
                "properties": {
                    "name": {
                        "title": "Name",
                        "type": "lstring"
                    }
                }
            };

            dataProcessor.updateMetadata(metadata, langMeta);

            expect(metadata).toEqual(expected);
        });

    });

    describe('processData', function () {
        it('should call updateMetadata and return a promise', function () {

            var metadata = {
                out: {
                    "type": "object",
                    "properties": {
                        "productdata": {
                            "type": "object",
                            "properties": {
                                "description": {
                                    "type": "lstring",
                                    "title": "First Name"
                                },
                                "data": {
                                    "type": "object",
                                    "properties": {
                                        "type": {
                                            "type": "lstring",
                                            "title": "Type"
                                        }
                                    }
                                }
                            }
                        },
                        "summary": {
                            "type": "lstring"
                        }
                    }
                },
                in: {
                    "type": "object",
                    "properties": {
                        "productdata": {
                            "type": "object",
                            "properties": {
                                "description": {
                                    "type": "lstring",
                                    "title": "First Name"
                                },
                                "data": {
                                    "type": "object",
                                    "properties": {
                                        "type": {
                                            "type": "lstring",
                                            "title": "Type"
                                        }
                                    }
                                }
                            }
                        },
                        "summary": {
                            "type": "lstring"
                        }
                    }
                }
            };

            var expected = {
                "type": "object",
                "properties": {
                    "productdata": {
                        "type": "object",
                        "properties": {
                            "description": {
                                "type": "object",
                                "title": "First Name",
                                "properties": {
                                    "en": {
                                        "title": "First Name (en)",
                                        type: "string"
                                    },
                                    "de": {
                                        "title": "First Name (de)",
                                        type: "string"
                                    }
                                }
                            },
                            "data": {
                                "type": "object",
                                "properties": {
                                    "type": {
                                        "type": "object",
                                        "title": "Type",
                                        "properties": {
                                            "en": {
                                                "title": "Type (en)",
                                                type: "string"
                                            },
                                            "de": {
                                                "title": "Type (de)",
                                                type: "string"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "summary": {
                        "type": "object",
                        "properties": {
                            "en": {
                                "title": "Summary (en)",
                                type: "string"
                            },
                            "de": {
                                "title": "Summary (de)",
                                type: "string"
                            }
                        }
                    }
                }
            };

            var expectedResult = {
                in:expected,
                out:expected
            };

            spyOn(dataProcessor, 'updateMetadata').andCallThrough();

            var result;
            runs(function(){
                dataProcessor.processData(metadata, languageMeta).then(function(metadata){
                    result = metadata;
                });
            });

            waitsFor(function () {
                return result;
            });

            runs(function () {
                expect(dataProcessor.updateMetadata.callCount).toEqual(6);
                expect(result).toEqual(expectedResult);
            });

        });
    });

    /*describe('updateMetadata', function () {
        var metadata = require(__dirname + '/json/metadata.json');
        var attributes = require(__dirname + '/json/attributes.json');
        var metadata_with_attributes_localized = require(__dirname + '/json/metadata_with_attributes_localized.json');

        it('should add attributes to metadata', function () {
            dataProcessor.processData(metadata, languageMeta, attributes);
            expect(metadata).toEqual(metadata_with_attributes_localized);
        });
    });*/
});
