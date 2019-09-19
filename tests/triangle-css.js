// Copyright 2016, University of Colorado Boulder

require( [ 'config' ], function() {
  'use strict';

  /* eslint-disable no-undef */

  require( [ 'main', 'SCENERY/main', 'KITE/main', 'DOT/main', 'PHET_CORE/main' ], function( mobius, scenery, kite, dot, phetCore ) {
    window.mobius = mobius;
    window.scenery = scenery;
    window.kite = kite;
    window.dot = dot;
    window.phetCore = phetCore;

    console.log( 'loaded' );

    // var overTwoN = 1 / ( 2 * triangleSize );
    // var triangleInverseMatrix = dot.Matrix3.createFromPool( -overTwoN, -overTwoN,        1,
    //                                              0,         1 / triangleSize, 0,
    //                                              overTwoN,  -overTwoN,        0 );
    // var triangleInverseMatrix = dot.Matrix3.createFromPool( 0, triangleSize, 2 * triangleSize,
    //                                              0, triangleSize, 0,
    //                                              1, 1,            1 ).inverted();
    const pad = window.padTriangles || 0;
    const triangleInverseMatrix = dot.Matrix3.createFromPool( pad, triangleSize, 2 * triangleSize - pad,
      pad, triangleSize - pad, pad,
      1, 1, 1 ).inverted();

    // a,b,c {Vector3}
    const tmpMatrix3 = dot.Matrix3.createFromPool();
    window.setTriangleTransform = function( matrix4, a, b, c ) {
      // we solve for the 4x4 matrix that will transform (0,0) => a, (triangleSize,triangleSize) => b, (2*triangleSize,0) => c
      // we also want the affine matrix that is of a certain form for the ignored initial z indices (think (x,y,0,1) as input)
      const m = tmpMatrix3.rowMajor( a.x, b.x, c.x, a.y, b.y, c.y, a.z, b.z, c.z ).multiplyMatrix( triangleInverseMatrix );
      return matrix4.rowMajor( m.m00(), m.m01(), 0, m.m02(),
        m.m10(), m.m11(), 0, m.m12(),
        m.m20(), m.m21(), 1, m.m22(),
        0, 0, 0, 1 );
    };

    const phi = ( 1 + Math.sqrt( 5 ) ) / 2;

    const icosahedronPoints = [
      dot.v3( 0, 1, phi ),   // 0
      dot.v3( 0, -1, phi ),  // 1
      dot.v3( 0, 1, -phi ),  // 2
      dot.v3( 0, -1, -phi ), // 3

      dot.v3( 1, phi, 0 ),   // 4
      dot.v3( -1, phi, 0 ),  // 5
      dot.v3( 1, -phi, 0 ),  // 6
      dot.v3( -1, -phi, 0 ), // 7

      dot.v3( phi, 0, 1 ),   // 8
      dot.v3( phi, 0, -1 ),  // 9
      dot.v3( -phi, 0, 1 ),  // 10
      dot.v3( -phi, 0, -1 )  // 11
    ];
    for ( let j = 0; j < icosahedronPoints.length; j++ ) {
      icosahedronPoints[ j ] = icosahedronPoints[ j ].times( 100 );
    }
    const vertexMagnitude = icosahedronPoints[ 0 ].magnitude;

    let icosahedronFaces = [
      [ 4, 5, 0 ],
      [ 5, 4, 2 ],
      [ 4, 0, 8 ],
      [ 4, 8, 9 ],
      [ 4, 9, 2 ],
      [ 0, 5, 10 ],
      [ 5, 10, 11 ],
      [ 5, 11, 2 ],
      [ 0, 10, 1 ],
      [ 8, 0, 1 ],
      [ 2, 3, 11 ],
      [ 9, 3, 2 ],
      [ 1, 7, 6 ],
      [ 3, 6, 7 ],
      [ 8, 1, 6 ],
      [ 8, 6, 9 ],
      [ 9, 6, 3 ],
      [ 10, 7, 1 ],
      [ 7, 10, 11 ],
      [ 7, 11, 3 ]
    ];

    while ( subdivisions ) {
      subdivisions--;

      // add new points
      const n = icosahedronPoints.length;
      var map = {};
      for ( var ia = 0; ia < n; ia++ ) {
        for ( var ib = ia + 1; ib < n; ib++ ) {
          // guaranteed unique pairs, ia < ib

          if ( _.some( icosahedronFaces, function( face ) { return _.includes( face, ia ) && _.includes( face, ib ); } ) ) {
            // adjacent vertices, create a new vertex in-between with the same magnitude
            const idx = icosahedronPoints.length;
            icosahedronPoints.push( icosahedronPoints[ ia ].plus( icosahedronPoints[ ib ] ).normalized().times( vertexMagnitude ) );
            map[ ia + '-' + ib ] = idx; // store the index for later
          }
        }
      }

      // replace with all new faces
      var newFaces = [];
      _.each( icosahedronFaces, function( face ) {
        const a = face[ 0 ];
        const b = face[ 1 ];
        const c = face[ 2 ];
        // TODO: optimize so we only do one access with the smallest first?
        const ab = map[ a + '-' + b ] || map[ b + '-' + a ];
        const ac = map[ a + '-' + c ] || map[ c + '-' + a ];
        const bc = map[ b + '-' + c ] || map[ c + '-' + b ];
        if ( ab === undefined || ac === undefined || bc === undefined ) { throw new Error(); }

        // three outer faces
        newFaces.push( [ a, ab, ac ] );
        newFaces.push( [ b, bc, ab ] );
        newFaces.push( [ c, ac, bc ] );

        // one internal face
        newFaces.push( [ ab, bc, ac ] );
      } );
      icosahedronFaces = newFaces;
    }

    scenery.Util.polyfillRequestAnimationFrame();

    const triangles = [];
    const container = document.getElementById( 'container' );

    for ( let i = 0; i < icosahedronFaces.length; i++ ) {
      const div = document.createElement( 'div' );
      div.className = 'tri';
      div.style.borderLeft = triangleSize + 'px solid transparent';
      div.style.borderRight = triangleSize + 'px solid transparent';
      div.style.borderTop = triangleSize + 'px solid ' + {
        0: 'rgba(0,0,0,0.9)',
        1: 'rgba(255,0,0,0.9)',
        2: 'rgba(0,255,0,0.9)',
        3: 'rgba(0,0,255,0.9)',
        4: 'rgba(255,0,255,0.9)',
        5: 'rgba(255,255,0,0.9)',
        6: 'rgba(0,255,255,0.9)',
        7: 'rgba(128,0,255,0.9)',
        8: 'rgba(255,128,0,0.9)',
        9: 'rgba(0,255,128,0.9)',
        10: 'rgba(255,0,128,0.9)',
        11: 'rgba(128,255,0,0.9)',
        12: 'rgba(0,128,255,0.9)',
        13: 'rgba(128,0,0,0.9)',
        14: 'rgba(0,128,0,0.9)',
        15: 'rgba(0,0,128,0.9)',
        16: 'rgba(128,255,255,0.9)',
        17: 'rgba(255,128,255,0.9)',
        18: 'rgba(255,255,128,0.9)',
        19: 'rgba(128,128,128,0.9)'
      }[ i % 20 ];
      container.appendChild( div );
      triangles.push( div );
    }

    let rot = 0;
    let lastTime = 0;
    let timeElapsed = 0;

    // var canvasWidth = 512;
    // var canvasHeight = 512;
    // var fieldOfViewDegrees = 45 / 2;
    // var nearPlane = 1;
    // var farPlane = 1000;
    // var fieldOfViewRadians = ( fieldOfViewDegrees / 180 * Math.PI );
    // var projectionMatrix = dot.Matrix4.gluPerspective( fieldOfViewRadians,
    //   canvasWidth / canvasHeight,
    //   nearPlane, farPlane );

    const triangleTransformMatrix = new dot.Matrix4();

    function updateTriangles() {
      let k;

      const pts = [];
      const modelViewMatrix = dot.Matrix4.translation( 0, 0, -20 ).timesMatrix( dot.Matrix4.rotationY( rot ) );
      for ( k = 0; k < icosahedronPoints.length; k++ ) {
        pts.push( modelViewMatrix.timesVector3( icosahedronPoints[ k ] ) );
      }

      for ( k = 0; k < triangles.length; k++ ) {
        const faces = icosahedronFaces[ k ];
        triangles[ k ].style.webkitTransform = triangles[ k ].style.transform = ( setTriangleTransform( triangleTransformMatrix, pts[ faces[ 0 ] ], pts[ faces[ 1 ] ], pts[ faces[ 2 ] ] ) ).getCSSTransform();
      }
    }

    updateTriangles();

    const sunDirection = dot.v3( -1, 0.5, 2 ).normalized();
    const moonDirection = dot.v3( 2, -1, 1 ).normalized();
    const sunWeight = 0.8;
    const moonWeight = 0.6;

    function draw() {
      if ( window.containerUpdate ) {
        container.style.webkitTransform = container.style.transform = ( dot.Matrix4.rotationY( rot ) ).getCSSTransform();
      }
      else {
        updateTriangles();
      }
      if ( window.colorFaces ) {
        const reverseRotation = dot.Matrix4.rotationY( -rot ); // this is a fast way to get the inverse :)
        for ( let fidx = 0; fidx < icosahedronFaces.length; fidx++ ) {
          const face = icosahedronFaces[ fidx ];

          const normal = icosahedronPoints[ face[ 0 ] ].plus( icosahedronPoints[ face[ 1 ] ].plus( icosahedronPoints[ face[ 2 ] ] ) );
          const transformedNormal = reverseRotation.timesTransposeVector3( normal ).normalized();

          const sunTotal = Math.max( 0, transformedNormal.dot( sunDirection ) ) * sunWeight;
          const moonTotal = Math.max( 0, transformedNormal.dot( moonDirection ) ) * moonWeight;

          const weight = Math.min( 1, sunTotal + moonTotal );

          const borderStyle = triangleSize + 'px solid rgb(' + Math.floor( weight * 255 ) + ',' + Math.floor( weight * 255 ) + ',' + Math.floor( weight * 255 ) + ')';
          triangles[ fidx ].style.borderTop = borderStyle;
        }
      }
    }

    function animate() {
      rot += ( Math.PI / 2 * timeElapsed ) / 1000.0;
    }

    function tick() {
      window.requestAnimationFrame( tick, document.body );
      const timeNow = new Date().getTime();
      if ( lastTime !== 0 ) {
        timeElapsed = timeNow - lastTime;
      }
      lastTime = timeNow;

      animate();
      draw();
    }

    tick();
  } );

  /* eslint-enable */
} );
