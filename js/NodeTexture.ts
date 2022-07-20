// Copyright 2019-2022, University of Colorado Boulder

/**
 * Allows turning a Node into an updatable three.js texture.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { Display, Node } from '../../scenery/js/imports.js';
import mobius from './mobius.js';

export default class NodeTexture extends THREE.Texture {

  private _display: Display;
  private _scene: Node;

  public _width: number;
  public _height: number;

  public constructor( node: Node, width: number, height: number ) {
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

    const canvas = display.rootBackbone.blocks[ 0 ].canvas;

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
  public update(): void {
    this._display.updateDisplay();
    this.needsUpdate = true;
  }

  /**
   * Releases references.
   */
  public override dispose(): void {
    this._display.dispose();
    this._scene.dispose();

    super.dispose();
  }
}

mobius.register( 'NodeTexture', NodeTexture );
