// Copyright 2002-2015, University of Colorado Boulder

/**
 * Configuration file for development purposes, NOT for production deployments.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

require.config( {
  // depends on all of Mobius, Scenery, Kite, and Dot
  deps: [ 'main', 'SCENERY/main', 'KITE/main', 'DOT/main', 'PHET_CORE/main' ],

  paths: {
    MOBIUS: '.',
    SCENERY: '../../scenery/js',
    KITE: '../../kite/js',
    DOT: '../../dot/js',
    PHET_CORE: '../../phet-core/js',
    AXON: '../../axon/js'
  },

  // optional cache buster to make browser refresh load all included scripts, can be disabled with ?cacheBuster=false
  urlArgs: phet.chipper.getCacheBusterArgs()
} );
