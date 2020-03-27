// Copyright 2019-2020, University of Colorado Boulder

/**
 * Base view for all "show a single molecule in the center" screens
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Vector3 from '../../dot/js/Vector3.js';
import SimLauncher from '../../joist/js/SimLauncher.js';
import openPopup from '../../phet-core/js/openPopup.js';
import PhetFont from '../../scenery-phet/js/PhetFont.js';
import sceneryPhetStrings from '../../scenery-phet/js/scenery-phet-strings.js';
import HBox from '../../scenery/js/nodes/HBox.js';
import Text from '../../scenery/js/nodes/Text.js';
import Utils from '../../scenery/js/util/Utils.js';
import FontAwesomeNode from '../../sun/js/FontAwesomeNode.js';
import mobius from './mobius.js';

const webglWarningBodyString = sceneryPhetStrings.webglWarning.body;

// {THREE.TextureLoader|null} - "singleton" for the texture loader
let textureLoader = null;

const ThreeUtils = {
  /**
   * Converts a Vector3 to a THREE.Vector3
   * @public
   *
   * @param {Vector3} vector
   * @returns {THREE.Vector3}
   */
  vectorToThree( vector ) {
    return new THREE.Vector3( vector.x, vector.y, vector.z );
  },

  /**
   * Converts a THREE.Vector3 to a Vector3
   * @public
   *
   * @param {THREE.Vector3} vector
   * @returns {Vector3}
   */
  threeToVector( vector ) {
    return new Vector3( vector.x, vector.y, vector.z );
  },

  /**
   * Converts a Color to a THREE.Color
   * @public
   *
   * @param {Color} color
   * @returns {THREE.Color}
   */
  colorToThree( color ) {
    return new THREE.Color( color.toNumber() );
  },

  /**
   * Returns an array of [ x, y, z, ... ] vertices for a quad pointed towards the camera.
   * @public
   *
   * @param {Bounds2} bounds2 - x,y
   * @param {number} z
   * @returns {Array.<number>}
   */
  frontVertices( bounds2, z ) {
    return [
      bounds2.minX, bounds2.maxY, z,
      bounds2.minX, bounds2.minY, z,
      bounds2.maxX, bounds2.maxY, z,
      bounds2.minX, bounds2.minY, z,
      bounds2.maxX, bounds2.minY, z,
      bounds2.maxX, bounds2.maxY, z
    ];
  },

  /**
   * Returns an array of [ x, y, z, ... ] vertices for a quad pointed up.
   * @public
   *
   * @param {Bounds2} bounds2 - x,z
   * @param {number} y
   * @returns {Array.<number>}
   */
  topVertices( bounds2, y ) {
    return [
      bounds2.minX, y, bounds2.maxY,
      bounds2.maxX, y, bounds2.maxY,
      bounds2.minX, y, bounds2.minY,
      bounds2.minX, y, bounds2.minY,
      bounds2.maxX, y, bounds2.maxY,
      bounds2.maxX, y, bounds2.minY
    ];
  },

  /**
   * Returns an array of [ x, y, z, ... ] vertices for a quad pointed towards the right.
   * @public
   *
   * @param {Bounds2} bounds2 - z,y
   * @param {number} x
   * @returns {Array.<number>}
   */
  rightVertices( bounds2, x ) {
    return [
      x, bounds2.minY, bounds2.maxX,
      x, bounds2.minY, bounds2.minX,
      x, bounds2.maxY, bounds2.maxX,
      x, bounds2.minY, bounds2.minX,
      x, bounds2.maxY, bounds2.minX,
      x, bounds2.maxY, bounds2.maxX
    ];
  },

  /**
   * Returns an array of [ x, y, z, ... ] vertices for a quad pointed towards the left.
   * @public
   *
   * @param {Bounds2} bounds2 - z,y
   * @param {number} x
   * @returns {Array.<number>}
   */
  leftVertices( bounds2, x ) {
    return [
      x, bounds2.minY, bounds2.maxX,
      x, bounds2.maxY, bounds2.maxX,
      x, bounds2.minY, bounds2.minX,
      x, bounds2.minY, bounds2.minX,
      x, bounds2.maxY, bounds2.maxX,
      x, bounds2.maxY, bounds2.minX
    ];
  },

  /**
   * Returns a THREE.TextureLoader instance (using a singleton so we don't create more than we need).
   * @public
   *
   * @returns {THREE.TextureLoader}
   */
  get textureLoader() {
    if ( !textureLoader ) {
      textureLoader = new THREE.TextureLoader();
    }
    return textureLoader;
  },

  /**
   * Returns a THREE.Texture for a given HTMLImageElement.
   * @public
   *
   * @param {HTMLImageElement} image
   * @param {boolean} [waitForLoad]
   * @returns {THREE.Texture}
   */
  imageToTexture( image, waitForLoad ) {
    if ( waitForLoad ) {
      return ThreeUtils.textureLoader.load( image.src, SimLauncher.createLock() );
    }
    else {
      return ThreeUtils.textureLoader.load( image.src );
    }
  },

  /**
   * Checks if webgl is enabled by the browser.
   * @public
   *
   * @returns {boolean}
   */
  isWebGLEnabled() {
    return phet.chipper.queryParameters.webgl && Utils.isWebGLSupported;
  },

  /**
   * Shows a warning with a link to more information about PhET simulation webgl compatibility.
   * @public
   *
   * @param screenView
   * @returns {ScreenView}
   */
  showWebGLWarning( screenView ) {
    const warningNode = new HBox( {
      children: [
        new FontAwesomeNode( 'warning_sign', {
          fill: '#E87600', // "safety orange", according to Wikipedia
          scale: 0.8
        } ),
        new Text( webglWarningBodyString, {
          font: new PhetFont( 16 ),
          fill: '#000',
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
        openPopup( 'http://phet.colorado.edu/webgl-disabled-page?simLocale=' + phet.joist.sim.locale );
      }
    } );
  }
};

mobius.register( 'ThreeUtils', ThreeUtils );
export default ThreeUtils;