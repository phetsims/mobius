
// Copyright 2013-2019, University of Colorado Boulder

/**
 * Configuration file for development purposes, NOT for production deployments.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

require.config( {
// depends on all of Mobius, Scenery, Kite, and Dot
  deps: [ 'main', '/scenery/js/main', '/kite/js/main', '/dot/js/main', '/phet-core/js/main', '/utterance-queue/js/main' ],

  paths: {
    MOBIUS: '.',
    SCENERY: '../../scenery/js',
    KITE: '../../kite/js',
    DOT: '../../dot/js',
    PHET_CORE: '../../phet-core/js',
    AXON: '../../axon/js',
    UTTERANCE_QUEUE: '../../utterance-queue/js'
  },

// optional cache bust to make browser refresh load all included scripts, can be disabled with ?cacheBust=false
  urlArgs: phet.chipper.getCacheBustArgs()
} );