// Copyright 2019-2021, University of Colorado Boulder

/**
 * Shows three.js content with isometric scaling that takes up the entire viewport in a high-performance way.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Property from '../../axon/js/Property.js';
import Bounds2 from '../../dot/js/Bounds2.js';
import Matrix3 from '../../dot/js/Matrix3.js';
import merge from '../../phet-core/js/merge.js';
import DOM from '../../scenery/js/nodes/DOM.js';
import Node from '../../scenery/js/nodes/Node.js';
import Rectangle from '../../scenery/js/nodes/Rectangle.js';
import Utils from '../../scenery/js/util/Utils.js';
import ThreeStage from './ThreeStage.js';
import mobius from './mobius.js';

class ThreeIsometricNode extends Node {
  /**
   * @param {Bounds2} layoutBounds
   * @param {Object} [options]
   */
  constructor( layoutBounds, options ) {

    options = merge( {
      // {Property.<Matrix3>}
      parentMatrixProperty: new Property( Matrix3.IDENTITY ),

      fov: 50
      // positioned or transformed pixels, or full scenery-transformed?
      // can use https://threejs.org/docs/#api/en/cameras/PerspectiveCamera.setViewOffset to handle sub-pixel stuff?

      // Use method-based interaction to control positioning. Or set up the scenery default if listeners are needed.

      // FOV auto-control on layout?
    }, options );

    super();

    // @private {Bounds2}
    this.layoutBounds = layoutBounds;

    // @public {ThreeStage}
    this.stage = new ThreeStage( options );

    this.stage.threeCamera.fov = options.fov;
    this.stage.threeCamera.aspect = this.layoutBounds.width / this.layoutBounds.height;

    // @private {Property.<Matrix3>}
    this.parentMatrixProperty = options.parentMatrixProperty;

    // @public {Node} - our target for drags that don't hit other UI components
    this.backgroundEventTarget = new Rectangle( {} );
    this.addChild( this.backgroundEventTarget );

    // @private {DOM} - add the Canvas in with a DOM node that prevents Scenery from applying transformations on it
    this.domNode = new DOM( this.stage.threeRenderer.domElement, {
      preventTransform: true, // Scenery override for transformation
      pickable: false
    } );

    // don't do bounds detection, it's too expensive. We're not pickable anyways
    this.domNode.invalidateDOM = () => this.domNode.invalidateSelf( new Bounds2( 0, 0, 0, 0 ) );
    this.domNode.invalidateDOM();

    // support Scenery/Joist 0.2 screenshot (takes extra work to output)
    this.domNode.renderToCanvasSelf = wrapper => {
      const context = wrapper.context;
      const canvas = this.stage.renderToCanvas( 3, Utils.backingScale( context ) );

      context.save();

      context.setTransform( 1, 0, 0, -1, 0, canvas.height ); // no need to take pixel scaling into account

      context.drawImage( canvas, 0, 0 );
      context.restore();
    };

    this.addChild( this.domNode );

    // @public {function} - Ideally should be called whenever the parent/screenView matrix is changed, or any camera
    // change (including zoom or fov).
    this.viewOffsetListener = () => {
      const screenWidth = this.stage.width;
      const screenHeight = this.stage.height;

      if ( screenWidth && screenHeight ) {
        this.stage.adjustViewOffset( this.parentToGlobalBounds( new Bounds2( 0, 0, this.layoutBounds.width, this.layoutBounds.height ) ) );
      }
    };
    this.parentMatrixProperty.lazyLink( this.viewOffsetListener );

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
   * @param {Vector2} globalScreenPoint
   * @returns {Ray3}
   */
  getRayFromScreenPoint( globalScreenPoint ) {
    return this.stage.getRayFromScreenPoint( globalScreenPoint );
  }

  /**
   * @public
   *
   * @param {number} width
   * @param {number} height
   */
  layout( width, height ) {
    // We need to lay out things for window dimensions so we don't overly resize, see
    // https://github.com/phetsims/density/issues/50. For this we'll actually take up the full window, and adjust things
    // using adjustViewOffset to handle both the isometric scaling AND pan/zoom. This is necessary so that the navbar
    // doesn't throw off layout. This may come with a bit of performance cost, since we do typically have some of the
    // canvas hidden by the navigation bar, but the lack of resizes on any pan/zoom presumably makes up for it in
    // usability.
    width = window.innerWidth;
    height = window.innerHeight;

    this.stage.setDimensions( width, height );

    this.backgroundEventTarget.setRectBounds( this.globalToLocalBounds( new Bounds2( 0, 0, width, height ) ) );

    // field of view (FOV) computation for the isometric view scaling we use
    const sx = width / this.layoutBounds.width;
    const sy = height / this.layoutBounds.height;
    if ( sx !== 0 && sy !== 0 ) {

      this.stage.activeScale = sy > sx ? sx : sy;

      this.viewOffsetListener();

      this.domNode.invalidateDOM();
    }
  }

  /**
   * Renders the simulation to a specific rendering target
   * @public
   *
   * @param {THREE.WebGLRenderTarget|undefined} target - undefined for the default target
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
    this.parentMatrixProperty.lazyLink( this.viewOffsetListener );

    super.dispose();

    this.stage.dispose();
  }
}

mobius.register( 'ThreeIsometricNode', ThreeIsometricNode );
export default ThreeIsometricNode;