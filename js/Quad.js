// Copyright 2019, University of Colorado Boulder

/**
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
define( require => {
  'use strict';

  // modules
  const mobius = require( 'MOBIUS/mobius' );

  class Quad extends THREE.BufferGeometry {
    /**
     * @param {number} p0x
     * @param {number} p0y
     * @param {number} p0z
     * @param {number} p1x
     * @param {number} p1y
     * @param {number} p1z
     * @param {number} p2x
     * @param {number} p2y
     * @param {number} p2z
     * @param {number} p3x
     * @param {number} p3y
     * @param {number} p3z
     * @param {number} nx
     * @param {number} ny
     * @param {number} nz
     */
    constructor( p0x, p0y, p0z, p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z, nx, ny, nz ) {

      super();

      const numElements = 6;

      const positionArray = new Float32Array( numElements * 3 );
      const normalArray = new Float32Array( numElements * 3 );
      const uvArray = new Float32Array( numElements * 2 );

      let positionIndex = 0;
      let normalIndex = 0;
      let uvIndex = 0;

      function position( x, y, z ) {
        positionArray[ positionIndex++ ] = x;
        positionArray[ positionIndex++ ] = y;
        positionArray[ positionIndex++ ] = z;
      }

      function normal( x, y, z ) {
        for ( let i = 0; i < 6; i++ ) {
          normalArray[ normalIndex++ ] = x;
          normalArray[ normalIndex++ ] = y;
          normalArray[ normalIndex++ ] = z;
        }
      }

      function uv( u, v ) {
        uvArray[ uvIndex++ ] = u;
        uvArray[ uvIndex++ ] = v;
      }

      position( p0x, p0y, p0z );
      position( p1x, p1y, p1z );
      position( p2x, p2y, p2z );

      position( p0x, p0y, p0z );
      position( p2x, p2y, p2z );
      position( p3x, p3y, p3z );

      uv( 0, 0 );
      uv( 1, 0 );
      uv( 1, 1 );

      uv( 0, 0 );
      uv( 1, 1 );
      uv( 0, 1 );

      normal( nx, ny, nx );

      this.addAttribute( 'position', new THREE.BufferAttribute( positionArray, 3 ) );
      this.addAttribute( 'normal', new THREE.BufferAttribute( normalArray, 3 ) );
      this.addAttribute( 'uv', new THREE.BufferAttribute( uvArray, 2 ) );
    }
  }

  return mobius.register( 'Quad', Quad );
} );
