// Copyright 2002-2014, University of Colorado

/**
 * Utility functions
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

define( function( require ) {
  'use strict';

  var mobius = require( 'MOBIUS/mobius' );

  mobius.Util = {
    /*
     * @param type should be: gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
     * @param source {String}, the shader source code.
     */
    createShader: function( gl, source, type ) {
      var shader = gl.createShader( type );
      gl.shaderSource( shader, source );
      gl.compileShader( shader );

      if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
        console.log( gl.getShaderInfoLog( shader ) );
        console.log( source );
        throw new Error( 'GLSL compile error: ' + gl.getShaderInfoLog( shader ) );
      }

      return shader;
    },

    getShaderFromDOM: function( gl, id ) {
      var shaderScript = document.getElementById( id );
      if ( !shaderScript ) {
        throw new Error( "shader DOM not found: for id=" + id );
      }

      var str = "";
      var k = shaderScript.firstChild;
      while ( k ) {
        if ( k.nodeType === 3 ) {
          str += k.textContent;
        }
        k = k.nextSibling;
      }

      var shader;
      if ( shaderScript.type === "x-shader/x-fragment" ) {
        shader = gl.createShader( gl.FRAGMENT_SHADER );
      }
      else if ( shaderScript.type === "x-shader/x-vertex" ) {
        shader = gl.createShader( gl.VERTEX_SHADER );
      }
      else {
        throw new Error( "shader DOM type not recognized: " + shaderScript.type );
      }

      gl.shaderSource( shader, str );
      gl.compileShader( shader );

      if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
        throw new Error( gl.getShaderInfoLog( shader ) );
      }

      return shader;
    },

    toPowerOf2: function( n ) {
      var result = 1;
      while ( result < n ) {
        result *= 2;
      }
      return result;
    },

    isPowerOf2: function( n ) {
      return n === mobius.Util.toPowerOf2( n );
    },

    initWebGL: function( canvas ) {
      // Initialize the global variable gl to null.
      var gl = null;

      try {
        // Try to grab the standard context. If it fails, fallback to experimental.
        gl = canvas.getContext( "webgl" ) || canvas.getContext( "experimental-webgl" );
      }
      catch( e ) {}

      // If we don't have a GL context, give up now
      if ( !gl ) {
        // TODO: show a visual display
        throw new Error( "Unable to initialize WebGL. Your browser may not support it." );
      }

      return gl;
    }
  };

  return mobius.Util;
} );


