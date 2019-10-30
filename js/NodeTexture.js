// Copyright 2019, University of Colorado Boulder

/**
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
define( require => {
  'use strict';

  // modules
  const Display = require( 'SCENERY/display/Display' );
  const mobius = require( 'MOBIUS/mobius' );
  const Node = require( 'SCENERY/nodes/Node' );

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

      // TODO: don't use this level of hack
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

  return mobius.register( 'NodeTexture', NodeTexture );
} );
