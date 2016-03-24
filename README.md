# Content-Type-Header

Parses HTTP Content-Type values as specified in https://tools.ietf.org/html/rfc7231.

Although Content-Disposition headers ([RFC6266](https://tools.ietf.org/html/rfc6266)) are very similar to Content-Type headers, they are subtly different in the treatment of white-space.  Additionally, this library does not support extended character notation (`filename*=...`). Therefore this library is not recommended for Content-Disposition headers.

```js
const ContentType = require( 'content-type-header' );
```

## Class: `ContentType`

Parses content-type headers and formats them to a string. 

### `new ContentType([header])`

* **`header`** The string header value to be parsed.  This should be trimmed of white-space.

Create a new ContentType object.

```js
let contentType = new ContentType( 'text/html; charset=utf-8; foo="bar fee"' );

// This can also be done via a static method, see below 
contentType = ContentType.parse( 'text/html; charset=utf-8; foo="bar fee"' );
```

The object has the following properties:

* **`type`** The content-type type, eg `text`
* **`subtype`** The content-type subtype, eg `html`
* **`mediaType`** The full content-type, eg `text/html`
* **`charset`** The charset, eg `utf-8`
* **`parameters`** Any parameters, including the charset, eg `{ charset: 'utf-8', foo: 'bar fee' }`

Any updates to `mediaType` will be reflected in type and subtype.  Any updates to charset will also be reflected in parameters.

If the format does not match the RFC7231 specification an error will be thrown.  This is deliberate.  Incorrect media type identification can lead to privilege in certain contexts; therefore, it is better to disregard badly formatted content-type headers.

### `contentType.parse( string )`

Parse a content-type header and update the properties listed above.

### `contentType.format()`, `contentType.toString()`

Format the contentType into a string.

```js
const contentType = new ContentType();
contentType.type = 'image';
contentType.subtype = 'gif';

contentType.format(); // => 'image/gif'
```

### Static: `ContentType.parse( string )`

Parse a content-type string and return a ContentType object.  If passed an existing contentType instance then this will be passed though.

### Static: `ContentType.format( object )`

Format an object, which can be a ContentType object or a plain object, to a content type string.

If a plain object is used, `type` and `subtype` will be used in preference to `mediaType`, and `charset` will be used in preference to `parameters`.

```js
ContentType.format( { mediaType: 'text/html', charset: 'utf-8' } )
// => 'text/html; charset=utf-8'
```