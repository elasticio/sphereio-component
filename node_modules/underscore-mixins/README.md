![SPHERE.IO icon](https://admin.sphere.io/assets/images/sphere_logo_rgb_long.png)

# Underscore mixins

[![NPM](https://nodei.co/npm/underscore-mixins.png?downloads=true)](https://www.npmjs.org/package/underscore-mixins)

[![Build Status](https://secure.travis-ci.org/sphereio/underscore-mixins.png?branch=master)](http://travis-ci.org/sphereio/underscore-mixins) [![NPM version](https://badge.fury.io/js/underscore-mixins.png)](http://badge.fury.io/js/underscore-mixins) [![Coverage Status](https://coveralls.io/repos/sphereio/underscore-mixins/badge.png)](https://coveralls.io/r/sphereio/underscore-mixins) [![Dependency Status](https://david-dm.org/sphereio/underscore-mixins.png?theme=shields.io)](https://david-dm.org/sphereio/underscore-mixins) [![devDependency Status](https://david-dm.org/sphereio/underscore-mixins/dev-status.png?theme=shields.io)](https://david-dm.org/sphereio/underscore-mixins#info=devDependencies)

A collection of methods to be used as `underscore` mixins

## Table of Contents
* [Documentation](#documentation)
  * [_.deepClone](#_deepclone)
  * [_.prettify](#_prettify)
  * [_.percentage](#_percentage)
  * [_.stringifyQuery](#_stringifyquery)
  * [_.parseQuery](#_parsequery)
  * [_.batchList](#_batchlist)
* [Contributing](#contributing)
* [Releasing](#releasing)
* [License](#license)


## Getting Started

```coffeescript
_ = require 'underscore'
_.mixin require('underscore-mixins')
```

## Documentation

### `_.deepClone`
Returns a deep clone of the given object

```coffeescript
obj = {...} # some object with nested values
cloned = _.deepClone(obj)
```

### `_.prettify`
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

### `_.percentage`
Returns the percentage of the given values

```coffeescript
value = _.percentage(30, 500)
# => 6
```

### `_.stringifyQuery`
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

### `_.parseQuery`
Returns a key-value JSON object from a query string
> Note that all values are parsed as string

```coffeescript
query = 'where=name%20%3D%20%22Foo%22&staged=true&limit=100&offset=2'
_.parseQuery(query)
# => {where: 'name%20%3D%20%22Foo%22', staged: 'true', limit: '100', offset: '2'}
```

You can pass a `hasUniqueParams` as second argument to determine the parsing strategy in case of multiple parameters with the same key:
- `true` (default): same parameter key will be overridden
- `false`: same parameters values will be put in an array

```coffeescript
query = 'foo=bar1&foo=bar2'
# => {foo: ['bar1', 'bar2']}
```

### `_.batchList`
Transform a given list in a new nested list of single list elements (batches) given max size.
Useful if you need to process some elements on a list, but not all together.

```coffeescript
list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
_.batchList(list, 3)
# => [[1, 2, 3], [4, 5, 6], [7, 8, 9], [0]]
```

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
