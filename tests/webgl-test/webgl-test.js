// Copyright 2016, University of Colorado Boulder

requirejs( [ 'main', '../../scenery/js/main', '../../kite/js/main', '../../dot/js/main' ], function( mobius, scenery, kite, dot ) { // eslint-disable-line no-undef
  'use strict';

  $( document ).ready( function() {
    var canvas = $( '#canvas' )[0];

    // stop text selection on the canvas
    canvas.onselectstart = function() {
      return false;
    };

    if ( canvas.getContext ) {

      var shaderProgram;

      var gl = mobius.Util.initWebGL( canvas );

      var initShaders = function() {
        var fragmentShader = mobius.Util.getShaderFromDOM( gl, 'shader-fs' );
        var vertexShader = mobius.Util.getShaderFromDOM( gl, 'shader-vs' );

        shaderProgram = gl.createProgram();
        gl.attachShader( shaderProgram, vertexShader );
        gl.attachShader( shaderProgram, fragmentShader );
        gl.linkProgram( shaderProgram );

        if ( !gl.getProgramParameter( shaderProgram, gl.LINK_STATUS ) ) {
          alert( 'Could not initialise shaders' );
        }

        gl.useProgram( shaderProgram );

        shaderProgram.vertexPositionAttribute = gl.getAttribLocation( shaderProgram, 'aVertexPosition' );
        gl.enableVertexAttribArray( shaderProgram.vertexPositionAttribute );

        shaderProgram.pMatrixUniform = gl.getUniformLocation( shaderProgram, 'uPMatrix' );
        shaderProgram.mvMatrixUniform = gl.getUniformLocation( shaderProgram, 'uMVMatrix' );
        shaderProgram.inverseTransposeMatrixUniform = gl.getUniformLocation( shaderProgram, 'uInverseTransposeMatrix' );
        shaderProgram.atomColor = gl.getUniformLocation( shaderProgram, 'atomColor' );

        shaderProgram.normalAttribute = gl.getAttribLocation( shaderProgram, 'aNormal' );
        gl.enableVertexAttribArray( shaderProgram.normalAttribute );
      };

      initShaders();

      gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

      gl.enable( gl.DEPTH_TEST );
      gl.enable( gl.BLEND );
      gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

      var colorWrapper = function( red, green, blue, alpha ) {
        return {
          preRender: function( args ) {
            gl.uniform4f( shaderProgram.atomColor, red, green, blue, alpha );
          },

          postRender: function( args ) {

          }
        };
      };

      var whiteColorWrapper = colorWrapper( 1, 1, 1, 1 );
      var centerColorWrapper = colorWrapper( 159 / 255.0, 102 / 255.0, 218 / 255.0, 1 );

      var defaultAtomRadius = 0.4;
      var defaultBondRadius = defaultAtomRadius / 4;

      var scene = new mobius.GLNode();
      scene.transform.append( dot.Matrix4.translation( 0, 0, -40 ) );
      scene.transform.append( dot.Matrix4.scaling( 5, 5, 5 ) );

      var sphere1 = new mobius.Sphere( gl, defaultAtomRadius, 25, 25 );
      sphere1.wrappers.push( centerColorWrapper );

      var bondDistance = 2;
      var bondSq2 = bondDistance / Math.sqrt( 2 );

      var sphere2 = new mobius.Sphere( gl, defaultAtomRadius, 25, 25 );
      sphere2.transform.append( dot.Matrix4.translation( -bondSq2, bondSq2, 0 ) );
      sphere2.wrappers.push( whiteColorWrapper );

      var sphere3 = new mobius.Sphere( gl, defaultAtomRadius, 25, 25 );
      sphere3.transform.append( dot.Matrix4.translation( bondSq2, -bondSq2, 0 ) );
      sphere3.wrappers.push( whiteColorWrapper );

      var cylinder = new mobius.Cylinder( gl, defaultBondRadius, bondDistance * 2, 16, 1 );
      cylinder.transform.append( dot.Matrix4.rotationZ( Math.PI / 4 ) );
      cylinder.transform.append( dot.Matrix4.rotationX( Math.PI / 2 ) );
      cylinder.wrappers.push( whiteColorWrapper );

      scene.addChild( sphere1 );
      scene.addChild( sphere2 );
      scene.addChild( sphere3 );
      scene.addChild( cylinder );

      // var rot = 0;
      var lastTime = 0;
      var timeElapsed = 0;

      var draw = function() {
        // Only continue if WebGL is available and working
        if ( gl ) {
          gl.viewportWidth = canvas.width;
          gl.viewportHeight = canvas.height;

          gl.viewport( 0, 0, gl.viewportWidth, gl.viewportHeight );
          gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

          var projectionMatrix = dot.Matrix4.gluPerspective( 25.0 / 180.0 * Math.PI, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0 );
          gl.uniformMatrix4fv( shaderProgram.pMatrixUniform, false, projectionMatrix.entries );

          var args = new mobius.GLNode.RenderState();
          args.transformAttribute = shaderProgram.mvMatrixUniform;
          args.inverseTransposeAttribute = shaderProgram.inverseTransposeMatrixUniform;
          args.positionAttribute = shaderProgram.vertexPositionAttribute;
          args.normalAttribute = shaderProgram.normalAttribute;

          scene.transform.append( dot.Matrix4.rotationY( (Math.PI / 2 * timeElapsed) / 1000.0 ) );

          scene.render( args );
        }
      };

      var animate = function() {
        // rot += (Math.PI / 2 * timeElapsed) / 1000.0;
      };

      var tick = function() {
        window.requestAnimationFrame( tick, canvas );
        var timeNow = new Date().getTime();
        if ( lastTime !== 0 ) {
          timeElapsed = timeNow - lastTime;
        }
        lastTime = timeNow;

        animate();
        draw();
      };

      var usePointerCursor = false;

      var updateCursor = function( x, y ) {
        if ( usePointerCursor ) {
          $( canvas ).css( 'cursor', 'pointer' );
        }
        else {
          $( canvas ).css( 'cursor', 'auto' );
        }
      };

      var resizer = function() {
        canvas.width = $( window ).width();
        canvas.height = $( window ).height();
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
        draw();
      };
      $( window ).resize( resizer );

      tick();

      var moveListener = function( x, y ) {
        updateCursor( x, y );
      };

      var downListener = function( x, y ) {
        updateCursor( x, y );
      };

      var upListener = function( x, y ) {
        updateCursor( x, y );
      };

      var touchFromJQueryEvent = function( evt ) {
        return evt.originalEvent.targetTouches[0];
      };

      $( canvas ).bind( 'mousemove', function( evt ) {
        evt.preventDefault();
        moveListener( evt.pageX, evt.pageY );
      } );
      $( canvas ).bind( 'mousedown', function( evt ) {
        evt.preventDefault();
        downListener( evt.pageX, evt.pageY );
      } );
      $( canvas ).bind( 'mouseup', function( evt ) {
        evt.preventDefault();
        upListener( evt.pageX, evt.pageY );
      } );
      $( canvas ).bind( 'touchmove', function( evt ) {
        evt.preventDefault();
        var touch = touchFromJQueryEvent( evt );
        moveListener( touch.pageX, touch.pageY );
      } );
      $( canvas ).bind( 'touchstart', function( evt ) {
        evt.preventDefault();
        var touch = touchFromJQueryEvent( evt );
        downListener( touch.pageX, touch.pageY );
      } );
      $( canvas ).bind( 'touchend', function( evt ) {
        evt.preventDefault();
        var touch = touchFromJQueryEvent( evt );
        upListener( touch.pageX, touch.pageY );
      } );
      $( canvas ).bind( 'touchcancel', function( evt ) {
        evt.preventDefault();
        var touch = touchFromJQueryEvent( evt );
        upListener( touch.pageX, touch.pageY );
      } );
      resizer();
    }
  } );
} );
