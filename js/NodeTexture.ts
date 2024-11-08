// Copyright 2019-2024, University of Colorado Boulder

/**
 * Allows turning a Node into an updatable three.js texture.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Disposable from '../../axon/js/Disposable.js';
import assertMutuallyExclusiveOptions from '../../phet-core/js/assertMutuallyExclusiveOptions.js';
import optionize from '../../phet-core/js/optionize.js';
import { Display, Node, Utils } from '../../scenery/js/imports.js';
import mobius from './mobius.js';

type NodeTextureOptions = {
  width?: number;
  height?: number;
  calculateDimensionFromNode?: boolean;
};

const toClosestPowerOf2 = ( size: number ): number => {

  // closest power of 2 is vital for GPU rendering
  return Utils.toPowerOf2( Math.ceil( size ) );
};

export default class NodeTexture extends THREE.Texture {

  private _display: Display;
  private _scene: Node;

  // This can be mutated as the provided node's dimension changes, see calculateDimensionFromNode
  public _width: number;
  public _height: number;

  private disposable = new Disposable();

  public constructor( node: Node, providedOptions?: NodeTextureOptions ) {

    assert && assertMutuallyExclusiveOptions( providedOptions, [ 'width', 'height' ], [ 'calculateDimensionFromNode' ] );

    const options = optionize<NodeTextureOptions>()( {
      width: -1,
      height: -1,
      calculateDimensionFromNode: false
    }, providedOptions );

    if ( options.calculateDimensionFromNode ) {
      options.width = toClosestPowerOf2( node.width );
      options.height = toClosestPowerOf2( node.height );
    }
    else {
      assert && assert( options.width > 0 && options.height > 0, 'specify width/height or calculate from node directly' );
    }

    const scene = new Node( {
      renderer: 'canvas',
      preventFit: true
    } );
    scene.addChild( node );
    const display = new Display( scene, {
      width: options.width,
      height: options.height,
      accessibility: false
    } );
    display.updateDisplay();

    const canvas = display.rootBackbone.blocks[ 0 ].canvas;

    super( canvas );

    this._display = display;
    this._scene = scene;
    this._width = options.width;
    this._height = options.height;

    this.disposable.disposeEmitter.addListener( () => {
      this._display.dispose();
      this._scene.dispose();
    } );

    if ( options.calculateDimensionFromNode ) {
      const listener = () => {
        const newWidth = toClosestPowerOf2( node.width );
        const newHeight = toClosestPowerOf2( node.height );
        this._display.setWidthHeight( newWidth, newHeight );
        this._width = newWidth;
        this._height = newHeight;
      };
      node.localBoundsProperty.link( listener );
      this.disposable.disposeEmitter.addListener( () => {
        node.localBoundsProperty.unlink( listener );
      } );
    }

    // tells three.js that the texture needs an update
    this.needsUpdate = true;
  }

  /**
   * Updates the node's appearance in the texture.
   */
  public update(): void {
    this._display.updateDisplay();
    this.needsUpdate = true;
  }

  /**
   * Releases references.
   */
  public override dispose(): void {
    this.disposable.dispose();

    super.dispose();
  }
}

mobius.register( 'NodeTexture', NodeTexture );