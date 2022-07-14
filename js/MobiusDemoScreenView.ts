// Copyright 2021-2022, University of Colorado Boulder

/**
 * Example Mobius ScreenView
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Vector3 from '../../dot/js/Vector3.js';
import ScreenView from '../../joist/js/ScreenView.js';
import Keypad from '../../scenery-phet/js/keypad/Keypad.js';
import { animatedPanZoomSingleton } from '../../scenery/js/imports.js';
import NodeTexture from './NodeTexture.js';
import TextureQuad from './TextureQuad.js';
import ThreeIsometricNode from './ThreeIsometricNode.js';
import ThreeUtils from './ThreeUtils.js';
import mobius from './mobius.js';
import Bounds2 from '../../dot/js/Bounds2.js';
import Tandem from '../../tandem/js/Tandem.js';

export default class MobiusDemoScreenView extends ScreenView {

  private readonly sceneNode!: ThreeIsometricNode;
  private readonly cubeMesh!: THREE.Mesh;

  public constructor() {
    super( {
      preventFit: true,
      tandem: Tandem.OPT_OUT
    } );

    // f we detect that we can't use WebGL, we'll set this to false so we can bail out.
    this.enabled = true;

    if ( !ThreeUtils.isWebGLEnabled() ) {
      ThreeUtils.showWebGLWarning( this );
      this.enabled = false;
      return;
    }

    // Used to display the 3D view
    this.sceneNode = new ThreeIsometricNode( this.layoutBounds, {
      parentMatrixProperty: animatedPanZoomSingleton.listener!.matrixProperty,
      cameraPosition: new Vector3( 0, 0.4, 2 )
    } );
    this.addChild( this.sceneNode );

    // Camera settings
    this.sceneNode.stage.threeCamera.zoom = 1.7;
    this.sceneNode.stage.threeCamera.updateProjectionMatrix();
    this.sceneNode.stage.threeCamera.up = new THREE.Vector3( 0, 0, -1 );
    this.sceneNode.stage.threeCamera.lookAt( ThreeUtils.vectorToThree( Vector3.ZERO ) );

    // Lights
    const ambientLight = new THREE.AmbientLight( 0x333333 );
    this.sceneNode.stage.threeScene.add( ambientLight );
    const sunLight = new THREE.DirectionalLight( 0xffffff, 1 );
    sunLight.position.set( -1, 1.5, 0.8 );
    this.sceneNode.stage.threeScene.add( sunLight );
    const moonLight = new THREE.DirectionalLight( 0xffffff, 0.2 );
    moonLight.position.set( 2.0, -1.0, 1.0 );
    this.sceneNode.stage.threeScene.add( moonLight );

    const cubeGeometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
    const cubeMaterial = new THREE.MeshLambertMaterial( {
      color: 0xFF0000
    } );

    // Create a mesh with the geometry and material
    this.cubeMesh = new THREE.Mesh( cubeGeometry, cubeMaterial );
    this.sceneNode.stage.threeScene.add( this.cubeMesh );

    // Toss some Node content into the 3D scene. Would call update() on the NodeTexture whenever it needs updates.
    const exampleNode = new Keypad( Keypad.PositiveIntegerLayout, {
      scale: 3,
      left: 1,
      top: 1
    } );
    const size = Math.ceil( Math.max( exampleNode.width, exampleNode.height ) ) + 2;
    const label = new TextureQuad( new NodeTexture( exampleNode, size, size ), 0.2, 0.2 );
    label.position.copy( ThreeUtils.vectorToThree( new Vector3( 0, 0, 0.26 ) ) );
    this.cubeMesh.add( label );
  }

  public override layout( viewBounds: Bounds2 ): void {
    super.layout( viewBounds );

    // If the simulation was not able to load for WebGL, bail out
    if ( !this.sceneNode ) {
      return;
    }

    this.sceneNode.layout( viewBounds.width, viewBounds.height );

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

    this.cubeMesh.rotateY( dt );

    this.sceneNode.render( undefined );
  }
}

mobius.register( 'MobiusDemoScreenView', MobiusDemoScreenView );
