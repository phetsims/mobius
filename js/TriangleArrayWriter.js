// Copyright 2021, University of Colorado Boulder

/**
 * Helps writing buffer-array style triangles into buffers.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Vector3 from '../../dot/js/Vector3.js';
import mobius from './mobius.js';

class TriangleArrayWriter {
  /**
   * @param {Float32Array|null} positionArray
   * @param {Float32Array|null} normalArray
   * @param {Float32Array|null} uvArray
   * @param {number} offset - How many vertices have been specified so far?
   * @param {Vector3} offsetPosition - How to transform all of the points
   */
  constructor( positionArray, normalArray, uvArray, offset = 0, offsetPosition = Vector3.ZERO ) {

    // @private {Float32Array|null}
    this.positionArray = positionArray;
    this.normalArray = normalArray;
    this.uvArray = uvArray;

    // @private {number}
    this.positionIndex = offset * 3;
    this.normalIndex = offset * 3;
    this.uvIndex = offset * 2;
    this.offset = offset;

    // @private {Vector3}
    this.offsetPosition = offsetPosition;
  }

  /**
   * Writes a position into the (optional) positionArray, and increments the offset.
   * @public
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  position( x, y, z ) {
    if ( this.positionArray ) {
      this.positionArray[ this.positionIndex++ ] = x + this.offsetPosition.x;
      this.positionArray[ this.positionIndex++ ] = y + this.offsetPosition.y;
      this.positionArray[ this.positionIndex++ ] = z + this.offsetPosition.z;
    }

    this.offset++;
  }

  /**
   * Writes a normal into the (optional) normalArray
   * @public
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  normal( x, y, z ) {
    if ( this.normalArray ) {
      this.normalArray[ this.normalIndex++ ] = x;
      this.normalArray[ this.normalIndex++ ] = y;
      this.normalArray[ this.normalIndex++ ] = z;
    }
  }

  /**
   * Writes a UV into the (optional) uvArray
   * @public
   *
   * @param {number} u
   * @param {number} v
   */
  uv( u, v ) {
    if ( this.uvArray ) {
      this.uvArray[ this.uvIndex++ ] = u;
      this.uvArray[ this.uvIndex++ ] = v;
    }
  }

  /**
   * Returns the offset (previous offset + number of triangles added, counted from the positionArray)
   * @public
   *
   * @returns {number}
   */
  getOffset() {
    return this.offset;
  }
}

mobius.register( 'TriangleArrayWriter', TriangleArrayWriter );
export default TriangleArrayWriter;