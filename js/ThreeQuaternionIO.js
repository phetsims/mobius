// Copyright 2021, University of Colorado Boulder

/**
 * IO Type for three.js Quaternion type
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import IOType from '../../tandem/js/types/IOType.js';
import mobius from './mobius.js';

const ThreeQuaternionIO = new IOType( 'ThreeQuaternionIO', {
  valueType: THREE.Quaternion,
  documentation: 'A numerical object representing a quaternion',
  toStateObject: quaternion => {
    return {
      x: quaternion.x,
      y: quaternion.y,
      z: quaternion.z,
      w: quaternion.w
    };
  },
  fromStateObject: obj => {
    return new THREE.Quaternion( obj.x, obj.y, obj.z, obj.w );
  },
  applyState: ( quaternion, obj ) => {
    quaternion.set( obj.x, obj.y, obj.z, obj.w );
  },
  stateToArgsForConstructor: obj => [ obj.x, obj.y, obj.z, obj.w ]
} );

mobius.register( 'ThreeQuaternionIO', ThreeQuaternionIO );
export default ThreeQuaternionIO;