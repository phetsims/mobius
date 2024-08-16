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

type SelfOptions = {
  sceneNodeOptions?: ThreeIsometricNodeOptions;
};

export type MobiusScreenViewOptions = SelfOptions & ScreenViewOptions;

export default class MobiusScreenView extends ScreenView {

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
}

mobius.register( 'MobiusScreenView', MobiusScreenView );