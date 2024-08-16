// Copyright 2024, University of Colorado Boulder

/**
 * Example Mobius ScreenView
 *
 * @author Agustín Vallejo
 */

import Vector3 from '../../dot/js/Vector3.js';
import ScreenView, { ScreenViewOptions } from '../../joist/js/ScreenView.js';
import ThreeUtils from './ThreeUtils.js';
import mobius from './mobius.js';
import Bounds2 from '../../dot/js/Bounds2.js';
import optionize from '../../phet-core/js/optionize.js';
import ThreeIsometricNode, { ThreeIsometricNodeOptions } from './ThreeIsometricNode.js';
import Vector2 from '../../dot/js/Vector2.js';
import { Image, Node } from '../../scenery/js/imports.js';
import Screen from '../../joist/js/Screen.js';
import ThreeStage from './ThreeStage.js';

export type THREEModelViewTransform = {
  modelToViewPoint: ( modelPoint: Vector3 ) => Vector2;
  modelToViewDelta: ( point1: Vector3, point2: Vector3 ) => Vector2;
  viewToModelPoint: ( point: Vector2, modelZ?: number ) => Vector3;
  viewToModelDelta: ( viewPoint1: Vector2, modelZ1: number, viewPoint2: Vector2, modelZ2: number ) => Vector3;
};

type SelfOptions = {
  sceneNodeOptions?: ThreeIsometricNodeOptions;
};

export type MobiusScreenViewOptions = SelfOptions & ScreenViewOptions;

export default class MobiusScreenView extends ScreenView implements THREEModelViewTransform {

  protected readonly sceneNode: ThreeIsometricNode;

  public constructor( providedOptions: MobiusScreenViewOptions ) {

    const options = optionize<MobiusScreenViewOptions, SelfOptions, ScreenViewOptions>()( {
      sceneNodeOptions: {
        cameraPosition: new Vector3( 0, 0.4, 2 )
      },

      // Fitting isn't too helpful here since we do most rendering in the THREE js stage, https://github.com/phetsims/density-buoyancy-common/commit/92b6b0f85f9341a71673fdb404238983850af4c2
      preventFit: true
    }, providedOptions );

    super( options );

    // Used to display the 3D view
    this.sceneNode = new ThreeIsometricNode( this.layoutBounds, options.sceneNodeOptions );
    this.addChild( this.sceneNode );

    if ( !ThreeUtils.isWebGLEnabled() ) {
      ThreeUtils.showWebGLWarning( this );
    }
  }


  /////////////////////////////////////////////////////////////////
  // START: model view transform code

  /**
   * Projects a 3d model point to a 2d view point (in the screen view's coordinate frame).
   * see https://github.com/phetsims/density-buoyancy-common/issues/142
   */
  public modelToViewPoint( point: Vector3 ): Vector2 {
    return this.globalToLocalPoint( this.sceneNode.projectPoint( point ) );
  }

  /**
   Get the difference in screen view coordinates between two model points. Both points are needed because of the 3d nature of the model   */
  public modelToViewDelta( point1: Vector3, point2: Vector3 ): Vector2 {
    const viewPoint1 = this.modelToViewPoint( point1 );
    const viewPoint2 = this.modelToViewPoint( point2 );
    return viewPoint2.minus( viewPoint1 );
  }

  /**
   * Project a 2d global screen coordinate into 3d global coordinate frame. Default to z distance of 0 (center of masses/pool)
   */
  public viewToModelPoint( point: Vector2, modelZ = 0 ): Vector3 {
    return this.sceneNode.unprojectPoint( this.globalToLocalPoint( point ), modelZ );
  }

  /**
   * Get the difference in screen view coordinates from the first to the second provided screen points, in model
   * coordinates. Both points are needed because of the 3d nature of the model. Please note that the delta can have
   * negative values.
   */
  public viewToModelDelta( viewPoint1: Vector2, modelZ1: number, viewPoint2: Vector2, modelZ2: number ): Vector3 {
    const modelPoint1 = this.viewToModelPoint( viewPoint1, modelZ1 );
    const modelPoint2 = this.viewToModelPoint( viewPoint2, modelZ2 );
    return modelPoint2.minus( modelPoint1 );
  }

  // END: model view transform code
  /////////////////////////////////////////////////////////////////

  public override layout( viewBounds: Bounds2 ): void {
    super.layout( viewBounds );

    // If the simulation was not able to load for WebGL, bail out
    if ( !this.sceneNode ) {
      return;
    }

    // eslint-disable-next-line bad-phet-library-text
    const dimension = phet.joist.sim.dimensionProperty.value;

    const sceneWidth = dimension.width || window.innerWidth; // eslint-disable-line bad-sim-text
    const sceneHeight = dimension.height || window.innerHeight; // eslint-disable-line bad-sim-text

    this.sceneNode.layout( sceneWidth, sceneHeight );

    // We need to do an initial render for certain layout-based code to work
    this.sceneNode.render( undefined );
  }

  /**
   * Steps forward in time.
   */
  public override step( dt: number ): void {

    // If the simulation was not able to load for WebGL, bail out
    if ( !this.sceneNode ) {
      return;
    }

    this.sceneNode.render( undefined );
  }

  /**
   * Returns an icon for selection, given a scene setup callback. In general this is best used for a screen icon, but
   * it can be used for icons needed in ScreenView content too.
   */
  public static getAngledIcon( zoom: number, lookAt: Vector3, setupScene: ( scene: THREE.Scene ) => void,
                               background: THREE.Color | null = new THREE.Color( 0xffffff ) ): Node {
    const width = Screen.MINIMUM_HOME_SCREEN_ICON_SIZE.width;
    const height = Screen.MINIMUM_HOME_SCREEN_ICON_SIZE.height;

    const stage = new ThreeStage();

    stage.threeCamera.near = 0.5;

    const ambientLight = new THREE.AmbientLight( 0x333333 );
    stage.threeScene.add( ambientLight );

    const sunLight = new THREE.DirectionalLight( 0xffffff, 1 );
    sunLight.position.set( -1, 1.5, 0.8 );
    stage.threeScene.add( sunLight );

    const moonLight = new THREE.DirectionalLight( 0xffffff, 0.2 );
    moonLight.position.set( 2.0, -1.0, 1.0 );
    stage.threeScene.add( moonLight );

    stage.threeScene.background = background;

    stage.threeCamera.position.copy( ThreeUtils.vectorToThree( new Vector3( 0, 0.4, 1 ) ) );
    stage.threeCamera.zoom = zoom;
    stage.threeCamera.lookAt( ThreeUtils.vectorToThree( lookAt ) );
    stage.threeCamera.updateProjectionMatrix();

    setupScene( stage.threeScene );

    stage.threeCamera.fov = 50;
    stage.threeCamera.aspect = width / height;
    stage.setDimensions( width, height );
    stage.threeCamera.updateProjectionMatrix();
    stage.render( undefined );

    const canvas = stage.renderToCanvas( 3, 1, new Vector2( 1, -1 ) );

    stage.dispose();

    // Output to the console, so we can regenerate them if we have changes
    console.log( canvas.toDataURL() );

    const image = new Image( canvas.toDataURL(), {
      mipmap: true,
      initialWidth: canvas.width,
      initialHeight: canvas.height
    } );
    image.left = 0;
    image.top = 0;
    return image;
  }
}

mobius.register( 'MobiusScreenView', MobiusScreenView );