// Copyright 2002-2015, University of Colorado Boulder

/**
 * Handles the stage to canvas transforms that allow scaling based on how large the canvas is to a fixed stage size.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

define( function( require ) {
  'use strict';

  var inherit = require( 'PHET_CORE/inherit' );
  var Matrix4 = require( 'DOT/Matrix4' );
  var Transform4 = require( 'DOT/Transform4' );
  var Property = require( 'AXON/Property' );

  var StageCenteringCanvasTransform = function( canvasSizeProperty, stageSize ) {
    this.canvasSizeProperty = canvasSizeProperty;
    this.stageSize = stageSize;
    this.transform = new Property( null ); // updated by the listener below

    var that = this;
    canvasSizeProperty.link( function() {
      that.updateTransform();
    }, true );
  };

  // due to various scaling intricacies and the default way of constructing a perspective projection matrix
  StageCenteringCanvasTransform.fieldOfViewYFactor = function( canvasSize, stageSize ) {
    var sx = canvasSize.width / stageSize.width;
    var sy = canvasSize.height / stageSize.height;
    if ( sx === 0 || sy === 0 ) {
      return 1;
    }
    return sy > sx ? sy / sx : 1;
  };

  // returns a 4x4 matrix
  StageCenteringCanvasTransform.compute = function( canvasSize, stageSize ) {
    var sx = canvasSize.width / stageSize.width;
    var sy = canvasSize.height / stageSize.height;

    //use the smaller and maintain aspect ratio so that circles don't become ellipses
    var scale = sx < sy ? sx : sy;
    scale = scale <= 0 ? 1.0 : scale;//if scale is negative or zero, just use scale=1

    var scaledStageWidth = scale * stageSize.width;
    var scaledStageHeight = scale * stageSize.height;

    //center it in width and height
    return Matrix4.translation( canvasSize.width / 2 - scaledStageWidth / 2, canvasSize.height / 2 - scaledStageHeight / 2 ).timesMatrix( Matrix4.scaling( scale ) );
  };

  return inherit( Object, StageCenteringCanvasTransform, {

    fieldOfViewYFactor: function() {
      return StageCenteringCanvasTransform.fieldOfViewYFactor( this.canvasSizeProperty.get(), this.stageSize );
    },

    updateTransform: function() {
      var matrix4 = StageCenteringCanvasTransform.compute( this.canvasSizeProperty.get(), this.stageSize );

      this.transform.set( new Transform4( matrix4 ) );
    }
  } );
} );
