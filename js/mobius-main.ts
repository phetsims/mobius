// Copyright 2021-2022, University of Colorado Boulder

/**
 * Main file for the mobius library demo.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Property from '../../axon/js/Property.js';
import Screen from '../../joist/js/Screen.js';
import ScreenIcon from '../../joist/js/ScreenIcon.js';
import Sim, { SimOptions } from '../../joist/js/Sim.js';
import simLauncher from '../../joist/js/simLauncher.js';
import { Rectangle } from '../../scenery/js/imports.js';
import Tandem from '../../tandem/js/Tandem.js';
import MobiusDemoScreenView from './MobiusDemoScreenView.js';
import MobiusStrings from './MobiusStrings.js';

// empty model used for all demo screens
const MODEL = {
  reset: () => { /* nothing to do */ }
};

const simOptions: SimOptions = {
  credits: {
    leadDesign: 'PhET'
  },
  webgl: true
};

// Create and start sim
simLauncher.launch( () => {
  new Sim( MobiusStrings.mobius.titleStringProperty, [
    new Screen(
      () => MODEL,
      () => new MobiusDemoScreenView(),
      {
        name: new Property( 'Buttons' ),
        backgroundColorProperty: new Property( 'black' ),
        homeScreenIcon: new ScreenIcon(
          new Rectangle( 0, 0, Screen.MINIMUM_HOME_SCREEN_ICON_SIZE.width, Screen.MINIMUM_HOME_SCREEN_ICON_SIZE.height, {
            fill: 'red'
          } )
        ),
        tandem: Tandem.ROOT.createTandem( 'buttonsScreen' )
      }
    )
  ], simOptions ).start();
} );