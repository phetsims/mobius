// Copyright 2021-2024, University of Colorado Boulder

/**
 * Query parameters supported by mobius
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { QueryStringMachine } from '../../query-string-machine/js/QueryStringMachineModule.js';
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
  },

  /**
   * Controls whether the preserveDrawingBuffer:true is set on WebGL Canvases. This allows canvas.toDataURL() to work
   * (used for certain methods that require screenshot generation using foreign object rasterization, etc.).
   * Generally reduces WebGL performance, so it should not always be on (thus the query parameter).
   */
  threeRendererPreserveDrawingBuffer: { type: 'flag' },

  /**
   * Sets device pixel ratio. This is usually used for HiDPI device to prevent blurring output canvas. When setting the
   * renderer pixel ratio to window.devicePixelRatio, it will have the highest resolution for that device. Setting
   * anything lower will be more blurry, but will save vRAM. Note that we observed window.devicePixelRatio to be 2
   * on Mac/chrome, 2 on iPad 7, and 3 on iPhone 15 Pro Max.
   *
   * Added as part of https://github.com/phetsims/density-buoyancy-common/issues/316
   */
  threeRendererPixelRatio: {
    type: 'number',
    defaultValue: window.devicePixelRatio || 1
  },

  /**
   * Antialiasing makes diagonal lines look smoother, but uses more vRAM. Set to false to turn off antialiasing for
   * THREE.js renderer.
   *
   * Added as part of https://github.com/phetsims/density-buoyancy-common/issues/316
   */
  threeRendererAntialias: {
    type: 'boolean',
    defaultValue: true
  }
} );

mobius.register( 'MobiusQueryParameters', MobiusQueryParameters );
export default MobiusQueryParameters;