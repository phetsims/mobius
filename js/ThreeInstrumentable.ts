// Copyright 2021, University of Colorado Boulder

/**
 * Mixin for THREE.Object3D types that handles instrumentation details.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import ThreeObject3DPhetioObject from './ThreeObject3DPhetioObject.js';
import mobius from './mobius.js';
import Constructor from '../../phet-core/js/Constructor.js';
import memoize from '../../phet-core/js/memoize.js';

/**
 * @param type - Should be THREE.Object3D or a subtype
 */
const ThreeInstrumentable = memoize( <SuperType extends Constructor>( type: SuperType ) => {

  return class extends type {

    phetioObject: ThreeObject3DPhetioObject;

    /**
     * Pass tandem as the first arg, the rest will be passed through
     */
    constructor( ...args: any[] ) {
      const options = args[ args.length - 1 ];
      const threeArgs = args.slice( 0, args.length - 1 );

      super( ...threeArgs );

      this.phetioObject = new ThreeObject3DPhetioObject( options );
    }

    /**
     * Releases references
     */
    dispose() {
      // @ts-ignore
      super.dispose && super.dispose();

      this.phetioObject.dispose();
    }
  };
} );

mobius.register( 'ThreeInstrumentable', ThreeInstrumentable );
export default ThreeInstrumentable;