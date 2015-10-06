// Copyright 2002-2015, University of Colorado Boulder

/**
 * Module that includes all Mobius dependencies, so that requiring this module will return an object
 * that consists of the entire exported 'mobius' namespace API.
 *
 * The API is actually generated by the 'mobius' module, so if this module (or all other modules) are
 * not included, the 'mobius' namespace may not be complete.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

define( [
  'MOBIUS/mobius',

  'MOBIUS/Cylinder',
  'MOBIUS/Display',
  'MOBIUS/GLNode',
  'MOBIUS/Quad',
  'MOBIUS/ShaderProgram',
  'MOBIUS/Sphere',
  'MOBIUS/StageCenteringCanvasTransform',
  'MOBIUS/Util'
], function( mobius // note: we don't need any of the other parts, we just need to specify them as dependencies so they fill in the mobius namespace
) {
  'use strict';

  return mobius;
} );
