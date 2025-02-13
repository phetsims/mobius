// Copyright 2019-2024, University of Colorado Boulder

/**
 * Exports three.js (if embedded) in the mobius namespace.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import mobius from './mobius.js';

export default THREE;
mobius.register( 'THREE', THREE );