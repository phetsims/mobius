// Copyright 2021, University of Colorado Boulder

/**
 * Mixin for THREE.Object3D types that handles instrumentation details.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import ThreeObject3DPhetioObject from './ThreeObject3DPhetioObject.js';
import mobius from './mobius.js';

/**
 * @param {constructor} type - Should be THREE.Object3D or a subtype
 */
const ThreeInstrumentable = type => {
  return class extends type {
    /**
     * @param {Tandem} tandem
     * @param {*} ...args
     */
    constructor( ...args ) {
      const options = args[ args.length - 1 ];
      const threeArgs = args.slice( 0, args.length - 1 );

      super( ...threeArgs );

      // @private {ThreeObject3DPhetioObject}
      this.phetioObject = new ThreeObject3DPhetioObject( options );
    }

    /**
     * Releases references
     * @public
     */
    dispose() {
      super.dispose && super.dispose();

      this.phetioObject.dispose();
    }
  };
};

mobius.register( 'ThreeInstrumentable', ThreeInstrumentable );
export default ThreeInstrumentable;