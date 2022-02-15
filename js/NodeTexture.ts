// Copyright 2019-2021, University of Colorado Boulder

/**
 * Allows turning a Node into an updatable three.js texture.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { Display } from '../../scenery/js/imports.js';
import { Node } from '../../scenery/js/imports.js';
import mobius from './mobius.js';

class NodeTexture extends THREE.Texture {

  private _display: Display;
  private _scene: Node;

  _width: number;
  _height: number;

  constructor( node: Node, width: number, height: number ) {
    const scene = new Node( {
      renderer: 'canvas',
      preventFit: true
    } );
    scene.addChild( node );
    const display = new Display( scene, {
      width: width,
      height: height,
      accessibility: false
    } );
    display.updateDisplay();

    const canvas = display._rootBackbone.blocks[ 0 ].canvas;

    super( canvas );

    this._display = display;
    this._scene = scene;
    this._width = width;
    this._height = height;

    // tells three.js that the texture needs an update
    this.needsUpdate = true;
  }

  /**
   * Updates the node's appearance in the texture.
   */
  update() {
    this._display.updateDisplay();
    this.needsUpdate = true;
  }

  /**
   * Releases references.
   */
  dispose() {
    this._display.dispose();
    this._scene.dispose();

    super.dispose();
  }
}

mobius.register( 'NodeTexture', NodeTexture );
export default NodeTexture;