// Copyright 2019-2022, University of Colorado Boulder

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
import { DOM, Node, NodeOptions, Rectangle, Utils } from '../../scenery/js/imports.js';
import MobiusQueryParameters from './MobiusQueryParameters.js';
import ThreeStage, { ThreeStageOptions } from './ThreeStage.js';
import mobius from './mobius.js';
import optionize from '../../phet-core/js/optionize.js';
import Property from '../../axon/js/Property.js';
import Ray3 from '../../dot/js/Ray3.js';
import Vector3 from '../../dot/js/Vector3.js';

type SelfOptions = {
  fov?: number;
};

export type ThreeNodeOptions = SelfOptions & ThreeStageOptions & NodeOptions;

export default class ThreeNode extends Node {

  public readonly stage: ThreeStage;
  private layoutWidth: number;
  private layoutHeight: number;
  private offsetProperty: Property<Vector2>;
  public readonly backgroundEventTarget: Node;
  private domNode!: DOM;

  public constructor( width: number, height: number, providedOptions?: ThreeNodeOptions ) {

    const options = optionize<ThreeNodeOptions, SelfOptions, ThreeStageOptions & NodeOptions>()( {
      fov: 50

      // positioned or transformed pixels, or full scenery-transformed?
      // can use https://threejs.org/docs/#api/en/cameras/PerspectiveCamera.setViewOffset to handle sub-pixel stuff?
    }, providedOptions );

    super();

    this.stage = new ThreeStage( options );
    this.layoutWidth = width;
    this.layoutHeight = height;

    // static camera properties
    this.stage.threeCamera.fov = options.fov;
    this.stage.threeCamera.aspect = width / height;

    this.offsetProperty = new Vector2Property( Vector2.ZERO );

    // {Node} - our target for drags that don't hit other UI components
    this.backgroundEventTarget = new Rectangle( 0, 0, width, height );
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

      const offsetMatrix = new Matrix3();
      Utils.prepareForTransform( this.stage.threeRenderer.domElement );
      this.offsetProperty.link( offset => {
        offsetMatrix.setToTranslation( offset.x, offset.y );
        Utils.applyPreparedTransform( offsetMatrix, this.stage.threeRenderer!.domElement );
      } );

      // support Scenery/Joist 0.2 screenshot (takes extra work to output)
      this.domNode.renderToCanvasSelf = wrapper => {
        const canvas = this.stage.renderToCanvas( MobiusQueryParameters.mobiusCanvasSupersampling );

        const context = wrapper.context;
        context.save();

        context.setTransform( 1, 0, this.offsetProperty.value.x, -1, 0, this.stage.canvasHeight + this.offsetProperty.value.y ); // no need to take pixel scaling into account

        context.drawImage( canvas, 0, 0 );
        context.restore();
      };

      this.addChild( this.domNode );
    }

    this.mutate( options );
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
  private getRayFromScreenPoint( screenPoint: Vector2 ): Ray3 {
    return this.stage.getRayFromScreenPoint( screenPoint );
  }

  public layout(): void {
    const globalBounds = this.localToGlobalBounds( this.backgroundEventTarget.bounds );
    const roundedBounds = globalBounds.roundedOut();

    this.stage.setDimensions( roundedBounds.width, roundedBounds.height );
    this.offsetProperty.value = roundedBounds.leftTop;

    // three.js requires this to be called after changing the parameters
    this.stage.threeCamera.updateProjectionMatrix();

    if ( this.stage.threeRenderer ) {
      this.domNode.invalidateDOM();
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
    super.dispose();

    this.stage.dispose();
  }
}

mobius.register( 'ThreeNode', ThreeNode );
