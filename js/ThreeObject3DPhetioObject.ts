// Copyright 2021-2022, University of Colorado Boulder

/**
 * PhetioObject used by composition for THREE.Object3D
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import optionize, { EmptySelfOptions } from '../../phet-core/js/optionize.js';
import PhetioObject, { PhetioObjectOptions } from '../../tandem/js/PhetioObject.js';
import Tandem from '../../tandem/js/Tandem.js';
import IOType from '../../tandem/js/types/IOType.js';
import mobius from './mobius.js';

type SelfOptions = EmptySelfOptions;
type ThreeObject3DPhetioObjectOptions = SelfOptions & PhetioObjectOptions;

export default class ThreeObject3DPhetioObject extends PhetioObject {
  public constructor( providedOptions?: ThreeObject3DPhetioObjectOptions ) {

    const options = optionize<ThreeObject3DPhetioObjectOptions, SelfOptions, PhetioObjectOptions>()( {
      phetioType: ThreeObject3DPhetioObject.ThreeObject3DIO,
      tandem: Tandem.REQUIRED
    }, providedOptions );

    super( options );
  }

  public static ThreeObject3DIO = new IOType( 'ThreeObject3DIO', {
    valueType: ThreeObject3DPhetioObject,
    toStateObject: () => {
      return {};
    },
    stateSchema: {}
  } );
}

mobius.register( 'ThreeObject3DPhetioObject', ThreeObject3DPhetioObject );
