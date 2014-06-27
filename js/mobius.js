// Copyright 2002-2014, University of Colorado

/**
 * The main 'mobius' namespace object for the exported (non-Require.js) API. Used internally
 * since it prevents Require.js issues with circular dependencies.
 *
 * The returned mobius object namespace may be incomplete if not all modules are listed as
 * dependencies. Please use the 'main' module for that purpose if all of Scenery is desired.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

define( function( require ) {
  'use strict';

  window.assert = window.assert || require( 'ASSERT/assert' )( 'basic' );
  window.assertSlow = window.assertSlow || require( 'ASSERT/assert' )( 'slow', true );

  // object allocation tracking
  window.phetAllocation = require( 'PHET_CORE/phetAllocation' );

  // will be filled in by other modules
  return {
    assert: assert
  };
} );
