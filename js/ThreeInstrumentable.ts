// Copyright 2021-2022, University of Colorado Boulder

/**
 * Mixin for THREE.Object3D types that handles instrumentation details.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import ThreeObject3DPhetioObject from './ThreeObject3DPhetioObject.js';
import mobius from './mobius.js';
import Constructor from '../../phet-core/js/types/Constructor.js';
import memoize from '../../phet-core/js/memoize.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';

/**
 * @param type - Should be THREE.Object3D or a subtype
 */
const ThreeInstrumentable = memoize( <SuperType extends Constructor>( type: SuperType ) => {

  return class ThreeInstrumentableMixin extends type {

    public phetioObject: ThreeObject3DPhetioObject;

    /**
     * Pass tandem as the first arg, the rest will be passed through
     */
    public constructor( ...args: IntentionalAny[] ) {
      const options = args[ args.length - 1 ];
      const threeArgs = args.slice( 0, args.length - 1 );

      super( ...threeArgs );

      this.phetioObject = new ThreeObject3DPhetioObject( options );
    }

    /**
     * Releases references
     */
    public dispose(): void {
      // @ts-expect-error
      super.dispose && super.dispose();

      this.phetioObject.dispose();
    }
  };
} );

mobius.register( 'ThreeInstrumentable', ThreeInstrumentable );
export default ThreeInstrumentable;