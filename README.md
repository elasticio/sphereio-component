#elastic.io API Description Sample

This project demonstrates how to add new REST API to the elastic.io platform. 
Before going into the description two words about **Swagger**:

## Swagger

From [Swagger Wordnik](http://swagger.wordnik.com/) site:

>Swagger is a specification and complete framework implementation for
>describing, producing, consuming, and visualizing RESTful web services.

We at elastic.io chosen Swagger as our first REST service description language, other languages
(e.g. *WSDL* for SOAP Services or *WADL* or *Mashape* description languages will follow).

Swagger have following advantages over other alternatives:

* It's open source project distributed under Apache License, Version 2.0
* It has a modular structure (core, code generator, UI, etc)
* It has a significant traction and community acceptance

We believe that even if you don't use Swagger right now for documentaiton of your REST API you might benifit
from it in the long-term e.g. from Swagger Code Generation.

## Contract

All information required for new API to appear on elastic.io platform should be stored in Git repository, 
just like this one on Github :). It need to satisfy following requirements:
* It should have an *index* document called ```/api-docs.json```, typical Swagger structure that declares an entry point and references individual *resource* description files.
* It should have an icon called ```/logo.png```. This logo should be 64x64 pixels large and have a transparent background.

That's more or less it.

License
-------

Copyright 2013 elastic.io GmbH

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at [apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
