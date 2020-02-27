// Copyright 2019, University of Colorado Boulder

/**
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import mobius from './mobius.js';
import Quad from './Quad.js';

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

mobius.register( 'TextureQuad', TextureQuad );
export default TextureQuad;