// Copyright 2021-2022, University of Colorado Boulder

/**
 * Query parameters supported by mobius
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import mobius from './mobius.js';

const MobiusQueryParameters = QueryStringMachine.getAll( {
  // In screenshots or Canvas displays, what level of supersampling should be done (e.g. 3 results in 3x3 of pixels
  // being downscaled to 1 pixel).
  // Lower quality OK'ed in https://github.com/phetsims/density/issues/70
  mobiusCanvasSupersampling: {
    type: 'number',
    defaultValue: 1
  },

  // Whether we should ignore gamma correction in supersampling (for screenshots and such)
  // Lower quality OK'ed in https://github.com/phetsims/density/issues/70
  mobiusCanvasSkipGamma: {
    type: 'boolean',
    defaultValue: true
  }
} );

mobius.register( 'MobiusQueryParameters', MobiusQueryParameters );
export default MobiusQueryParameters;