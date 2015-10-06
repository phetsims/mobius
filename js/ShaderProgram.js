// Copyright 2002-2015, University of Colorado Boulder

/**
 * Abstraction over the shader program
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

define( function( require ) {
  'use strict';

  var inherit = require( 'PHET_CORE/inherit' );
  var mobius = require( 'MOBIUS/mobius' );
  var Util = require( 'MOBIUS/Util' );

  var ShaderProgram = mobius.ShaderProgram = function ShaderProgram( gl, vertexSource, fragmentSource, attributeNames, uniformNames ) {
    // store parameters so that we can recreate the shader program on context loss
    this.vertexSource = vertexSource;
    this.fragmentSource = fragmentSource;
    this.attributeNames = attributeNames;
    this.uniformNames = uniformNames;

    this.initialize( gl );
  };

  return inherit( Object, ShaderProgram, {
    // initializes (or reinitializes) the WebGL state and uniform/attribute references.
    initialize: function( gl ) {
      var self = this;
      this.gl = gl; // TODO: create them with separate contexts

      this.used = false;

      this.program = this.gl.createProgram();

      this.vertexShader = Util.createShader( this.gl, this.vertexSource, this.gl.VERTEX_SHADER );
      this.fragmentShader = Util.createShader( this.gl, this.fragmentSource, this.gl.FRAGMENT_SHADER );

      this.gl.attachShader( this.program, this.vertexShader );
      this.gl.attachShader( this.program, this.fragmentShader );

      this.gl.linkProgram( this.program );

      if ( !this.gl.getProgramParameter( this.program, this.gl.LINK_STATUS ) ) {
        console.log( this.gl.getProgramInfoLog( this.program ) );
        console.log( this.vertexSource );
        console.log( this.fragmentSource );
        throw new Error( 'GLSL link error: ' + this.gl.getProgramInfoLog( this.program ) + '\n for vertex shader:\n' + this.vertexSource + '\n\n for fragment shader:\n' + this.fragmentSource );
      }

      // clean these up, they aren't needed after the link
      this.gl.deleteShader( this.vertexShader );
      this.gl.deleteShader( this.fragmentShader );

      this.uniformLocations = {}; // map name => uniform location for program
      this.attributeLocations = {}; // map name => attribute location for program
      this.activeAttributes = {}; // map name => boolean (enabled)

      _.each( this.attributeNames, function( attributeName ) {
        self.attributeLocations[ attributeName ] = self.gl.getAttribLocation( self.program, attributeName );
        self.activeAttributes[ attributeName ] = true; // default to enabled
      } );
      _.each( this.uniformNames, function( uniformName ) {
        self.uniformLocations[ uniformName ] = self.gl.getUniformLocation( self.program, uniformName );
      } );

      this.isInitialized = true;
    },

    use: function() {
      if ( this.used ) { return; }

      var self = this;

      this.used = true;

      this.gl.useProgram( this.program );

      // enable the active attributes
      _.each( this.attributeNames, function( attributeName ) {
        if ( self.activeAttributes[ attributeName ] ) {
          self.gl.enableVertexAttribArray( self.attributeLocations[ attributeName ] );
        }
      } );
    },

    unuse: function() {
      if ( !this.used ) { return; }

      var self = this;

      this.used = false;

      _.each( this.attributeNames, function( attributeName ) {
        if ( self.activeAttributes[ attributeName ] ) {
          self.gl.disableVertexAttribArray( self.attributeLocations[ attributeName ] );
        }
      } );
    },

    activateAttribute: function( name ) {
      // guarded so we don't enable twice
      if ( !this.activeAttributes[ name ] ) {
        this.activeAttributes[ name ] = true;

        if ( this.used ) {
          this.gl.enableVertexAttribArray( this.attributeLocations[ name ] );
        }
      }
    },

    deactivateAttribute: function( name ) {
      // guarded so we don't disable twice
      if ( this.activeAttributes[ name ] ) {
        this.activeAttributes[ name ] = false;

        if ( this.used ) {
          this.gl.disableVertexAttribArray( this.attributeLocations[ name ] );
        }
      }
    },

    dispose: function() {
      this.gl.deleteProgram( this.program );
    }
  } );
} );
