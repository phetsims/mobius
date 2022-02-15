// Copyright 2021, University of Colorado Boulder

/**
 * IO Type for three.js Quaternion type
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import IOType from '../../tandem/js/types/IOType.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import mobius from './mobius.js';

type ThreeQuaternionStateObject = {
  x: number;
  y: number;
  z: number;
  w: number;
};

const ThreeQuaternionIO = new IOType( 'ThreeQuaternionIO', {
  valueType: THREE.Quaternion,
  documentation: 'A numerical object representing a quaternion',
  toStateObject: ( quaternion: THREE.Quaternion ): ThreeQuaternionStateObject => {
    return {
      x: quaternion.x,
      y: quaternion.y,
      z: quaternion.z,
      w: quaternion.w
    };
  },
  stateSchema: {
    x: NumberIO,
    y: NumberIO,
    z: NumberIO,
    w: NumberIO
  },
  fromStateObject: ( obj: ThreeQuaternionStateObject ) => {
    return new THREE.Quaternion( obj.x, obj.y, obj.z, obj.w );
  },
  applyState: ( quaternion: THREE.Quaternion, obj: ThreeQuaternionStateObject ) => {
    quaternion.set( obj.x, obj.y, obj.z, obj.w );
  },
  stateToArgsForConstructor: ( obj: ThreeQuaternionStateObject ) => [ obj.x, obj.y, obj.z, obj.w ]
} );

mobius.register( 'ThreeQuaternionIO', ThreeQuaternionIO );
export default ThreeQuaternionIO;