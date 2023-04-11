// Copyright 2019-2023, University of Colorado Boulder

/**
 * Shows three.js content with isometric scaling that takes up the entire viewport in a high-performance way.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Property from '../../axon/js/Property.js';
import Bounds2 from '../../dot/js/Bounds2.js';
import Matrix3 from '../../dot/js/Matrix3.js';
import optionize from '../../phet-core/js/optionize.js';
import { DOM, Node, NodeOptions, Rectangle } from '../../scenery/js/imports.js';
import MobiusQueryParameters from './MobiusQueryParameters.js';
import ThreeStage, { ThreeStageOptions } from './ThreeStage.js';
import mobius from './mobius.js';
import TReadOnlyProperty from '../../axon/js/TReadOnlyProperty.js';
import Vector2 from '../../dot/js/Vector2.js';
import Vector3 from '../../dot/js/Vector3.js';
import Ray3 from '../../dot/js/Ray3.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';

type MouseHitListener = ( point: Vector2 ) => PhetioObject | null;

type SelfOptions = {
  parentMatrixProperty?: TReadOnlyProperty<Matrix3>;
  fov?: number;
  getPhetioMouseHit?: MouseHitListener | null;
};

export type ThreeIsometricNodeOptions = SelfOptions & ThreeStageOptions & NodeOptions;

export default class ThreeIsometricNode extends Node {

  private layoutBounds: Bounds2;
  private _getPhetioMouseHit: MouseHitListener | null;
  public readonly stage: ThreeStage;
  private parentMatrixProperty: TReadOnlyProperty<Matrix3>;

  // our target for drags that don't hit other UI components
  public readonly backgroundEventTarget: Rectangle;

  private domNode!: DOM;
  private viewOffsetListener: () => void;

  public constructor( layoutBounds: Bounds2, providedOptions?: ThreeIsometricNodeOptions ) {

    const options = optionize<ThreeIsometricNodeOptions, SelfOptions, ThreeStageOptions & NodeOptions>()( {
      parentMatrixProperty: new Property( Matrix3.IDENTITY ),

      fov: 50,
      // positioned or transformed pixels, or full scenery-transformed?
      // can use https://threejs.org/docs/#api/en/cameras/PerspectiveCamera.setViewOffset to handle sub-pixel stuff?

      // Use method-based interaction to control positioning. Or set up the scenery default if listeners are needed.

      // FOV auto-control on layout?

      getPhetioMouseHit: null // (point:Vector2)=>PhetioObject, for studio autoselect
    }, providedOptions );

    super();

    this.layoutBounds = layoutBounds;
    this._getPhetioMouseHit = options.getPhetioMouseHit;

    this.stage = new ThreeStage( options );

    this.stage.threeCamera.fov = options.fov;
    this.stage.threeCamera.aspect = this.layoutBounds.width / this.layoutBounds.height;

    this.parentMatrixProperty = options.parentMatrixProperty;

    this.backgroundEventTarget = new Rectangle( {} );
    this.addChild( this.backgroundEventTarget );

    // Handle fallback for when we don't have WebGL, see https://github.com/phetsims/density/issues/105
    if ( this.stage.threeRenderer ) {
      // add the Canvas in with a DOM node that prevents Scenery from applying transformations on it
      this.domNode = new DOM( this.stage.threeRenderer.domElement, {
        preventTransform: true, // Scenery override for transformation
        pickable: false
      } );

      // don't do bounds detection, it's too expensive. We're not pickable anyways
      this.domNode.invalidateDOM = () => this.domNode.invalidateSelf( new Bounds2( 0, 0, 0, 0 ) );
      this.domNode.invalidateDOM();

      // support Scenery/Joist 0.2 screenshot (takes extra work to output)
      this.domNode.renderToCanvasSelf = ( wrapper, matrix ) => {
        const context = wrapper.context;

        // Guaranteed to be affine, 1:1 aspect ratio and axis-aligned
        const scale = matrix.timesMatrix( this.getUniqueTrail().getMatrix().inverted() ).m00();
        const canvas = this.stage.renderToCanvas( MobiusQueryParameters.mobiusCanvasSupersampling, scale );

        context.save();

        context.setTransform( 1, 0, 0, -1, 0, canvas.height ); // no need to take pixel scaling into account

        context.drawImage( canvas, 0, 0 );
        context.restore();
      };

      this.addChild( this.domNode );
    }

    // Ideally should be called whenever the parent/screenView matrix is changed, or any camera
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

  // for studio autoselect
  public override getPhetioMouseHit( point: Vector2 ): PhetioObject | null {
    if ( this._getPhetioMouseHit && this.isPhetioMouseHittable( point ) ) {
      return this._getPhetioMouseHit( point );
    }
    else {
      return super.getPhetioMouseHit( point );
    }
  }

  /**
   * Projects a 3d point in the global coordinate frame to one within the 2d global coordinate frame.
   */
  public projectPoint( point: Vector3 ): Vector2 {
    return this.stage.projectPoint( point );
  }

  /**
   * Given a screen point, returns a 3D ray representing the camera's position and direction that point would be in the
   * 3D scene.
   */
  public getRayFromScreenPoint( globalScreenPoint: Vector2 ): Ray3 {
    return this.stage.getRayFromScreenPoint( globalScreenPoint );
  }

  public layout( width: number, height: number ): void {
    // We need to lay out things for window dimensions so we don't overly resize, see
    // https://github.com/phetsims/density/issues/50. For this we'll actually take up the full window, and adjust things
    // using adjustViewOffset to handle both the isometric scaling AND pan/zoom. This is necessary so that the navbar
    // doesn't throw off layout. This may come with a bit of performance cost, since we do typically have some of the
    // canvas hidden by the navigation bar, but the lack of resizes on any pan/zoom presumably makes up for it in
    // usability.

    if ( _.hasIn( window, 'phet.joist.sim' ) ) {
      const simDimensions = phet.joist.sim.dimensionProperty.value; // eslint-disable-line bad-phet-library-text
      width = simDimensions.width;
      height = simDimensions.height;
    }

    this.stage.setDimensions( width, height );

    this.backgroundEventTarget.setRectBounds( this.globalToLocalBounds( new Bounds2( 0, 0, width, height ) ) );

    // field of view (FOV) computation for the isometric view scaling we use
    const sx = width / this.layoutBounds.width;
    const sy = height / this.layoutBounds.height;
    if ( sx !== 0 && sy !== 0 ) {

      this.stage.activeScale = sy > sx ? sx : sy;

      this.viewOffsetListener();

      if ( this.stage.threeRenderer ) {
        this.domNode.invalidateDOM();
      }
    }
  }

  /**
   * Renders the simulation to a specific rendering target
   *
   * @param target - undefined for the default target
   */
  public render( target: THREE.WebGLRenderTarget | undefined ): void {
    this.stage.render( target );
  }

  /**
   * Releases references.
   */
  public override dispose(): void {
    this.parentMatrixProperty.unlink( this.viewOffsetListener );

    super.dispose();

    this.stage.dispose();
  }
}

mobius.register( 'ThreeIsometricNode', ThreeIsometricNode );
