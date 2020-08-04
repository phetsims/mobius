// Copyright 2019-2020, University of Colorado Boulder

/**
 * Creates a quad for a given texture with a specific width and height, in the 3d space
 * with x: [0,width] and y: [0,height].
 *
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

    const basicMaterial = new THREE.MeshBasicMaterial( {
      transparent: true,
      depthTest: false,
      map: texture
    } );

    super( quadGeometry, basicMaterial );

    // @private {Quad}
    this.quadGeometry = quadGeometry;

    // @private {Material}
    this.basicMaterial = basicMaterial;
  }

  /**
   * Releases references
   * @public
   */
  dispose() {
    this.quadGeometry.dispose();
    this.basicMaterial.dispose();

    super.dispose && super.dispose();
  }
}

mobius.register( 'TextureQuad', TextureQuad );
export default TextureQuad;