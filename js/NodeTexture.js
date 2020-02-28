// Copyright 2019-2020, University of Colorado Boulder

/**
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Display from '../../scenery/js/display/Display.js';
import Node from '../../scenery/js/nodes/Node.js';
import mobius from './mobius.js';

class NodeTexture extends THREE.Texture {
  /**
   * @param {Node} node
   * @param {number} width
   * @param {number} height
   */
  constructor( node, width, height ) {
    const scene = new Node( {
      renderer: 'canvas'
    } );
    scene.addChild( node );
    const display = new Display( scene, {
      width: width,
      height: height
    } );
    display.updateDisplay();

    const canvas = display._rootBackbone.blocks[ 0 ].canvas;

    super( canvas );

    // @private {Display}
    this._display = display;

    // @private {Node}
    this._scene = scene;

    this.needsUpdate = true;
  }

  /**
   * Updates the node's appearance in the texture.
   * @public
   */
  update() {
    this._display.updateDisplay();
    this.needsUpdate = true;
  }

  /**
   * Releases references.
   * @public
   */
  dispose() {
    this._display.dispose();
    this._scene.dispose();

    super.dispose();
  }
}

mobius.register( 'NodeTexture', NodeTexture );
export default NodeTexture;