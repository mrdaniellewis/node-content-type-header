'use strict';

const expect = require( 'expect' );

const ContentType = require( '..' );

describe( 'ContentType', function() {

    it( 'creates a ContentType instance', function() {

        expect( new ContentType() ).toBeA( ContentType );

    } );

    describe( 'constructor', function() {

        it( 'parses a simple content-type', function() {

            expect( new ContentType( 'text/html' ) ).toInclude( {
                type: 'text',
                subtype: 'html',
                parameters: {},
                charset: '',
                mediaType: 'text/html',
            } );

        } );

        it( 'parses a content-type with parameters', function() {

            expect( new ContentType( 'text/html; charset=utf-8; foo=bar' ) ).toInclude( {
                type: 'text',
                subtype: 'html',
                parameters: { charset: 'utf-8', foo: 'bar' },
                charset: 'utf-8',
                mediaType: 'text/html',
            } );

        } );

        it( 'lowercases type, subtype, charset and attribute names', function() {

            expect( new ContentType( 'TeXt/HtMl; ChArSeT=UtF-8; FoO=BaR' ) ).toInclude( {
                type: 'text',
                subtype: 'html',
                parameters: { charset: 'UtF-8', foo: 'BaR' },
                charset: 'utf-8',
                mediaType: 'text/html',
            } );

        } );

        it( 'uses the first parameter found', function() {

            // Strictly they should all be returned and
            // an object is not a suitable container,
            // but only charset is ever used anyway
            expect( new ContentType( 'text/html; foo=bar; foo=fee' ) ).toInclude( {
                type: 'text',
                subtype: 'html',
                parameters: { foo: 'bar' },
                charset: '',
                mediaType: 'text/html',
            } );

        } );

        it( 'allows optional whitespace around ;', function() {

            const expected = { foo: 'bar' };

            expect( new ContentType( 'text/html;foo=bar' ).parameters )
                .toEqual( expected );

            expect( new ContentType( 'text/html \t;foo=bar' ).parameters )
                .toEqual( expected );

            expect( new ContentType( 'text/html; \tfoo=bar' ).parameters )
                .toEqual( expected );
             
            expect( new ContentType( 'text/html \t; \tfoo=bar' ).parameters )
                .toEqual( expected );  
        } );

        describe( 'error handling', function() {

            this.timeout( 10000 );

            const allowedToken = '!#$%&\'*+-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ^_`abcdefghijklmnopqrstuvwxyz|~';
           
            let allowedQuoted =  '\t !#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~'; // eslint-disable-line
            
            for ( let i = 0x80; i <= 0xFF; ++i ) {
                allowedQuoted += String.fromCharCode( i );
            }

            const allowedEsacped = allowedQuoted += '"\\';

            it( 'does not allow leading white space', function() {

                expect( () => new ContentType( ' text/html' ) )
                    .toThrow( 'missing type at position 0' );

            } );

            it( 'does not allow trailing white space', function() {

                expect( () => new ContentType( 'text/html ' ) )
                    .toThrow( 'expected ; at position 10' );

            } );

            it( 'does not allow illegal characters in type', function() {

                for ( let i = 0; i < 0xffff; ++i ) {

                    const chr = String.fromCharCode( i );
                    
                    if ( allowedToken.indexOf( chr ) === -1 ) {

                        expect( () => new ContentType( chr + 'ext/html' ) ) // eslint-disable-line no-loop-func
                            .toThrow( 'missing type at position 0' );

                    } else {
                        expect( new ContentType( chr + 'ext/html' ).mediaType )
                            .toEqual( chr.toLowerCase() + 'ext/html' );
                    }
                }

                expect( () => new ContentType( 'text/html ' ) )
                    .toThrow( 'expected ; at position 10' );

            } );

            it( 'does not allow illegal characters in subtype', function() {

                for ( let i = 0; i < 0xffff; ++i ) {

                    const chr = String.fromCharCode( i );
                    
                    if ( allowedToken.indexOf( chr ) === -1 ) {

                        expect( () => new ContentType( 'text/' + chr + 'tml' ) ) // eslint-disable-line no-loop-func
                            .toThrow( 'missing subtype at position 5' );

                    } else {
                        expect( new ContentType( 'text/' + chr + 'tml' ).mediaType )
                            .toEqual( 'text/' + chr.toLowerCase() + 'tml' );
                    }
                }

                expect( () => new ContentType( 'text/html ' ) )
                    .toThrow( 'expected ; at position 10' );

            } );

            it( 'ensures parameters are delimited by OWS and ;', function() {

                expect( () => new ContentType( 'text/html charset=utf-8' ) )
                    .toThrow( 'expected ; at position 10' );

                expect( () => new ContentType( 'text/htmlcharset=utf-8' ) )
                    .toThrow( 'expected ; at position 16' );

                expect( () => new ContentType( 'text/html; charset=utf-8 foo=bar' ) )
                    .toThrow( 'expected ; at position 25' );  

            } );

            it( 'does not allow missing parameters', function() {

                expect( () => new ContentType( 'text/html; ' ) )
                    .toThrow( 'missing parameter name at position 11' );

            } );

            it( 'does not allow illegal characters in a parameter name', function() {

                for ( let i = 0; i < 0xffff; ++i ) {

                    const chr = String.fromCharCode( i );

                    if ( chr === '=' ) {
                        continue;
                    }
                    
                    if ( allowedToken.indexOf( chr ) === -1 ) {
                        expect( () => new ContentType( 'text/html; fo' + chr + '=bar' ) ) // eslint-disable-line no-loop-func, max-len
                            .toThrow( 'expected = at position 13' );

                    } else {
                        expect( new ContentType( 'text/html; fo' + chr + '=bar' ).parameters )
                            .toEqual( { ['fo' + chr.toLowerCase()]: 'bar' } );
                    }
                }

                expect( () => new ContentType( 'text/html ' ) )
                    .toThrow( 'expected ; at position 10' );

            } );

            it( 'does not allow whitespace around =', function() {

                expect( () => new ContentType( 'text/html; charset =utf-8' ) )
                    .toThrow( 'expected = at position 18' );

                expect( () => new ContentType( 'text/html; charset= utf-8' ) )
                    .toThrow( 'missing parameter value at position 19' ); 

            } );

            it( 'does not allow a missing = or parameter value', function() {

                expect( () => new ContentType( 'text/html; charset' ) )
                    .toThrow( 'expected = at position 18' );

                expect( () => new ContentType( 'text/html; charset=' ) )
                    .toThrow( 'missing parameter value at position 19' ); 

            } );

            it( 'does not allow illegal values in an unquoted parameter value', function() {

                for ( let i = 0; i < 0xffff; ++i ) {

                    const chr = String.fromCharCode( i );

                    if ( chr === '"' ) {
                        continue;
                    }

                    if ( allowedToken.indexOf( chr ) === -1 ) {
                        expect( () => new ContentType( 'text/html; foo=' + chr + 'ar' ) ) // eslint-disable-line no-loop-func, max-len
                            .toThrow( 'missing parameter value at position 15' );

                    } else {
                        expect( new ContentType( 'text/html; foo=' + chr + 'ar' ).parameters )
                            .toEqual( { foo: chr + 'ar' } );
                    }
                }

                expect( () => new ContentType( 'text/html ' ) )
                    .toThrow( 'expected ; at position 10' );

            } );

            it( 'does not allow unclosed quotes in a quoted value', function() {
               
                expect( () => new ContentType( 'text/html; charset="utf-8 ' ) )
                    .toThrow( 'expected " at position 26' );
                
                expect( () => new ContentType( 'text/html; charset="utf-8\\"' ) )
                    .toThrow( 'expected " at position 27' );

            } );

            it( 'does not allow incomplete escapes', function() {

                expect( () => new ContentType( 'text/html; charset="utf-8\\' ) )
                    .toThrow( 'incomplete escape at position 26' );
                

            } );

            it( 'does not allow illegal values in a quoted parameter value', function() {

                for ( let i = 0; i < 0xffff; ++i ) {

                    const chr = String.fromCharCode( i );

                    if ( allowedEsacped.indexOf( chr ) === -1 ) {
                        expect( () => new ContentType( 'text/html; foo="\\' + chr + 'ar"' ) ) // eslint-disable-line no-loop-func, max-len
                            .toThrow( 'unexpected character (' + i + ') at position 17' );
                    
                    } else {
                        expect( new ContentType( 'text/html; foo="\\' + chr + 'ar"' ).parameters )
                            .toEqual( { foo: chr + 'ar' } );
                    }
                }

                expect( () => new ContentType( 'text/html ' ) )
                    .toThrow( 'expected ; at position 10' );

            } );

            it( 'does not allow illegal quoted characters', function() {

                for ( let i = 0; i < 0xffff; ++i ) {

                    const chr = String.fromCharCode( i );

                    if ( chr === '"' || chr === '\\' ) {
                        continue;
                    }

                    if ( allowedQuoted.indexOf( chr ) === -1 ) {
                        expect( () => new ContentType( 'text/html; foo="' + chr + 'ar"' ) ) // eslint-disable-line no-loop-func, max-len
                            .toThrow( 'unexpected character (' + i + ') at position 16' );
                    
                    } else {
                        expect( new ContentType( 'text/html; foo="' + chr + 'ar"' ).parameters )
                            .toEqual( { foo: chr + 'ar' } );
                    }
                }

                expect( () => new ContentType( 'text/html ' ) )
                    .toThrow( 'expected ; at position 10' );

            } );

            it( 'handles truncated strings', function() {

                // Basically checking for infinite loops

                const string = 'text/html; charset="utf-8"; foo=bar';

                for ( let i = string.length; i > 0; --i ) {

                    const test = string.slice( 0, i );

                    try {
                        new ContentType( test ); // eslint-disable-line no-new
                    } catch ( e ) {
                        // Do nothing
                    }
                }

            } );

        } );

    } );

    describe( '#mediaType', function() {

        it( 'is the type and subtype joined', function() {

            const contentType = new ContentType( 'text/html; charset=utf-8' );

            contentType.type = 'image';
            contentType.subtype = 'gif';

            expect( contentType.mediaType ).toEqual( 'image/gif' );

        } );

        it( 'can be used to set the type and subtype', function() {

            const contentType = new ContentType( 'text/html; charset=utf-8' );
            contentType.mediaType = 'image/gif';

            expect( contentType ).toInclude( {
                type: 'image',
                subtype: 'gif',
                parameters: { charset: 'utf-8' },
                charset: 'utf-8',
                mediaType: 'image/gif',
            } );

        } );

    } );

    describe( '#parse', function() {

        it( 'parses a content type', function() {

            const contentType = new ContentType();
            contentType.parse( 'text/html; charset=utf-8; foo=bar' );

            expect( contentType ).toInclude( {
                type: 'text',
                subtype: 'html',
                parameters: { charset: 'utf-8', foo: 'bar' },
                charset: 'utf-8',
                mediaType: 'text/html',
            } );

        } );

    } );

    describe( '#format', function() {
        
        it( 'stringifies a content type', function() {

            const contentType = new ContentType( 'text/html; charset=utf-8; foo=bar' );
            
            expect( contentType.format() )
                .toEqual( 'text/html; charset=utf-8; foo=bar' );
                

        } );

        it( 'uses charset in preference to parameters.charset', function() {

            const contentType = new ContentType( 'text/html; charset=utf-8; foo=bar' );
            contentType.charset = 'iso-8859-8';
            
            expect( contentType.format() )
                .toEqual( 'text/html; charset=iso-8859-8; foo=bar' );
                

        } );

        it( 'quotes parameters only when required', function() {

            const contentType = new ContentType( 'text/html; charset=utf-8; foo="foo thumb"' );
            
            expect( contentType.format() )
                .toEqual( 'text/html; charset=utf-8; foo="foo thumb"' );
                

        } );

        it( 'escapes " and \\ in quoted parameters', function() {

            const contentType = new ContentType();
            contentType.type = 'type';
            contentType.subtype = 'subtype';
            contentType.parameters = { name: '"\\' };
            
            expect( contentType.format() )
                .toEqual( 'type/subtype; name="\\\"\\\\"' );
                

        } );

        it( 'ignores null and undefined parameters', function() {

            const contentType = new ContentType();
            contentType.type = 'type';
            contentType.subtype = 'subtype';
            contentType.parameters = { null: null, undefined: undefined };
            
            expect( contentType.format() )
                .toEqual( 'type/subtype' );
                

        } );

        it( 'lowercases parameter names', function() {

            const contentType = new ContentType();
            contentType.type = 'type';
            contentType.subtype = 'subtype';
            contentType.parameters = { FoO: 'bar' };
            
            expect( contentType.format() )
                .toEqual( 'type/subtype; foo=bar' );
                
        } );

        it( 'lowercases charset value', function() {

            const contentType = new ContentType();
            contentType.type = 'type';
            contentType.subtype = 'subtype';
            contentType.parameters = { charset: 'UtF-8' };
            
            expect( contentType.format() )
                .toEqual( 'type/subtype; charset=utf-8' );
                
        } );

        it( 'adds empty attributes as quoted empty strings', function() {

            const contentType = new ContentType();
            contentType.type = 'type';
            contentType.subtype = 'subtype';
            contentType.parameters = { foo: '' };
            
            expect( contentType.format() )
                .toEqual( 'type/subtype; foo=""' );
                
        } );

        it( 'doesn\'t add empty charsets', function() {

            const contentType = new ContentType();
            contentType.type = 'type';
            contentType.subtype = 'subtype';
            contentType.parameters = { charset: '' };
            
            expect( contentType.format() )
                .toEqual( 'type/subtype' );
                
        } );

        describe( 'error handling', function() {

            it( 'requires a type', function() {

                const contentType = new ContentType();

                expect( () => contentType.format() )
                    .toThrow( 'missing type' );

            } );

            it( 'doesn\'t allow illegal characters in type', function() {

                const contentType = new ContentType();
                contentType.type = '@type';

                expect( () => contentType.format() )
                    .toThrow( '@type is not a valid type' );

            } );

            it( 'requires a subtype', function() {

                const contentType = new ContentType();
                contentType.type = 'type';

                expect( () => contentType.format() )
                    .toThrow( 'missing subtype' );

            } );

            it( 'doesn\'t allow illegal characters in subtype', function() {

                const contentType = new ContentType();
                contentType.type = 'type';
                contentType.subtype = '@subtype';

                expect( () => contentType.format() )
                    .toThrow( '@subtype is not a valid subtype' );

            } );

            it( 'doesn\'t allow illegal characters in parameter names', function() {

                const contentType = new ContentType();
                contentType.type = 'type';
                contentType.subtype = 'subtype';
                contentType.parameters = { '@name': 'value' };

                expect( () => contentType.format() )
                    .toThrow( '@name is not a valid parameter name' );

            } );

            it( 'doesn\'t allow illegal parameter values', function() {

                const contentType = new ContentType();
                contentType.type = 'type';
                contentType.subtype = 'subtype';
                contentType.parameters = { name: '\x00value' };

                expect( () => contentType.format() )
                    .toThrow( '\x00value is not a valid parameter value' );

            } );

        } );

    } );

    describe( '#toString', function() {
        
        it( 'stringifies a content type', function() {

            const contentType = new ContentType( 'text/html; charset=utf-8; foo=bar' );
            
            expect( contentType.toString() )
                .toEqual( 'text/html; charset=utf-8; foo=bar' );
                

        } );

    } );

    describe( 'parse static method', function() {

        it( 'parses to a contentType instance', function() {

            const contentType = ContentType.parse( 'text/html; charset=utf-8; foo=bar' );
            
            expect( contentType ).toInclude( {
                type: 'text',
                subtype: 'html',
                parameters: { charset: 'utf-8', foo: 'bar' },
                charset: 'utf-8',
                mediaType: 'text/html',
            } );
                

        } );

        it( 'passes though a contentType instance', function() {

            const contentType = new ContentType();
            const result = ContentType.parse( contentType );
            expect( contentType ).toBe( result );

        } );


    } );

    describe( 'format static method', function() {

        it( 'stringifies a content type', function() {

            const contentType = new ContentType( 'text/html; charset=utf-8; foo=bar' );
            
            expect( ContentType.format( contentType ) )
                .toEqual( 'text/html; charset=utf-8; foo=bar' );
                

        } );

        it( 'stringifies an object', function() {

            expect( ContentType.format( {
                type: 'text',
                subtype: 'html',
                parameters: { foo: 'bar' },
            } ) )
                .toEqual( 'text/html; foo=bar' );
                

        } );

        it( 'stringifies an object with mediaType', function() {

            expect( ContentType.format( {
                mediaType: 'text/html',
            } ) )
                .toEqual( 'text/html' );
                

        } );

        it( 'uses type and subtype in preference to media type', function() {

            expect( ContentType.format( {
                type: 'text',
                subtype: 'html',
                mediaType: 'image/gif',
            } ) )
                .toEqual( 'text/html' );
                

        } );

        it( 'uses charset in preference to parameters', function() {

            expect( ContentType.format( {
                type: 'text',
                subtype: 'html',
                parameters: { charset: 'uft-8' },
                charset: 'iso-8859-8',
            } ) )
                .toEqual( 'text/html; charset=iso-8859-8' );
                

        } );

    } );
    

} );