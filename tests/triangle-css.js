// we need to wait until our config file is loaded before our require statement. apparently this was not guaranteed
function check() {
  if ( window.loadedMobiusConfig ) {
    require( [ 'main', 'SCENERY/main', 'KITE/main', 'DOT/main', 'PHET_CORE/main' ], function( mobius, scenery, kite, dot, core ) {
      window.mobius = mobius;
      window.scenery = scenery;
      window.kite = kite;
      window.dot = dot;
      window.core = core;
      
      console.log( 'loaded' );
      
      var overTwoN = 1 / ( 2 * triangleSize );
      var triangleInverseMatrix = new dot.Matrix3( -overTwoN, -overTwoN,        1,
                                                   0,         1 / triangleSize, 0,
                                                   overTwoN,  -overTwoN,        0 );
      
      // a,b,c {Vector3}
      var tmpMatrix3 = new dot.Matrix3();
      window.setTriangleTransform = function( matrix4, a, b, c ) {
        // we solve for the 4x4 matrix that will transform (0,0) => a, (triangleSize,triangleSize) => b, (2*triangleSize,0) => c
        // we also want the affine matrix that is of a certain form for the ignored initial z indices (think (x,y,0,1) as input)
        var m = tmpMatrix3.rowMajor( a.x, b.x, c.x, a.y, b.y, c.y, a.z, b.z, c.z ).multiplyMatrix( triangleInverseMatrix );
        return matrix4.rowMajor( m.m00(), m.m01(), 0, m.m02(),
                                 m.m10(), m.m11(), 0, m.m12(),
                                 m.m20(), m.m21(), 1, m.m22(),
                                 0,       0,       0, 1 );
      };
      
      var phi = ( 1 + Math.sqrt( 5 ) ) / 2;
      
      var icosahedronPoints = [
        dot( 0, 1, phi ),   // 0
        dot( 0, -1, phi ),  // 1
        dot( 0, 1, -phi ),  // 2
        dot( 0, -1, -phi ), // 3
        
        dot( 1, phi, 0 ),   // 4
        dot( -1, phi, 0 ),  // 5
        dot( 1, -phi, 0 ),  // 6
        dot( -1, -phi, 0 ), // 7
        
        dot( phi, 0, 1 ),   // 8
        dot( phi, 0, -1 ),  // 9
        dot( -phi, 0, 1 ),  // 10
        dot( -phi, 0, -1 )  // 11
      ];
      for ( var j = 0; j < icosahedronPoints.length; j++ ) {
        icosahedronPoints[j] = icosahedronPoints[j].times( 100 );
      }
      var vertexMagnitude = icosahedronPoints[0].magnitude();
      
      var icosahedronFaces = [
        [4, 5, 0],
        [5, 4, 2],
        [4, 0, 8],
        [4, 8, 9],
        [4, 9, 2],
        [0, 5, 10],
        [5, 10, 11],
        [5, 11, 2],
        [0, 10, 1],
        [8, 0, 1],
        [2, 3, 11],
        [9, 3, 2],
        [1, 7, 6],
        [3, 6, 7],
        [8, 1, 6],
        [8, 6, 9],
        [9, 6, 3],
        [10, 7, 1],
        [7, 10, 11],
        [7, 11, 3]
      ];
      
      while ( subdivisions ) {
        subdivisions--;
        
        // add new points
        var n = icosahedronPoints.length;
        var map = {};
        for ( var ia = 0; ia < n; ia++ ) {
          for ( var ib = ia + 1; ib < n; ib++ ) {
            // guaranteed unique pairs, ia < ib
            
            if ( _.some( icosahedronFaces, function( face ) { return _.contains( face, ia ) && _.contains( face, ib ); } ) ) {
              // adjacent vertices, create a new vertex in-between with the same magnitude
              var idx = icosahedronPoints.length;
              icosahedronPoints.push( icosahedronPoints[ia].plus( icosahedronPoints[ib] ).normalized().times( vertexMagnitude ) );
              map[ia + '-' + ib] = idx; // store the index for later
            }
          }
        }
        
        // replace with all new faces
        var newFaces = [];
        _.each( icosahedronFaces, function( face ) {
          var a = face[0];
          var b = face[1];
          var c = face[2];
          // TODO: optimize so we only do one access with the smallest first?
          var ab = map[a + '-' + b] || map[b + '-' + a];
          var ac = map[a + '-' + c] || map[c + '-' + a];
          var bc = map[b + '-' + c] || map[c + '-' + b];
          if ( ab === undefined || ac === undefined || bc === undefined ) { throw new Error(); }
          
          // three outer faces
          newFaces.push( [a, ab, ac] );
          newFaces.push( [b, bc, ab] );
          newFaces.push( [c, ac, bc] );
          
          // one internal face
          newFaces.push( [ab, bc, ac] );
        } );
        icosahedronFaces = newFaces;
      }
      
      scenery.Util.polyfillRequestAnimationFrame();
      
      var triangles = [];
      var container = document.getElementById( 'container' );
      
      for ( var i = 0; i < icosahedronFaces.length; i++ ) {
        var div = document.createElement( 'div' );
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
        }[i%20];
        container.appendChild( div );
        triangles.push( div );
      }
      
      var rot = 0;
      var lastTime = 0;
      var timeElapsed = 0;
      
      var canvasWidth = 512;
      var canvasHeight = 512;
      var fieldOfViewDegrees = 45 / 2;
      var nearPlane = 1;
      var farPlane = 1000;
      var fieldOfViewRadians = ( fieldOfViewDegrees / 180 * Math.PI );
      var projectionMatrix = dot.Matrix4.gluPerspective( fieldOfViewRadians,
                                                         canvasWidth / canvasHeight,
                                                         nearPlane, farPlane );
      
      var triangleTransformMatrix = new dot.Matrix4();
      function updateTriangles() {
        var k;
        
        var pts = [];
        var modelViewMatrix = dot.Matrix4.translation( 0, 0, -20 ).timesMatrix( dot.Matrix4.rotationY( rot ) );
        for( k = 0; k < icosahedronPoints.length; k++ ) {
          pts.push( modelViewMatrix.timesVector3( icosahedronPoints[k] ) );
        }
        
        for( k = 0; k < triangles.length; k++ ) {
          var faces = icosahedronFaces[k];
          triangles[k].style.webkitTransform = triangles[k].style.transform = ( setTriangleTransform( triangleTransformMatrix, pts[faces[0]], pts[faces[1]], pts[faces[2]] ) ).getCSSTransform();
        }
      }
      updateTriangles();
      
      var sunDirection = dot( -1, 0.5, 2 ).normalized();
      var moonDirection = dot( 2, -1, 1 ).normalized();
      var sunWeight = 0.8;
      var moonWeight = 0.6;
      function draw() {
        if ( window.containerUpdate ) {
          container.style.webkitTransform = container.style.transform = ( dot.Matrix4.rotationY( rot ) ).getCSSTransform();
        } else {
          updateTriangles();
        }
        if ( window.colorFaces ) {
          var reverseRotation = dot.Matrix4.rotationY( -rot ); // this is a fast way to get the inverse :)
          for ( var fidx = 0; fidx < icosahedronFaces.length; fidx++ ) {
            var face = icosahedronFaces[fidx];
            
            var normal = icosahedronPoints[face[0]].plus( icosahedronPoints[face[1]].plus( icosahedronPoints[face[2]] ) );
            var transformedNormal = reverseRotation.timesTransposeVector3( normal ).normalized();
            
            var sunTotal = Math.max( 0, transformedNormal.dot( sunDirection ) ) * sunWeight;
            var moonTotal = Math.max( 0, transformedNormal.dot( moonDirection ) ) * moonWeight;

            var weight = Math.min( 1, sunTotal + moonTotal );
            
            var borderStyle = triangleSize + 'px solid rgb(' + Math.floor( weight * 255 ) + ',' + Math.floor( weight * 255 ) + ',' + Math.floor( weight * 255 ) + ')';
            triangles[fidx].style.borderTop = borderStyle;
          }
        }
      }

      function animate() {
        rot += ( Math.PI / 2 * timeElapsed ) / 1000.0;
      }

      function tick() {
        window.requestAnimationFrame( tick, document.body );
        var timeNow = new Date().getTime();
        if ( lastTime != 0 ) {
            timeElapsed = timeNow - lastTime;
        }
        lastTime = timeNow;

        animate();
        draw();
      }
      tick();
    } );
  } else {
    setTimeout( check, 4 );
  }
}
setTimeout( check, 4 );
