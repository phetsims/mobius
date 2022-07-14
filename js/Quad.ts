// Copyright 2019-2022, University of Colorado Boulder

/**
 * Creates a position/normal/uv mapped quad based on vertices in a high-performance way.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import mobius from './mobius.js';
import TriangleArrayWriter from './TriangleArrayWriter.js';
import Vector3 from '../../dot/js/Vector3.js';

export default class Quad extends THREE.BufferGeometry {

  private readonly _update: ( p0x: number, p0y: number, p0z: number, p1x: number, p1y: number, p1z: number, p2x: number, p2y: number, p2z: number, p3x: number, p3y: number, p3z: number, nx: number, ny: number, nz: number ) => void;

  public constructor( p0x: number, p0y: number, p0z: number, p1x: number, p1y: number, p1z: number, p2x: number, p2y: number, p2z: number, p3x: number, p3y: number, p3z: number, nx: number, ny: number, nz: number ) {

    super();

    const numElements = 6;

    const positionArray = new Float32Array( numElements * 3 );
    const normalArray = new Float32Array( numElements * 3 );
    const uvArray = new Float32Array( numElements * 2 );

    Quad.updateArrays( positionArray, normalArray, uvArray, p0x, p0y, p0z, p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z, nx, ny, nz );

    this.addAttribute( 'position', new THREE.BufferAttribute( positionArray, 3 ) );
    this.addAttribute( 'normal', new THREE.BufferAttribute( normalArray, 3 ) );
    this.addAttribute( 'uv', new THREE.BufferAttribute( uvArray, 2 ) );

    this._update = ( p0x: number, p0y: number, p0z: number, p1x: number, p1y: number, p1z: number, p2x: number, p2y: number, p2z: number, p3x: number, p3y: number, p3z: number, nx: number, ny: number, nz: number ) => {
      Quad.updateArrays( positionArray, normalArray, uvArray, p0x, p0y, p0z, p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z, nx, ny, nz );
      this.attributes.position.needsUpdate = true;
      this.attributes.normal.needsUpdate = true;
      this.computeBoundingSphere();
    };
  }

  public set( p0x: number, p0y: number, p0z: number, p1x: number, p1y: number, p1z: number, p2x: number, p2y: number, p2z: number, p3x: number, p3y: number, p3z: number, nx: number, ny: number, nz: number ): void {
    this._update( p0x, p0y, p0z, p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z, nx, ny, nz );
  }

  /**
   * Updates provided geometry arrays given the specific size.
   *
   * @param positionArray
   * @param normalArray
   * @param uvArray
   * @param p0x
   * @param p0y
   * @param p0z
   * @param p1x
   * @param p1y
   * @param p1z
   * @param p2x
   * @param p2y
   * @param p2z
   * @param p3x
   * @param p3y
   * @param p3z
   * @param nx
   * @param ny
   * @param nz
   * @param offset - How many vertices have been specified so far?
   * @param offsetPosition - How to transform all the points
   * @returns - The offset after the specified vertices have been written
   */
  public static updateArrays( positionArray: Float32Array | null, normalArray: Float32Array | null, uvArray: Float32Array | null, p0x: number, p0y: number, p0z: number, p1x: number, p1y: number, p1z: number, p2x: number, p2y: number, p2z: number, p3x: number, p3y: number, p3z: number, nx: number, ny: number, nz: number, offset = 0, offsetPosition: Vector3 = Vector3.ZERO ): number {
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
