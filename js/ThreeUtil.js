// Copyright 2019, University of Colorado Boulder

/**
 * Base view for all "show a single molecule in the center" screens
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
define( require => {
  'use strict';

  // modules
  const mobius = require( 'MOBIUS/mobius' );
  const Vector3 = require( 'DOT/Vector3' );

  const ThreeUtil = {
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
     * Returns a THREE.Texture for a given HTMLImageElement.
     * @public
     *
     * @param {HTMLImageElement} image
     * @returns {THREE.Texture}
     */
    imageToTexture( image ) {
      // TODO: Should we statically create a TextureLoader?
      return new THREE.TextureLoader().load( image.src );
    }
  };

  return mobius.register( 'ThreeUtil', ThreeUtil );
} );
