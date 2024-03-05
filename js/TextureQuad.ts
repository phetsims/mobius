// Copyright 2019-2024, University of Colorado Boulder

/**
 * Creates a quad for a given texture with a specific width and height, in the 3d space
 * with x: [0,width] and y: [0,height].
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import merge from '../../phet-core/js/merge.js';
import mobius from './mobius.js';
import Quad from './Quad.js';
import Disposable from '../../axon/js/Disposable.js';
import { TReadOnlyEmitter } from '../../axon/js/TEmitter.js';

export default class TextureQuad extends THREE.Mesh {

  private readonly quadGeometry: Quad;
  private readonly basicMaterial: THREE.MeshBasicMaterial;
  private textureQuadWidth: number;
  private textureQuadHeight: number;

  private disposable = new Disposable();
  public disposeEmitter: TReadOnlyEmitter;

  public constructor( texture: THREE.Texture, width: number, height: number, materialOptions?: THREE.MaterialParameters ) {

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
      // TODO: using "combineOptions" here says this isn't a known parameter. how?  https://github.com/phetsims/density-buoyancy-common/issues/95
      map: texture
    }, materialOptions ) );

    super( quadGeometry, basicMaterial );

    this.quadGeometry = quadGeometry;
    this.basicMaterial = basicMaterial;
    this.textureQuadWidth = width;
    this.textureQuadHeight = height;
    this.disposeEmitter = this.disposable.disposeEmitter;
  }

  public updateTexture( texture: THREE.Texture, width: number = this.textureQuadWidth, height: number = this.textureQuadHeight ): void {
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
  public dispose(): void {
    this.quadGeometry.dispose();
    this.basicMaterial.dispose();
    this.disposable.dispose();

    // @ts-expect-error
    super.dispose && super.dispose();
  }
}

mobius.register( 'TextureQuad', TextureQuad );
