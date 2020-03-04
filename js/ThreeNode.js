// Copyright 2019-2020, University of Colorado Boulder

/**
 * Shows three.js content within a rectangle, displayed to be inside of a rectangle in arbitrary places in the scene
 * graph.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Bounds2 from '../../dot/js/Bounds2.js';
import Matrix3 from '../../dot/js/Matrix3.js';
import Vector2 from '../../dot/js/Vector2.js';
import Vector2Property from '../../dot/js/Vector2Property.js';
import merge from '../../phet-core/js/merge.js';
import DOM from '../../scenery/js/nodes/DOM.js';
import Node from '../../scenery/js/nodes/Node.js';
import Rectangle from '../../scenery/js/nodes/Rectangle.js';
import Utils from '../../scenery/js/util/Utils.js';
import mobius from './mobius.js';
import ThreeStage from './ThreeStage.js';

class ThreeNode extends Node {
  /**
   * @param {number} width
   * @param {number} height
   * @param {Object} [options]
   */
  constructor( width, height, options ) {

    options = merge( {
      fov: 50

      // positioned or transformed pixels, or full scenery-transformed?
      // can use https://threejs.org/docs/#api/en/cameras/PerspectiveCamera.setViewOffset to handle sub-pixel stuff?
    }, options );

    super();

    // @public {ThreeStage}
    this.stage = new ThreeStage( options );

    // @private {number}
    this.layoutWidth = width;
    this.layoutHeight = height;

    // @private {boolean}
    this.applyClip = options.applyClip;

    // static camera properties
    this.stage.threeCamera.fov = options.fov;
    this.stage.threeCamera.aspect = width / height;

    // @private {Property.<Vector2>}
    this.offsetProperty = new Vector2Property( Vector2.ZERO );

    // @public {Node} - our target for drags that don't hit other UI components
    this.backgroundEventTarget = new Rectangle( 0, 0, width, height );
    this.addChild( this.backgroundEventTarget );

    // @private add the Canvas in with a DOM node that prevents Scenery from applying transformations on it
    this.domNode = new DOM( this.stage.threeRenderer.domElement, {
      preventTransform: true, // Scenery override for transformation
      pickable: false
    } );
    this.domNode.calculateDOMBounds = () => new Bounds2( 0, 0, 0, 0 );
    this.domNode.invalidateDOM();

    const forceAcceleration = false;
    const offsetMatrix = new Matrix3();
    Utils.prepareForTransform( this.stage.threeRenderer.domElement, forceAcceleration );
    this.offsetProperty.link( offset => {
      offsetMatrix.setToTranslation( offset.x, offset.y );
      Utils.applyPreparedTransform( offsetMatrix, this.stage.threeRenderer.domElement, forceAcceleration );
    } );

    // support Scenery/Joist 0.2 screenshot (takes extra work to output)
    this.domNode.renderToCanvasSelf = wrapper => {
      const canvas = this.stage.renderToCanvas();

      const context = wrapper.context;
      context.save();

      context.setTransform( 1, 0, this.offsetProperty.value.x, -1, 0, this.stage.canvasHeight + this.offsetProperty.value.y ); // no need to take pixel scaling into account

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
   */
  layout() {
    const globalBounds = this.localToGlobalBounds( this.backgroundEventTarget.bounds );
    const roundedBounds = globalBounds.roundedOut();

    this.stage.setDimensions( roundedBounds.width, roundedBounds.height );
    this.offsetProperty.value = roundedBounds.leftTop;

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

mobius.register( 'ThreeNode', ThreeNode );
export default ThreeNode;