'use strict';

/* 

Specified in https://tools.ietf.org/html/rfc7231#section-3.1.1.1

3.1.1.1. Media Type

 media-type = type "/" subtype *( OWS ";" OWS parameter )
 type       = token
 subtype    = token

The type/subtype MAY be followed by parameters in the form of
name=value pairs.

parameter      = token "=" ( token / quoted-string )

The type, subtype, and parameter name tokens are case-insensitive.
Parameter values might or might not be case-sensitive, depending on
the semantics of the parameter name.  The presence or absence of a
parameter might be significant to the processing of a media-type,
depending on its definition within the media type registry.

A parameter value that matches the token production can be
transmitted either as a token or within a quoted-string.  The quoted
and unquoted values are equivalent.  For example, the following
examples are all equivalent, but the first is preferred for
consistency:

text/html;charset=utf-8
text/html;charset=UTF-8
Text/HTML;Charset="utf-8"
text/html; charset="utf-8"

Note: Unlike some similar constructs in other header fields, media
type parameters do not allow whitespace (even "bad" whitespace)
around the "=" character.

https://tools.ietf.org/html/rfc7230#section-3.2.6
https://tools.ietf.org/html/rfc5234#appendix-B.1

3.2.6. Field Value Components

Most HTTP header field values are defined using common syntax
components (token, quoted-string, and comment) separated by
whitespace or specific delimiting characters.  Delimiters are chosen
from the set of US-ASCII visual characters not allowed in a token
(DQUOTE and "(),/:;<=>?@[\]{}").

 token       = 1*tchar

 tchar       = "!" / "#" / "$" / "%" / "&" / "'" / "*"
             / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
             / DIGIT / ALPHA
             ; any VCHAR, except delimiters

A string of text is parsed as a single value if it is quoted using
double-quote marks.

 quoted-string  = DQUOTE *( qdtext / quoted-pair ) DQUOTE
 qdtext         = HTAB / SP /%x21 / %x23-5B / %x5D-7E / obs-text
 obs-text       = %x80-FF
 quoted-pair    = "\" ( HTAB / SP / VCHAR / obs-text )
 OWS            = *( SP / HTAB )
 VCHAR          =  %x21-7E

*/

