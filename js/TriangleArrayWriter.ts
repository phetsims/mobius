// Copyright 2021-2022, University of Colorado Boulder

/**
 * Helps writing buffer-array style triangles into buffers.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Vector3 from '../../dot/js/Vector3.js';
import mobius from './mobius.js';

export default class TriangleArrayWriter {

  private readonly positionArray: Float32Array | null;
  private readonly normalArray: Float32Array | null;
  private readonly uvArray: Float32Array | null;

  private positionIndex: number;
  private normalIndex: number;
  private uvIndex: number;
  private offset: number;

  private offsetPosition: Vector3;

  /**
   * @param positionArray
   * @param normalArray
   * @param uvArray
   * @param offset - How many vertices have been specified so far?
   * @param offsetPosition - How to transform all of the points
   */
  public constructor( positionArray: Float32Array | null, normalArray: Float32Array | null, uvArray: Float32Array | null, offset = 0, offsetPosition: Vector3 = Vector3.ZERO ) {

    this.positionArray = positionArray;
    this.normalArray = normalArray;
    this.uvArray = uvArray;
    this.positionIndex = offset * 3;
    this.normalIndex = offset * 3;
    this.uvIndex = offset * 2;
    this.offset = offset;
    this.offsetPosition = offsetPosition;
  }

  /**
   * Writes a position into the (optional) positionArray, and increments the offset.
   */
  public position( x: number, y: number, z: number ): void {
    if ( this.positionArray ) {
      this.positionArray[ this.positionIndex++ ] = x + this.offsetPosition.x;
      this.positionArray[ this.positionIndex++ ] = y + this.offsetPosition.y;
      this.positionArray[ this.positionIndex++ ] = z + this.offsetPosition.z;
    }

    this.offset++;
  }

  /**
   * Writes a normal into the (optional) normalArray
   */
  public normal( x: number, y: number, z: number ): void {
    if ( this.normalArray ) {
      this.normalArray[ this.normalIndex++ ] = x;
      this.normalArray[ this.normalIndex++ ] = y;
      this.normalArray[ this.normalIndex++ ] = z;
    }
  }

  /**
   * Writes a UV into the (optional) uvArray
   */
  public uv( u: number, v: number ): void {
    if ( this.uvArray ) {
      this.uvArray[ this.uvIndex++ ] = u;
      this.uvArray[ this.uvIndex++ ] = v;
    }
  }

  /**
   * Returns the offset (previous offset + number of triangles added, counted from the positionArray)
   */
  public getOffset(): number {
    return this.offset;
  }
}

mobius.register( 'TriangleArrayWriter', TriangleArrayWriter );
