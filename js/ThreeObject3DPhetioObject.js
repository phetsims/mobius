// Copyright 2021, University of Colorado Boulder

/**
 * PhetioObject used by composition for THREE.Object3D
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import merge from '../../phet-core/js/merge.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import Tandem from '../../tandem/js/Tandem.js';
import IOType from '../../tandem/js/types/IOType.js';
import mobius from './mobius.js';

class ThreeObject3DPhetioObject extends PhetioObject {
  /**
   * @param {Object} [options]
   */
  constructor( options ) {
    options = merge( {
      phetioType: ThreeObject3DPhetioObject.ThreeObject3DIO,
      tandem: Tandem.REQUIRED
    }, options );

    super( options );
  }
}

ThreeObject3DPhetioObject.ThreeObject3DIO = new IOType( 'ThreeObject3DIO', {
  valueType: ThreeObject3DPhetioObject,
  toStateObject: () => {
    return {};
  }
} );

mobius.register( 'ThreeObject3DPhetioObject', ThreeObject3DPhetioObject );
export default ThreeObject3DPhetioObject;