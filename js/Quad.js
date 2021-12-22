// Copyright 2019-2021, University of Colorado Boulder

/**
 * Creates a position/normal/uv mapped quad based on vertices in a high-performance way.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import mobius from './mobius.js';
import TriangleArrayWriter from './TriangleArrayWriter.js';
import Vector3 from '../../dot/js/Vector3.js';

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

    Quad.updateArrays( positionArray, normalArray, uvArray, p0x, p0y, p0z, p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z, nx, ny, nz );

    this.addAttribute( 'position', new THREE.BufferAttribute( positionArray, 3 ) );
    this.addAttribute( 'normal', new THREE.BufferAttribute( normalArray, 3 ) );
    this.addAttribute( 'uv', new THREE.BufferAttribute( uvArray, 2 ) );

    // @private
    this._update = ( p0x, p0y, p0z, p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z, nx, ny, nz ) => {
      Quad.updateArrays( positionArray, normalArray, uvArray, p0x, p0y, p0z, p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z, nx, ny, nz );
      this.attributes.position.needsUpdate = true;
      this.attributes.normal.needsUpdate = true;
      this.computeBoundingSphere();
    };
  }

  /**
   * @public
   *
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
  set( p0x, p0y, p0z, p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z, nx, ny, nz ) {
    this._update( p0x, p0y, p0z, p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z, nx, ny, nz );
  }

  /**
   * Updates provided geometry arrays given the specific size.
   * @public
   *
   * @param {Float32Array|null} positionArray
   * @param {Float32Array|null} normalArray
   * @param {Float32Array|null} uvArray
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
   * @param {number} offset - How many vertices have been specified so far?
   * @param {Vector3} offsetPosition - How to transform all of the points
   * @returns {number} - The offset after the specified vertices have been written
   */
  static updateArrays( positionArray, normalArray, uvArray, p0x, p0y, p0z, p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z, nx, ny, nz, offset = 0, offsetPosition = Vector3.ZERO ) {
    const writer = new TriangleArrayWriter( positionArray, normalArray, uvArray, offset, offsetPosition );

    writer.position( p0x, p0y, p0z );
    writer.position( p1x, p1y, p1z );
    writer.position( p2x, p2y, p2z );

    writer.position( p0x, p0y, p0z );
    writer.position( p2x, p2y, p2z );
    writer.position( p3x, p3y, p3z );

    writer.uv( 0, 0 );
    writer.uv( 1, 0 );
    writer.uv( 1, 1 );

    writer.uv( 0, 0 );
    writer.uv( 1, 1 );
    writer.uv( 0, 1 );

    writer.normal( nx, ny, nx );

    return writer.getOffset();
  }
}

mobius.register( 'Quad', Quad );
export default Quad;