![SPHERE.IO icon](https://admin.sphere.io/assets/images/sphere_logo_rgb_long.png)

# Node.js Utils

[![NPM](https://nodei.co/npm/sphere-node-utils.png?downloads=true)](https://www.npmjs.org/package/sphere-node-utils)

[![Build Status](https://secure.travis-ci.org/sphereio/sphere-node-utils.png?branch=master)](http://travis-ci.org/sphereio/sphere-node-utils) [![NPM version](https://badge.fury.io/js/sphere-node-utils.png)](http://badge.fury.io/js/sphere-node-utils) [![Coverage Status](https://coveralls.io/repos/sphereio/sphere-node-utils/badge.png)](https://coveralls.io/r/sphereio/sphere-node-utils) [![Dependency Status](https://david-dm.org/sphereio/sphere-node-utils.png?theme=shields.io)](https://david-dm.org/sphereio/sphere-node-utils) [![devDependency Status](https://david-dm.org/sphereio/sphere-node-utils/dev-status.png?theme=shields.io)](https://david-dm.org/sphereio/sphere-node-utils#info=devDependencies)

This module shares helpers among all [SPHERE.IO](http://sphere.io/) Node.js components.

## Table of Contents
* [Getting Started](#getting-started)
* [Documentation](#documentation)
  * [Helpers](#helpers)
    * [Logger](#logger)
    * [ExtendedLogger](#extendedlogger)
    * [TaskQueue](#taskqueue)
    * [Sftp](#sftp)
    * [ProjectCredentialsConfig](#projectcredentialsconfig)
    * [Repeater](#repeater)
    * [ElasticIo](#elasticio)
  * [Mixins](#mixins)
    * [Qutils](#qutils)
    * [Underscore](#underscore)
      * [_.deepClone](#_deepclone)
      * [_.prettify](#_prettify)
      * [_.percentage](#_percentage)
      * [_.stringifyQuery](#_stringifyquery)
      * [_.parseQuery](#_parsequery)
* [Examples](#examples)
* [Releasing](#releasing)
* [License](#license)


## Getting Started

```coffeescript
SphereUtils = require 'sphere-node-utils'
Logger = SphereUtils.Logger
TaskQueue = SphereUtils.TaskQueue
Sftp = SphereUtils.Sftp
ProjectCredentialsConfig = SphereUtils.ProjectCredentialsConfig
ElasticIo = SphereUtils.ElasticIo
_u = SphereUtils._u

# or
{Logger, TaskQueue, Sftp, ProjectCredentialsConfig, ElasticIo, _u} = require 'sphere-node-utils'
```

## Documentation

### Helpers
Currently following helpers are provided by `SphereUtils`:

- `Logger`
- `TaskQueue`
- `Sftp`
- `ProjectCredentialsConfig`
- `ElasticIo`
- `Repeater`

#### Logger
Logging is supported by the lightweight JSON logging module called [Bunyan](https://github.com/trentm/node-bunyan).

The `Logger` can be configured with following options
```coffeescript
logConfig:
  levelStream: 'info' # log level for stdout stream
  levelFile: 'debug' # log level for file stream
  path: './sphere-node-utils-debug.log' # where to write the file stream
  name: 'sphere-node-utils' # name of the application
  serializers:
    request: reqSerializer # function that maps the request object with fields (uri, method, headers)
    response: resSerializer # function that maps the response object with fields (status, headers, body)
  src: false # includes a log of the call source location (file, line, function).
             # Determining the source call is slow, therefor it's recommended not to enable this on production.
  silent: false # don't instantiate the {Bunyan} logger, instead use `console`
  streams: [ # a list of streams that defines the type of output for log messages
    {level: 'info', stream: process.stdout}
    {level: 'debug', path: './sphere-node-utils-debug.log'}
  ]
```

> A `Logger` instance should be extended by the component that needs logging by providing the correct configuration

```coffeescript
{Logger} = require 'sphere-node-utils'

module.exports = class extends Logger

  # we can override here some of the configuration options
  @appName: 'my-application-name'
  @path: './my-application-name.log'
```

A `Bunyan` logger can also be created from another existing logger. This is useful to connect sub-components of the same application by sharing the same configuration.
This concept is called **[child logger](https://github.com/trentm/node-bunyan#logchild)**.

```coffeescript
{Logger} = require 'sphere-node-utils'
class MyCustomLogger extends Logger
  @appName: 'my-application-name'

myLogger = new MyCustomLogger logConfig

# assume we have a component which already implements logging
appWithLogger = new AppWithLogger
  logConfig:
    logger: myLogger

# now we can use `myLogger` to log and everything logged from the child logger of `AppWithLogger`
# will be logged with a `widget_type` field, meaning the log comes from the child logger
```

Once you configure your logger, you will get JSON stream of logs based on the level you defined. This is great for processing, but not for really human-friendly.
This is where the `bunyan` command-line tool comes in handy, by providing **pretty-printed** logs and **filtering**. More info [here](https://github.com/trentm/node-bunyan#cli-usage).

```bash
# examples

# this will output the content of the log file in a `short` format
bunyan sphere-node-connect-debug.log -o short
00:31:47.760Z  INFO sphere-node-connect: Retrieving access_token...
00:31:48.232Z  INFO sphere-node-connect: GET /products

# directly pipe the stdout stream
jasmine-node --verbose --captureExceptions test | ./node_modules/bunyan/bin/bunyan -o short
00:34:03.936Z DEBUG sphere-node-connect: OAuth constructor initialized. (host=auth.sphere.io, accessTokenUrl=/oauth/token, timeout=20000, rejectUnauthorized=true)
    config: {
      "client_id": "S6AD07quPeeTfRoOHXdTx2NZ",
      "client_secret": "7d3xSWTN5jQJNpnRnMLd4qICmfahGPka",
      "project_key": "my-project",
      "oauth_host": "auth.sphere.io",
      "api_host": "api.sphere.io"
    }
00:34:03.933Z DEBUG sphere-node-connect: Failed to retrieve access_token, retrying...1

```

##### Silent logs, use `console`
You can pass a `silent` flag to override the level functions of the `bunyan` logger (debug, info, ...) to print to stdout / stderr using console.

#### ExtendedLogger
An `ExtendedLogger` allows you to wrap additional fields to the logged JSON object, by either defining them on class instantiation or by chaining them before calling the log level method.

> Under the hood it uses the [Logger](#logger) `Bunyan` object

```coffeescript
logger = new ExtendedLogger
  additionalFields:
    project_key: 'foo'
    another_field: 'bar'
  logConfig: # see config above (Logger)
    streams: [
      { level: 'info', stream: process.stdout }
    ]

# then use the logger as usual

logger.info {id: 123}, 'Hello world'
# => {"name":"sphere-node-utils","hostname":"Nicolas-MacBook-Pro.local","pid":25856,"level":30,"id":123,"project_key":"foo","another_field":"bar","msg":"Hello world","time":"2014-04-17T10:54:05.237Z","v":0}

# or by chaining

logger.withField({token: 'qwerty'}).info {id: 123}, 'Hello world'
# => {"name":"sphere-node-utils","hostname":"Nicolas-MacBook-Pro.local","pid":25856,"level":30,"id":123,"project_key":"foo","another_field":"bar", "token": "qwerty","msg":"Hello world","time":"2014-04-17T10:54:05.237Z","v":0}
```

#### TaskQueue
A `TaskQueue` allows you to queue promises (or function that return promises) which will be executed in parallel sequentially, meaning that new tasks will not be triggered until the previous ones are resolved.

```coffeescript
{TaskQueue} = require 'sphere-node-utils'

callMe = ->
  d = Q.defer()
  setTimeout ->
    d.resolve true
  , 5000
  d.promise
task = new TaskQueue maxParallel: 50 # default 20
task.addTask callMe
.then (result) -> # result == true
.fail (error) ->
```

Available methods:
- `setMaxParallel` sets the `maxParallel` parameter (default is `20`). **If < 1 or > 100 it throws an error**
- `addTask` adds a task (promise) to the queue and returns a new promise

#### Sftp
Provides promised based wrapped functionalities for some `SFTP` methods

- `listFiles` TBD
- `stats` TBD
- `readFile` _not implemented yet_
- `saveFile` _not implemented yet_
- `getFile` TBD
- `putFile` TBD
- `safePutFile` TBD
- `renameFile` TBD
- `safeRenameFile` TBD
- `removeFile` TBD
- `openSftp` TBD
- `close` TBD
- `downloadAllFiles` TBD

> The client using the `Sftp` helper should take care of how to send requests to manage remote files. E.g.: multiple concurrency requests to rename a file should be done sequentially to avoid problems (use `Qutils.processList`)


#### ProjectCredentialsConfig
Provides sphere credentials based on the project key.

Following files are used to store the credentials and would be searched (descending priority):

* ./.sphere-project-credentials
* ./.sphere-project-credentials.json
* ~/.sphere-project-credentials
* ~/.sphere-project-credentials.json
* /etc/sphere-project-credentials
* /etc/sphere-project-credentials.json

#### ElasticIo
_(Coming soon)_

#### Repeater

 Repeater is designed to repeat some arbitrary function unless the execution of this function does not throw any errors

 Options:

 * **attempts** - Int - how many times execution of the function should be repeated until repeater will give up (default 10)
 * **timeout** - Long - the delay between attempts
 * **timeoutType** - String - The type of the timeout:
   * `'constant'` - always the same timeout
   * `'variable'` - timeout grows with the attempts count (it also contains random component)

Example:

```coffeescript
repeater = new Repeater {attempts: 10}

repeater.execute
  recoverableError: (e) -> e instanceof ErrorStatusCode and e.code is 409
  task: ->
    console.info("get some stuff..")
    console.info("update some another things...")
    Q("Done")
```

### Mixins
Currently following mixins are provided by `SphereUtils`:

- `Qutils`
  - `processList`
- `underscore`
  - `deepClone`
  - `prettify`
  - `percentage`
  - `stringifyQuery`
  - `parseQuery`

#### Qutils
A collections of Q utils (promise-based)

```coffeescript
{Qutils} = require 'sphere-node-utils'
```

##### `processList`
Process each element in the given list using the function `fn` (called on each iteration).
The function `fn` has to return a promise that should be resolved when all elements of the page are processed.

```coffeescript
list = [{key: '1'}, {key: '2'}, {key: '3'}]
processList list, (elems) -> # elems is an array
  doSomethingWith(elems) # it's a promise
  .then ->
    # something else
    anotherPromise()
```

> Note that the argument passed to the process function is always an array, containing a number of elements defined by `maxParallel` option

You can pass some options as second argument:
- `accumulate` whether the results should be accumulated or not (default `true`). If not, an empty array will be returned from the resolved promise.
- `maxParallel` how many elements from the list will be passed to the process `fn` function (default `1`)

#### Underscore
A collection of methods to be used as `underscore` mixins. To install

```coffeescript
_ = require 'underscore'
{_u} = require 'sphere-node-utils'
_.mixin _u

# or
_.mixin require('sphere-node-utils')._u
```

##### `_.deepClone`
Returns a deep clone of the given object

```coffeescript
obj = {...} # some object with nested values
cloned = _.deepClone(obj)
```

##### `_.prettify`
Returns a pretty-print formatted JSON string.

```coffeescript
obj = foo: 'bar'
pretty = _.prettify(obj) # you can pass the indentation value as optional 2nd argument (default 2)
# =>
# "{
#   "foo": "bar"
# }"
```

> If the argument is not a JSON object, the argument itself is returned (also for `Error` instances)

##### `_.percentage`
Returns the percentage of the given values

```coffeescript
value = _.percentage(30, 500)
# => 6
```

##### `_.stringifyQuery`
Returns a URL query string from a key-value object

```coffeescript
params =
  where: encodeURIComponent('name = "Foo"')
  staged: true
  limit: 100
  offset: 2
_.stringifyQuery(params)
# => 'where=name%20%3D%20%22Foo%22&staged=true&limit=100&offset=2'
```

##### `_.parseQuery`
Returns a key-value JSON object from a query string
> Note that all values are parsed as string

```coffeescript
query = 'where=name%20%3D%20%22Foo%22&staged=true&limit=100&offset=2'
_.parseQuery(query)
# => {where: encodeURIComponent('name = "Foo"'), staged: 'true', limit: '100', offset: '2'}
```

## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).
More info [here](CONTRIBUTING.md)

## Releasing
Releasing a new version is completely automated using the Grunt task `grunt release`.

```javascript
grunt release // patch release
grunt release:minor // minor release
grunt release:major // major release
```

## License
Copyright (c) 2014 SPHERE.IO
Licensed under the [MIT license](LICENSE-MIT).
