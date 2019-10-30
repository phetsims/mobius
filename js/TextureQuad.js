// Copyright 2019, University of Colorado Boulder

/**
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
define( require => {
  'use strict';

  // modules
  const mobius = require( 'MOBIUS/mobius' );
  const Quad = require( 'MOBIUS/Quad' );

  class TextureQuad extends THREE.Mesh {
    /**
     * @param {THREE.Texture} texture
     * @param {number} width
     * @param {number} height
     */
    constructor( texture, width, height ) {

      const quadGeometry = new Quad(
        0, 0, 0,
        width, 0, 0,
        width, height, 0,
        0, height, 0,
        0, 0, 1
      );

      super( quadGeometry, new THREE.MeshBasicMaterial( {
        transparent: true,
        depthTest: false,
        map: texture
      } ) );
    }
  }

  return mobius.register( 'TextureQuad', TextureQuad );
} );
