// Copyright 2024-2025, University of Colorado Boulder

/**
 * MobiusScreenView extends PhET's ScreenView to include functionality specific to 3D model-to-view and view-to-model
 * transformations using THREE.js. The MobiusScreenView renders 3D content in an isometric projection and handles the
 * layout and rendering processes.
 *
 * @author Agustín Vallejo (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Bounds2 from '../../dot/js/Bounds2.js';
import Matrix3 from '../../dot/js/Matrix3.js';
import Vector2 from '../../dot/js/Vector2.js';
import Vector3 from '../../dot/js/Vector3.js';
import ScreenView, { ScreenViewOptions } from '../../joist/js/ScreenView.js';
import optionize from '../../phet-core/js/optionize.js';
import ContextLossFailureDialog from '../../scenery-phet/js/ContextLossFailureDialog.js';
import PhetFont from '../../scenery-phet/js/PhetFont.js';
import SceneryPhetFluent from '../../scenery-phet/js/SceneryPhetFluent.js';
import HBox from '../../scenery/js/layout/nodes/HBox.js';
import Path from '../../scenery/js/nodes/Path.js';
import Text from '../../scenery/js/nodes/Text.js';
import openPopup from '../../scenery/js/util/openPopup.js';
import warningSignShape from '../../sun/js/shapes/warningSignShape.js';
import mobius from './mobius.js';
import ThreeIsometricNode, { ThreeIsometricNodeOptions } from './ThreeIsometricNode.js';
import ThreeUtils from './ThreeUtils.js';

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

  // Whether this ScreenView supports WebGL.
  protected readonly supportsWebGL: boolean;

  // Used to display the 3D view
  protected readonly sceneNode: ThreeIsometricNode;

  // Dialog shown on context loss, constructed lazily because Dialog requires sim bounds during construction
  private contextLossDialog: ContextLossFailureDialog | null = null;

  public constructor( providedOptions: MobiusScreenViewOptions ) {

    const options = optionize<MobiusScreenViewOptions, SelfOptions, ScreenViewOptions>()( {
      sceneNodeOptions: {
        cameraPosition: new Vector3( 0, 0.4, 2 )
      },

      // Fitting isn't too helpful here since we do most rendering in the THREE js stage, https://github.com/phetsims/density-buoyancy-common/commit/92b6b0f85f9341a71673fdb404238983850af4c2
      preventFit: true
    }, providedOptions );

    super( options );

    this.supportsWebGL = ThreeUtils.isWebGLEnabled();

    this.sceneNode = new ThreeIsometricNode( this.layoutBounds, options.sceneNodeOptions );
    this.addChild( this.sceneNode );

    // Hooks for context loss handling (currently a dialog). Isolated from ThreeStage so we don't need to pull in ALL of joist.
    this.sceneNode.stage.contextLostEmitter.addListener( () => {
      if ( !this.contextLossDialog ) {
        this.contextLossDialog = new ContextLossFailureDialog();
      }
      this.contextLossDialog.show();
    } );
    this.sceneNode.stage.contextRestoredEmitter.addListener( () => {
      this.contextLossDialog && this.contextLossDialog.hideWithoutReload();
    } );

    if ( !this.supportsWebGL ) {
      MobiusScreenView.showWebGLWarning( this );
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
    return this.sceneNode.unprojectPoint( this.localToGlobalPoint( point ), modelZ );
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
    if ( !this.supportsWebGL ) {
      return;
    }

    // eslint-disable-next-line phet/bad-phet-library-text
    const dimension = phet.joist.sim.dimensionProperty.value;

    const sceneWidth = dimension.width || window.innerWidth; // eslint-disable-line phet/bad-sim-text
    const sceneHeight = dimension.height || window.innerHeight; // eslint-disable-line phet/bad-sim-text

    this.sceneNode.layout( sceneWidth, sceneHeight );

    // We need to do an initial render for certain layout-based code to work.
    // "undefined" means "use the default target", which will be the rendered provided to the stage during creation.
    this.renderSceneNode();
  }

  public renderSceneNode(): void {

    // "undefined" means "use the default target", which will be the rendered provided to the stage during creation.
    this.sceneNode.render( undefined );
  }

  /**
   * Steps forward in time.
   */
  public override step( dt: number ): void {

    // If the simulation was not able to load for WebGL, bail out
    if ( !this.supportsWebGL ) {
      return;
    }

    this.renderSceneNode();
  }

  /**
   * Shows a warning with a link to more information about PhET simulation webgl compatibility.
   */
  public static showWebGLWarning( screenView: ScreenView ): void {
    const warningNode = new HBox( {
      children: [
        new Path( warningSignShape, {
          fill: '#E87600', // "safety orange", according to Wikipedia
          matrix: Matrix3.scale( 1.2, -1.2 )
        } ),
        new Text( SceneryPhetFluent.webglWarning.bodyStringProperty, {
          font: new PhetFont( 16 ),
          fill: '#888',
          maxWidth: 600
        } )
      ],
      spacing: 12,
      align: 'center',
      cursor: 'pointer',
      center: screenView.layoutBounds.center
    } );
    screenView.addChild( warningNode );

    warningNode.mouseArea = warningNode.touchArea = warningNode.localBounds;

    warningNode.addInputListener( {
      up: function() {
        const joistGlobal = _.get( window, 'phet.joist', null ); // returns null if global isn't found
        const locale = joistGlobal ? joistGlobal.sim.locale : 'en';

        openPopup( `https://phet.colorado.edu/webgl-disabled-page?simLocale=${locale}` );
      }
    } );
  }
}

mobius.register( 'MobiusScreenView', MobiusScreenView );