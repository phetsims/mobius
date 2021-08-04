// Copyright 2019-2021, University of Colorado Boulder

/**
 * Base view for all "show a single molecule in the center" screens
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Vector3 from '../../dot/js/Vector3.js';
import asyncLoader from '../../phet-core/js/asyncLoader.js';
import openPopup from '../../phet-core/js/openPopup.js';
import PhetFont from '../../scenery-phet/js/PhetFont.js';
import sceneryPhetStrings from '../../scenery-phet/js/sceneryPhetStrings.js';
import HBox from '../../scenery/js/nodes/HBox.js';
import Path from '../../scenery/js/nodes/Path.js';
import Text from '../../scenery/js/nodes/Text.js';
import Utils from '../../scenery/js/util/Utils.js';
import exclamationTriangleSolidShape from '../../sherpa/js/fontawesome-5/exclamationTriangleSolidShape.js';
import mobius from './mobius.js';

const webglWarningBodyString = sceneryPhetStrings.webglWarning.body;

// {THREE.TextureLoader|null} - "singleton" for the texture loader
let textureLoader = null;

const scratchFloatArray = new Float32Array( 128 );

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
   * @returns {Float32Array}
   */
  frontVertices( bounds2, z ) {
    return scratchFloatArray.slice( 0, ThreeUtils.writeFrontVertices( scratchFloatArray, 0, bounds2, z ) );
  },

  /**
   * Returns an array of [ x, y, z, ... ] vertices for a quad pointed up.
   * @public
   *
   * @param {Bounds2} bounds2 - x,z
   * @param {number} y
   * @returns {Float32Array}
   */
  topVertices( bounds2, y ) {
    return scratchFloatArray.slice( 0, ThreeUtils.writeTopVertices( scratchFloatArray, 0, bounds2, y ) );
  },

  /**
   * Returns an array of [ x, y, z, ... ] vertices for a quad pointed towards the right.
   * @public
   *
   * @param {Bounds2} bounds2 - z,y
   * @param {number} x
   * @returns {Float32Array}
   */
  rightVertices( bounds2, x ) {
    return scratchFloatArray.slice( 0, ThreeUtils.writeRightVertices( scratchFloatArray, 0, bounds2, x ) );
  },

  /**
   * Returns an array of [ x, y, z, ... ] vertices for a quad pointed towards the left.
   * @public
   *
   * @param {Bounds2} bounds2 - z,y
   * @param {number} x
   * @returns {Float32Array}
   */
  leftVertices( bounds2, x ) {
    return scratchFloatArray.slice( 0, ThreeUtils.writeLeftVertices( scratchFloatArray, 0, bounds2, x ) );
  },

  /**
   * Writes a single triangle into a buffer, returning the new index location. Assumes vertices in counterclockwise
   * order.
   * @public
   *
   * Writes 9 entries into the array.
   *
   * @param {Float32Array|Float64Array} array
   * @param {number} index
   * @param {number} x0
   * @param {number} y0
   * @param {number} z0
   * @param {number} x1
   * @param {number} y1
   * @param {number} z1
   * @param {number} x2
   * @param {number} y2
   * @param {number} z2
   * @returns {number} - The index for the next write
   */
  writeTriangle( array, index, x0, y0, z0, x1, y1, z1, x2, y2, z2 ) {
    array[ index + 0 ] = x0;
    array[ index + 1 ] = y0;
    array[ index + 2 ] = z0;
    array[ index + 3 ] = x1;
    array[ index + 4 ] = y1;
    array[ index + 5 ] = z1;
    array[ index + 6 ] = x2;
    array[ index + 7 ] = y2;
    array[ index + 8 ] = z2;

    return index + 9;
  },

  /**
   * Writes a single quad into a buffer, returning the new index location. Assumes verties in counterclockwise order.
   * @public
   *
   * Writes 18 entries into the array.
   *
   * @param {Float32Array|Float64Array} array
   * @param {number} index
   * @param {number} x0
   * @param {number} y0
   * @param {number} z0
   * @param {number} x1
   * @param {number} y1
   * @param {number} z1
   * @param {number} x2
   * @param {number} y2
   * @param {number} z2
   * @param {number} z3
   * @param {number} y3
   * @param {number} z3
   * @returns {number}
   */
  writeQuad( array, index, x0, y0, z0, x1, y1, z1, x2, y2, z2, x3, y3, z3 ) {
    index = ThreeUtils.writeTriangle(
      array, index,
      x0, y0, z0,
      x1, y1, z1,
      x2, y2, z2
    );
    index = ThreeUtils.writeTriangle(
      array, index,
      x0, y0, z0,
      x2, y2, z2,
      x3, y3, z3
    );
    return index;
  },

  /**
   * Writes a single front-facing quad into a buffer, returning the new index location. Assumes verties in
   * counterclockwise order.
   * @public
   *
   * Writes 18 entries into the array.
   *
   * @param {Float32Array|Float64Array} array
   * @param {number} index
   * @param {Bounds2} bounds2 - x,y
   * @param {number} z
   * @returns {number}
   */
  writeFrontVertices( array, index, bounds2, z ) {
    return ThreeUtils.writeQuad(
      array, index,
      bounds2.minX, bounds2.maxY, z,
      bounds2.minX, bounds2.minY, z,
      bounds2.maxX, bounds2.minY, z,
      bounds2.maxX, bounds2.maxY, z
    );
  },

  /**
   * Writes a single up-facing quad into a buffer, returning the new index location. Assumes verties in
   * counterclockwise order.
   * @public
   *
   * Writes 18 entries into the array.
   *
   * @param {Float32Array|Float64Array} array
   * @param {number} index
   * @param {Bounds2} bounds2 - x,z
   * @param {number} y
   * @returns {number}
   */
  writeTopVertices( array, index, bounds2, y ) {
    return ThreeUtils.writeQuad(
      array, index,
      bounds2.minX, y, bounds2.maxY,
      bounds2.maxX, y, bounds2.maxY,
      bounds2.maxX, y, bounds2.minY,
      bounds2.minX, y, bounds2.minY
    );
  },

  /**
   * Writes a single right-facing quad into a buffer, returning the new index location. Assumes verties in
   * counterclockwise order.
   * @public
   *
   * Writes 18 entries into the array.
   *
   * @param {Float32Array|Float64Array} array
   * @param {number} index
   * @param {Bounds2} bounds2 - z,y
   * @param {number} x
   * @returns {number}
   */
  writeRightVertices( array, index, bounds2, x ) {
    return ThreeUtils.writeQuad(
      array, index,
      x, bounds2.minY, bounds2.maxX,
      x, bounds2.minY, bounds2.minX,
      x, bounds2.maxY, bounds2.minX,
      x, bounds2.maxY, bounds2.maxX
    );
  },

  /**
   * Writes a single left-facing quad into a buffer, returning the new index location. Assumes verties in
   * counterclockwise order.
   * @public
   *
   * Writes 18 entries into the array.
   *
   * @param {Float32Array|Float64Array} array
   * @param {number} index
   * @param {Bounds2} bounds2 - z,y
   * @param {number} x
   * @returns {number}
   */
  writeLeftVertices( array, index, bounds2, x ) {
    return ThreeUtils.writeQuad(
      array, index,
      x, bounds2.minY, bounds2.maxX,
      x, bounds2.maxY, bounds2.maxX,
      x, bounds2.maxY, bounds2.minX,
      x, bounds2.minY, bounds2.minX
    );
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
      return ThreeUtils.textureLoader.load( image.src, asyncLoader.createLock() );
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
   * @param {ScreenView} screenView
   */
  showWebGLWarning( screenView ) {
    const warningNode = new HBox( {
      children: [
        new Path( exclamationTriangleSolidShape, {
          fill: '#E87600', // "safety orange", according to Wikipedia
          scale: 0.06
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
        openPopup( `http://phet.colorado.edu/webgl-disabled-page?simLocale=${phet.joist.sim.locale}` );
      }
    } );
  }
};

mobius.register( 'ThreeUtils', ThreeUtils );
export default ThreeUtils;