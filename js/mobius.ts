// Copyright 2013-2022, University of Colorado Boulder

/**
 * The main 'mobius' namespace object for the exported (non-Require.js) API. Used internally
 * since it prevents Require.js issues with circular dependencies.
 *
 * The returned mobius object namespace may be incomplete if not all modules are listed as
 * dependencies. Please use the 'main' module for that purpose if all of Scenery is desired.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Namespace from '../../phet-core/js/Namespace.js';

export default new Namespace( 'mobius' );