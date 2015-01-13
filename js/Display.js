// Copyright 2002-2014, University of Colorado

/**
 * Main 3-D display
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

define( function( require ) {
  'use strict';

  var inherit = require( 'PHET_CORE/inherit' );
  var mobius = require( 'MOBIUS/mobius' );

  var Display = mobius.Display = function Display( options ) {
    options = _.extend( {
      width: 512,
      height: 512
    }, options );

    this.canvas = document.createElement( 'canvas' );

    this.gl = null;
    try {
      this.gl = this.gl = this.canvas.getContext( 'webgl' ) || this.canvas.getContext( 'experimental-webgl' );
      // TODO: check for required extensions
    }
    catch( e ) {
      // TODO: handle gracefully
      throw e;
    }
    if ( !this.gl ) {
      throw new Error( 'Unable to load WebGL' );
    }

    this.currentProgram = null; // {MOBIUS/ShaderProgram}

    this.gl.clearColor( 0.0, 0.0, 0.0, 0.0 );

    this.gl.enable( this.gl.DEPTH_TEST );
    this.gl.enable( this.gl.BLEND );
    this.gl.blendFunc( this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA );

    this.setSize( options.width, options.height );
  };

  return inherit( Object, Display, {
    switchToProgram: function( program ) {
      if ( program !== this.currentProgram ) {
        this.currentProgram && this.currentProgram.unuse();
        program.use();

        this.currentProgram = program;
      }
    },

    setSize: function( width, height ) {
      if ( width !== this.canvas.width || height !== this.canvas.height ) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport( 0, 0, width, height );
      }
    }
  } );
} );
