// Copyright 2014-2019, University of Colorado Boulder

/**
 * Base view for all "show a single molecule in the center" screens
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
define( function( require ) {
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
    }
  };

  return mobius.register( 'ThreeUtil', ThreeUtil );
} );