// A valid token or token character
const tchar = /^[!#$%&'*+\-.0-9A-Z^_`a-z|~]+$/;
// Valid character for plain quoted text
const qdtext = /^[\t !#-[\]-~\x80-\xFF]+$/;
// A valid parameter value or escaped parameter character
const escaped = /^[\t\x20-\x7E\x80-\xFF]+$/;

class ContentType {

    constructor( str ) {

        this.type = '';
        this.subtype = '';
        this.parameters = {};

        if ( str ) {
            this.parse( str );
        }
    }

    get mediaType() {
        return this.type + '/' + this.subtype;
    }

    set mediaType( value ) {
        const contentType = new ContentType( value );
        this.type = contentType.type;
        this.subtype = contentType.subtype;
    }

    get charset() {
        return ( this.parameters.charset || '' ).toLowerCase();
    }

    set charset( value ) {
        this.parameters.charset = value || undefined;
    }

    parse( str ) {

        let cursor = 0;
        let chr = str[cursor];
        let type = '';
        let subtype = '';
        const parameters = {};
       
        if ( !chr || !tchar.test( chr ) ) {
            throw new Error( 'missing type at position ' + cursor );               
        }

        do {
            type += chr;
            chr = str[++cursor];
        } while ( chr && tchar.test( chr ) );

        if ( chr !== '/' ) {
            throw new Error( 'expected / at position ' + cursor );
        }

        chr = str[++cursor];
        
        if ( !chr || !tchar.test( chr ) ) {
            throw new Error( 'missing subtype at position ' + cursor );               
        }

        do {
            subtype += chr;
            chr = str[++cursor];
        } while ( chr && tchar.test( chr ) );

        do {

            let name = '';
            let value = '';

            if ( !chr ) {
                break;
            }

            while ( chr === ' ' || chr === '\t' ) {
                chr = str[++cursor];
            }

            if ( chr !== ';' ) {
                throw new Error( 'expected ; at position ' + cursor );
            }

            chr = str[++cursor];

            while ( chr && chr === ' ' || chr === '\t' ) {
                chr = str[++cursor];
            }

            if ( !chr || !tchar.test( chr ) ) {
                throw new Error( 'missing parameter name at position ' + cursor );
            }

            do {
                name += chr;
                chr = str[++cursor];
            } while ( chr && tchar.test( chr ) );

            if ( chr !== '=' ) {
                throw new Error( 'expected = at position ' + cursor );
            }

            chr = str[++cursor];

            if ( chr === '"' ) {

                do {

                    chr = str[++cursor];

                    if ( chr && qdtext.test( chr ) ) {
                        value += chr;
                    } else if ( chr === '\\' ) {
                        chr = str[++cursor];

                        if ( !chr ) {
                            throw new Error( 'incomplete escape at position ' + cursor ); 
                        }

                        if ( escaped.test( chr ) ) {
                            value += chr;
                        } else {
                            throw new Error( 
                                'unexpected character (' + chr.charCodeAt( 0 ) + ') at position ' + cursor 
                            );
                        }
                    } else if ( chr === '"' ) {
                        chr = str[++cursor];
                        break;
                    } else if ( !chr ) {
                        throw new Error( 'expected " at position ' + cursor ); 
                    } else {
                        throw new Error( 
                            'unexpected character (' + chr.charCodeAt( 0 ) + ') at position ' + cursor 
                        ); 
                    }

                } while ( chr );

            } else {
                
                if ( !chr || !tchar.test( chr ) ) {
                    throw new Error( 'missing parameter value at position ' + cursor );               
                }

                while ( chr && tchar.test( chr ) ) {
                    value += chr;
                    chr = str[++cursor];
                }
            }

            name = name.toLowerCase();

            if ( !parameters[name] ) {
                parameters[name] = value;
            } 

        } while ( chr );

        this.type = type.toLowerCase();
        this.subtype = subtype.toLowerCase();
        this.parameters = parameters;

    }

    format() {

        let formatted;
    
        if ( !this.type ) {
            throw new Error( 'missing type' );
        }

        if ( !tchar.test( this.type ) ) {
            throw new Error( this.type + ' is not a valid type' );
        }

        if ( !this.subtype ) {
            throw new Error( 'missing subtype' );
        }

        if ( !tchar.test( this.subtype ) ) {
            throw new Error( this.subtype + ' is not a valid subtype' );
        }

        formatted = this.type + '/' + this.subtype;

        for ( let name in this.parameters ) {
            
            let value = this.parameters[name];

            name = name.toLowerCase();

            if ( !tchar.test( name ) ) {
                throw new Error( name + ' is not a valid parameter name' );
            } 

            if ( name === 'charset' ) {   
                if ( !value ) {
                    value = null;
                } else {
                    value = value.toLowerCase();
                }
            }

            if ( value === undefined || value === null ) {
                continue;
            }

            if ( value === '' ) {

                formatted += '; ' + name + '=""';

            } else if ( tchar.test( value ) ) {

                formatted += '; ' + name + '=' + value;

            } else if ( !escaped.test( value ) ) {
                
                throw new Error( value + ' is not a valid parameter value' );

            } else {

                formatted += '; ' + name + '="' + value.replace( /["\\]/g, '\\$&' ) + '"';

            }
            
        }

        return formatted;

    }

    toString() {
        return this.format();
    }

    static format( ob ) {

        let contentType = ob;

        if ( !( ob instanceof ContentType ) ) {
            contentType = new ContentType();

            if ( ob.mediaType ) {
                contentType.mediaType = ob.mediaType;
            }

            contentType.type = ob.type || contentType.type;
            contentType.subtype = ob.subtype || contentType.subtype;

            contentType.parameters = ob.parameters || {};
            contentType.charset = ob.charset || contentType.charset;
        }

        return contentType.format();

    }

    static parse( str ) {

        if ( str instanceof ContentType ) {
            return str;
        }

        return new ContentType( str );

    }

}

module.exports = ContentType;