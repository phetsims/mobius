// Copyright 2019-2021, University of Colorado Boulder

/**
 * Creates a quad for a given texture with a specific width and height, in the 3d space
 * with x: [0,width] and y: [0,height].
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import merge from '../../phet-core/js/merge.js';
import mobius from './mobius.js';
import Quad from './Quad.js';

class TextureQuad extends THREE.Mesh {

  quadGeometry: Quad;
  basicMaterial: THREE.MeshBasicMaterial;
  textureQuadWidth: number;
  textureQuadHeight: number;

  constructor( texture: THREE.Texture, width: number, height: number, materialOptions?: THREE.MaterialParameters ) {

    const quadGeometry = new Quad(
      0, 0, 0,
      width, 0, 0,
      width, height, 0,
      0, height, 0,
      0, 0, 1
    );

    const basicMaterial = new THREE.MeshBasicMaterial( merge( {
      transparent: true,
      depthTest: false,
      map: texture
    }, materialOptions ) );

    super( quadGeometry, basicMaterial );

    this.quadGeometry = quadGeometry;
    this.basicMaterial = basicMaterial;
    this.textureQuadWidth = width;
    this.textureQuadHeight = height;
  }

  updateTexture( texture: THREE.Texture, width: number = this.textureQuadWidth, height: number = this.textureQuadHeight ) {
    this.basicMaterial.map = texture;
    this.basicMaterial.needsUpdate = true;

    if ( width !== this.textureQuadWidth || height !== this.textureQuadHeight ) {
      this.textureQuadWidth = width;
      this.textureQuadHeight = height;

      this.quadGeometry.set(
        0, 0, 0,
        width, 0, 0,
        width, height, 0,
        0, height, 0,
        0, 0, 1 );
    }
  }

  /**
   * Releases references
   */
  dispose() {
    this.quadGeometry.dispose();
    this.basicMaterial.dispose();

    // @ts-ignore
    super.dispose && super.dispose();
  }
}

mobius.register( 'TextureQuad', TextureQuad );
export default TextureQuad;