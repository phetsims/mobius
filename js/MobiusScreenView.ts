// Copyright 2021-2024, University of Colorado Boulder

/**
 * Example Mobius ScreenView
 *
 * @author Agustín Vallejo
 */

import Vector3 from '../../dot/js/Vector3.js';
import ScreenView from '../../joist/js/ScreenView.js';
import { animatedPanZoomSingleton } from '../../scenery/js/imports.js';
import ThreeIsometricNode from 'ThreeIsometricNode.js';
import ThreeUtils from 'ThreeUtils.js';
import mobius from 'mobius.js';
import Bounds2 from '../../dot/js/Bounds2.js';
import Tandem from '../../tandem/js/Tandem.js';

export default class MobiusScreenView extends ScreenView {

  private readonly sceneNode!: ThreeIsometricNode;

  public constructor() {
    super( {
      preventFit: true,
      tandem: Tandem.OPT_OUT
    } );

    // if we detect that we can't use WebGL, we'll set this to false so we can bail out.
    this.enabled = true;

    if ( !ThreeUtils.isWebGLEnabled() ) {
      ThreeUtils.showWebGLWarning( this );
      this.enabled = false;
      return;
    }

    // Used to display the 3D view
    this.sceneNode = new ThreeIsometricNode( this.layoutBounds, {
      parentMatrixProperty: animatedPanZoomSingleton.listener.matrixProperty,
      cameraPosition: new Vector3( 0, 0.4, 2 )
    } );
    this.addChild( this.sceneNode );

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