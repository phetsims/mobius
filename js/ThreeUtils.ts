// Copyright 2019-2023, University of Colorado Boulder

/**
 * Base view for all "show a single molecule in the center" screens
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Bounds2 from '../../dot/js/Bounds2.js';
import Vector3 from '../../dot/js/Vector3.js';
import ScreenView from '../../joist/js/ScreenView.js';
import asyncLoader from '../../phet-core/js/asyncLoader.js';
import PhetFont from '../../scenery-phet/js/PhetFont.js';
import SceneryPhetStrings from '../../scenery-phet/js/SceneryPhetStrings.js';
import { Color, HBox, openPopup, Path, Text, Utils } from '../../scenery/js/imports.js';
import exclamationTriangleSolidShape from '../../sherpa/js/fontawesome-5/exclamationTriangleSolidShape.js';
import mobius from './mobius.js';

// {THREE.TextureLoader|null} - "singleton" for the texture loader
let textureLoader: THREE.TextureLoader | null = null;

const scratchFloatArray = new Float32Array( 128 );

const ThreeUtils = {
  /**
   * Converts a Vector3 to a THREE.Vector3
   */
  vectorToThree( vector: Vector3 ): THREE.Vector3 {
    return new THREE.Vector3( vector.x, vector.y, vector.z );
  },

  /**
   * Converts a THREE.Vector3 to a Vector3
   */
  threeToVector( vector: THREE.Vector3 ): Vector3 {
    return new Vector3( vector.x, vector.y, vector.z );
  },

  /**
   * Converts a Color to a THREE.Color
   */
  colorToThree( color: Color ): THREE.Color {
    return new THREE.Color( color.toNumber() );
  },

  /**
   * Returns an array of [ x, y, z, ... ] vertices for a quad pointed towards the camera.
   *
   * @param bounds2 - x,y
   * @param z
   */
  frontVertices( bounds2: Bounds2, z: number ): Float32Array {
    return scratchFloatArray.slice( 0, ThreeUtils.writeFrontVertices( scratchFloatArray, 0, bounds2, z ) );
  },

  /**
   * Returns an array of [ x, y, z, ... ] vertices for a quad pointed up.
   *
   * @param bounds2 - x,z
   * @param y
   */
  topVertices( bounds2: Bounds2, y: number ): Float32Array {
    return scratchFloatArray.slice( 0, ThreeUtils.writeTopVertices( scratchFloatArray, 0, bounds2, y ) );
  },

  /**
   * Returns an array of [ x, y, z, ... ] vertices for a quad pointed towards the right.
   *
   * @param bounds2 - z,y
   * @param x
   */
  rightVertices( bounds2: Bounds2, x: number ): Float32Array {
    return scratchFloatArray.slice( 0, ThreeUtils.writeRightVertices( scratchFloatArray, 0, bounds2, x ) );
  },

  /**
   * Returns an array of [ x, y, z, ... ] vertices for a quad pointed towards the left.
   *
   * @param Bounds2 bounds2 - z,y
   * @param number x
   */
  leftVertices( bounds2: Bounds2, x: number ): Float32Array {
    return scratchFloatArray.slice( 0, ThreeUtils.writeLeftVertices( scratchFloatArray, 0, bounds2, x ) );
  },

  /**
   * Writes a single triangle into a buffer, returning the new index location. Assumes vertices in counterclockwise
   * order.
   *
   * Writes 9 entries into the array.
   *
   * @returns - The index for the next write
   */
  writeTriangle( array: Float32Array | Float64Array, index: number, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number ): number {
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
   *
   * Writes 18 entries into the array.
   *
   * @returns - The index for the next write
   */
  writeQuad( array: Float32Array | Float64Array, index: number, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, x3: number, y3: number, z3: number ): number {
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
   *
   * Writes 18 entries into the array.
   *
   * @returns - The index for the next write
   */
  writeFrontVertices( array: Float32Array | Float64Array, index: number, bounds2: Bounds2, z: number ): number {
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
   *
   * Writes 18 entries into the array.
   *
   * @param array
   * @param index
   * @param bounds2 - x,z
   * @param y
   * @returns - The index for the next write
   */
  writeTopVertices( array: Float32Array | Float64Array, index: number, bounds2: Bounds2, y: number ): number {
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
   *
   * Writes 18 entries into the array.
   *
   * @param array
   * @param index
   * @param bounds2 - z,y
   * @param x
   * @returns - The index for the next write
   */
  writeRightVertices( array: Float32Array | Float64Array, index: number, bounds2: Bounds2, x: number ): number {
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
   *
   * Writes 18 entries into the array.
   *
   * @param array
   * @param index
   * @param bounds2 - z,y
   * @param x
   * @returns - The index for the next write
   */
  writeLeftVertices( array: Float32Array | Float64Array, index: number, bounds2: Bounds2, x: number ): number {
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
   */
  get textureLoader(): THREE.TextureLoader {
    if ( !textureLoader ) {
      textureLoader = new THREE.TextureLoader();
    }
    return textureLoader;
  },

  /**
   * Returns a THREE.Texture for a given HTMLImageElement.
   */
  imageToTexture( image: HTMLImageElement, waitForLoad?: boolean ): THREE.Texture {
    if ( waitForLoad ) {
      return ThreeUtils.textureLoader.load( image.src, asyncLoader.createLock() );
    }
    else {
      return ThreeUtils.textureLoader.load( image.src );
    }
  },

  /**
   * Checks if webgl is enabled by the browser.
   */
  isWebGLEnabled(): boolean {
    return phet.chipper.queryParameters.webgl && Utils.isWebGLSupported;
  },

  /**
   * Shows a warning with a link to more information about PhET simulation webgl compatibility.
   */
  showWebGLWarning( screenView: ScreenView ): void {
    const warningNode = new HBox( {
      children: [
        new Path( exclamationTriangleSolidShape, {
          fill: '#E87600', // "safety orange", according to Wikipedia
          scale: 0.06
        } ),
        new Text( SceneryPhetStrings.webglWarning.bodyStringProperty, {
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
        const joistGlobal = _.get( window, 'phet.joist', null ); // returns null if global isn't found
        const locale = joistGlobal ? joistGlobal.sim.locale : 'en';

        openPopup( `https://phet.colorado.edu/webgl-disabled-page?simLocale=${locale}` );
      }
    } );
  }
};

mobius.register( 'ThreeUtils', ThreeUtils );
export default ThreeUtils;