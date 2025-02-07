// Copyright 2024, University of Colorado Boulder

/**
 * Returns an icon for selection, given a scene setup callback. In general this is best used for a screen icon, but
 * it can be used for icons needed in ScreenView content too.
 *
 * @author Agustín Vallejo (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Vector2 from '../../dot/js/Vector2.js';
import Vector3 from '../../dot/js/Vector3.js';
import Screen from '../../joist/js/Screen.js';
import Image from '../../scenery/js/nodes/Image.js';
import Node from '../../scenery/js/nodes/Node.js';
import ThreeStage from './ThreeStage.js';
import ThreeUtils from './ThreeUtils.js';

export default function getAngledIcon( zoom: number, lookAt: Vector3, setupScene: ( scene: THREE.Scene ) => void,
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