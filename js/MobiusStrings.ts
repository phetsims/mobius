// Copyright 2021-2022, University of Colorado Boulder

/**
 * Auto-generated from modulify, DO NOT manually modify.
 */
/* eslint-disable */
import getStringModule from '../../chipper/js/getStringModule.js';
import TReadOnlyProperty from '../../axon/js/TReadOnlyProperty.js';
import mobius from './mobius.js';

type StringsType = {
  'mobius': {
    'title': string;
    'titleStringProperty': TReadOnlyProperty<string>;
  }
};

const mobiusStrings = getStringModule( 'MOBIUS' ) as StringsType;

mobius.register( 'mobiusStrings', mobiusStrings );

export default mobiusStrings;
