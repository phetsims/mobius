// Copyright 2016, University of Colorado Boulder

requirejs( [ 'main', '../../scenery/js/main', '../../kite/js/main', '../../dot/js/main' ], function( mobius, scenery, kite, dot ) { // eslint-disable-line no-undef
  'use strict';

  $( document ).ready( function() {
    const canvas = $( '#canvas' )[0];

    // stop text selection on the canvas
    canvas.onselectstart = function() {
      return false;
    };

    if ( canvas.getContext ) {

      let shaderProgram;

      const gl = mobius.Utils.initWebGL( canvas );

      const initShaders = function() {
        const fragmentShader = mobius.Utils.getShaderFromDOM( gl, 'shader-fs' );
        const vertexShader = mobius.Utils.getShaderFromDOM( gl, 'shader-vs' );

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

      const colorWrapper = function( red, green, blue, alpha ) {
        return {
          preRender: function( args ) {
            gl.uniform4f( shaderProgram.atomColor, red, green, blue, alpha );
          },

          postRender: function( args ) {

          }
        };
      };

      const whiteColorWrapper = colorWrapper( 1, 1, 1, 1 );
      const centerColorWrapper = colorWrapper( 159 / 255.0, 102 / 255.0, 218 / 255.0, 1 );

      const defaultAtomRadius = 0.4;
      const defaultBondRadius = defaultAtomRadius / 4;

      const scene = new mobius.GLNode();
      scene.transform.append( dot.Matrix4.translation( 0, 0, -40 ) );
      scene.transform.append( dot.Matrix4.scaling( 5, 5, 5 ) );

      const sphere1 = new mobius.Sphere( gl, defaultAtomRadius, 25, 25 );
      sphere1.wrappers.push( centerColorWrapper );

      const bondDistance = 2;
      const bondSq2 = bondDistance / Math.sqrt( 2 );

      const sphere2 = new mobius.Sphere( gl, defaultAtomRadius, 25, 25 );
      sphere2.transform.append( dot.Matrix4.translation( -bondSq2, bondSq2, 0 ) );
      sphere2.wrappers.push( whiteColorWrapper );

      const sphere3 = new mobius.Sphere( gl, defaultAtomRadius, 25, 25 );
      sphere3.transform.append( dot.Matrix4.translation( bondSq2, -bondSq2, 0 ) );
      sphere3.wrappers.push( whiteColorWrapper );

      const cylinder = new mobius.Cylinder( gl, defaultBondRadius, bondDistance * 2, 16, 1 );
      cylinder.transform.append( dot.Matrix4.rotationZ( Math.PI / 4 ) );
      cylinder.transform.append( dot.Matrix4.rotationX( Math.PI / 2 ) );
      cylinder.wrappers.push( whiteColorWrapper );

      scene.addChild( sphere1 );
      scene.addChild( sphere2 );
      scene.addChild( sphere3 );
      scene.addChild( cylinder );

      // var rot = 0;
      let lastTime = 0;
      let timeElapsed = 0;

      const draw = function() {
        // Only continue if WebGL is available and working
        if ( gl ) {
          gl.viewportWidth = canvas.width;
          gl.viewportHeight = canvas.height;

          gl.viewport( 0, 0, gl.viewportWidth, gl.viewportHeight );
          gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

          const projectionMatrix = dot.Matrix4.gluPerspective( 25.0 / 180.0 * Math.PI, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0 );
          gl.uniformMatrix4fv( shaderProgram.pMatrixUniform, false, projectionMatrix.entries );

          const args = new mobius.GLNode.RenderState();
          args.transformAttribute = shaderProgram.mvMatrixUniform;
          args.inverseTransposeAttribute = shaderProgram.inverseTransposeMatrixUniform;
          args.positionAttribute = shaderProgram.vertexPositionAttribute;
          args.normalAttribute = shaderProgram.normalAttribute;

          scene.transform.append( dot.Matrix4.rotationY( (Math.PI / 2 * timeElapsed) / 1000.0 ) );

          scene.render( args );
        }
      };

      const animate = function() {
        // rot += (Math.PI / 2 * timeElapsed) / 1000.0;
      };

      var tick = function() {
        window.requestAnimationFrame( tick, canvas );
        const timeNow = new Date().getTime();
        if ( lastTime !== 0 ) {
          timeElapsed = timeNow - lastTime;
        }
        lastTime = timeNow;

        animate();
        draw();
      };

      const usePointerCursor = false;

      const updateCursor = function( x, y ) {
        if ( usePointerCursor ) {
          $( canvas ).css( 'cursor', 'pointer' );
        }
        else {
          $( canvas ).css( 'cursor', 'auto' );
        }
      };

      const resizer = function() {
        canvas.width = $( window ).width();
        canvas.height = $( window ).height();
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
        draw();
      };
      $( window ).resize( resizer );

      tick();

      const moveListener = function( x, y ) {
        updateCursor( x, y );
      };

      const downListener = function( x, y ) {
        updateCursor( x, y );
      };

      const upListener = function( x, y ) {
        updateCursor( x, y );
      };

      const touchFromJQueryEvent = function( evt ) {
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
        const touch = touchFromJQueryEvent( evt );
        moveListener( touch.pageX, touch.pageY );
      } );
      $( canvas ).bind( 'touchstart', function( evt ) {
        evt.preventDefault();
        const touch = touchFromJQueryEvent( evt );
        downListener( touch.pageX, touch.pageY );
      } );
      $( canvas ).bind( 'touchend', function( evt ) {
        evt.preventDefault();
        const touch = touchFromJQueryEvent( evt );
        upListener( touch.pageX, touch.pageY );
      } );
      $( canvas ).bind( 'touchcancel', function( evt ) {
        evt.preventDefault();
        const touch = touchFromJQueryEvent( evt );
        upListener( touch.pageX, touch.pageY );
      } );
      resizer();
    }
  } );
} );
