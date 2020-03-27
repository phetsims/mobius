// Copyright 2019-2020, University of Colorado Boulder

/**
 * Shows three.js content with isometric scaling that takes up the entire viewport in a high-performance way.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Bounds2 from '../../dot/js/Bounds2.js';
import merge from '../../phet-core/js/merge.js';
import DOM from '../../scenery/js/nodes/DOM.js';
import Node from '../../scenery/js/nodes/Node.js';
import Rectangle from '../../scenery/js/nodes/Rectangle.js';
import mobius from './mobius.js';
import ThreeStage from './ThreeStage.js';

class ThreeIsometricNode extends Node {
  /**
   * @param {Bounds2} layoutBounds
   * @param {Object} [options]
   */
  constructor( layoutBounds, options ) {

    options = merge( {
      fov: 50
      // positioned or transformed pixels, or full scenery-transformed?
      // can use https://threejs.org/docs/#api/en/cameras/PerspectiveCamera.setViewOffset to handle sub-pixel stuff?

      // Use method-based interaction to control positioning. Or set up the scenery default if listeners are needed.

      // FOV auto-control on layout?
    }, options );

    super();

    // @public {ThreeStage}
    this.stage = new ThreeStage( options );

    // @private {number}
    this.fov = options.fov;

    // @private {Bounds2}
    this.layoutBounds = layoutBounds;

    // @public {Node} - our target for drags that don't hit other UI components
    this.backgroundEventTarget = new Rectangle( {} );
    this.addChild( this.backgroundEventTarget );

    // @private add the Canvas in with a DOM node that prevents Scenery from applying transformations on it
    this.domNode = new DOM( this.stage.threeRenderer.domElement, {
      preventTransform: true, // Scenery override for transformation
      invalidateDOM: function() { // don't do bounds detection, it's too expensive. We're not pickable anyways
        this.invalidateSelf( new Bounds2( 0, 0, 0, 0 ) );
      },
      pickable: false
    } );
    this.domNode.invalidateDOM();

    /**
     // Apply CSS needed for future CSS transforms to work properly.
     scenery.Utils.prepareForTransform( this.domElement, this.forceAcceleration );
     scenery.Utils.applyPreparedTransform( this.getTransformMatrix(), this.domElement, this.forceAcceleration );
     */

    // support Scenery/Joist 0.2 screenshot (takes extra work to output)
    this.domNode.renderToCanvasSelf = wrapper => {
      const canvas = this.stage.renderToCanvas( 3 );

      const context = wrapper.context;
      context.save();

      context.setTransform( 1, 0, 0, -1, 0, this.stage.canvasHeight ); // no need to take pixel scaling into account

      context.drawImage( canvas, 0, 0 );
      context.restore();
    };

    this.addChild( this.domNode );

    this.mutate( options );
  }

  /**
   * Projects a 3d point in the global coordinate frame to one within the 2d global coordinate frame.
   * @public
   *
   * @param {Vector3} point
   * @returns {Vector2}
   */
  projectPoint( point ) {
    return this.stage.projectPoint( point );
  }

  /**
   * Given a screen point, returns a 3D ray representing the camera's position and direction that point would be in the
   * 3D scene.
   * @private
   *
   * @param {Vector2} screenPoint
   * @returns {Ray3}
   */
  getRayFromScreenPoint( screenPoint ) {
    return this.stage.getRayFromScreenPoint( screenPoint );
  }

  /**
   * @public
   *
   * @param {number} width
   * @param {number} height
   */
  layout( width, height ) {
    width = Math.ceil( width );
    height = Math.ceil( height );

    this.stage.setDimensions( width, height );

    this.backgroundEventTarget.setRectBounds( this.globalToLocalBounds( new Bounds2( 0, 0, width, height ) ) );

    // field of view (FOV) computation for the isometric view scaling we use
    const sx = width / this.layoutBounds.width;
    const sy = height / this.layoutBounds.height;
    if ( sx === 0 || sy === 0 ) {
      return 1;
    }

    this.stage.threeCamera.fov = ThreeStage.computeIsometricFOV( this.fov, width, height, this.layoutBounds.width, this.layoutBounds.height );
    this.stage.activeScale = sy > sx ? sx : sy;

    // aspect ratio
    this.stage.threeCamera.aspect = width / height;

    // three.js requires this to be called after changing the parameters
    this.stage.threeCamera.updateProjectionMatrix();

    this.domNode.invalidateDOM();
  }

  /**
   * Renders the simulation to a specific rendering target
   * @public
   *
   * @param {THREE.WebGLRenderTarget|undefined} - undefined for the default target
   */
  render( target ) {
    this.stage.render( target );
  }

  /**
   * Releases references.
   * @public
   * @override
   */
  dispose() {
    super.dispose();

    this.stage.dispose();
  }
}

mobius.register( 'ThreeIsometricNode', ThreeIsometricNode );
export default ThreeIsometricNode;