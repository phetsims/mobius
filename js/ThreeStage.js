// Copyright 2019, University of Colorado Boulder

/**
 * Encapsulates the main three.js primitives needed for a stage (scene/camera/renderer).
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
define( require => {
  'use strict';

  // modules
  const Bounds2 = require( 'DOT/Bounds2' );
  const Color = require( 'SCENERY/util/Color' );
  const ContextLossFailureDialog = require( 'SCENERY_PHET/ContextLossFailureDialog' );
  const merge = require( 'PHET_CORE/merge' );
  const mobius = require( 'MOBIUS/mobius' );
  const Property = require( 'AXON/Property' );
  const Ray3 = require( 'DOT/Ray3' );
  const ThreeUtils = require( 'MOBIUS/ThreeUtils' );
  const Vector2 = require( 'DOT/Vector2' );
  const Vector3 = require( 'DOT/Vector3' );

  class ThreeStage {
    /**
     * @param {Object} [options]
     */
    constructor( options ) {

      options = merge( {
        // {Property.<Color>}
        backgroundProperty: new Property( Color.BLACK ),

        // {Vector3} - The initial camera position
        cameraPosition: new Vector3( 0, 0, 10 )
      }, options );

      // @public {number} - scale applied to interaction that isn't directly tied to screen coordinates (rotation),
      // updated in layout
      this.activeScale = 1;

      // @private {number}
      this.canvasWidth = 0;
      this.canvasHeight = 0;

      // @public {THREE.Scene}
      this.threeScene = new THREE.Scene();

      // @public {THREE.Camera} - will set the projection parameters on layout
      this.threeCamera = new THREE.PerspectiveCamera();

      // near/far clipping planes
      this.threeCamera.near = 1;
      this.threeCamera.far = 100;

      // @public {THREE.Renderer}
      this.threeRenderer = new THREE.WebGLRenderer( {
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: phet.chipper.queryParameters.preserveDrawingBuffer
      } );
      this.threeRenderer.setPixelRatio( window.devicePixelRatio || 1 );

      // @private {ContextLossFailureDialog|null} - dialog shown on context loss, constructed
      // lazily because Dialog requires sim bounds during construction
      this.contextLossDialog = null;

      // In the event of a context loss, we'll just show a dialog. See https://github.com/phetsims/molecule-shapes/issues/100
      this.threeRenderer.context.canvas.addEventListener( 'webglcontextlost', event => {
        event.preventDefault();

        this.showContextLossDialog();

        if ( document.domain === 'phet.colorado.edu' ) {
          window._gaq && window._gaq.push( [ '_trackEvent', 'WebGL Context Loss', `${phet.joist.sim.name} ${phet.joist.sim.version}`, document.URL ] );
        }
      } );

      options.backgroundProperty.link( color => {
        this.threeRenderer.setClearColor( color.toNumber(), color.alpha );
      } );

      this.threeCamera.position.copy( ThreeUtils.vectorToThree( options.cameraPosition ) ); // sets the camera's position
    }

    /**
     * Returns a Canvas containing the displayed content in this scene.
     * @public
     *
     * @returns {HTMLCanvasElement}
     */
    renderToCanvas() {
      // This WebGL workaround is so we can avoid the preserveDrawingBuffer setting that would impact performance.
      // We render to a framebuffer and extract the pixel data directly, since we can't create another renderer and
      // share the view (three.js constraint).

      // set up a framebuffer (target is three.js terminology) to render into
      const target = new THREE.WebGLRenderTarget( this.canvasWidth, this.canvasHeight, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat
      } );
      // render our screen content into the framebuffer
      this.render( target );

      // set up a buffer for pixel data, in the exact typed formats we will need
      const buffer = new window.ArrayBuffer( this.canvasWidth * this.canvasHeight * 4 );
      const imageDataBuffer = new window.Uint8ClampedArray( buffer );
      const pixels = new window.Uint8Array( buffer );

      // read the pixel data into the buffer
      const gl = this.threeRenderer.getContext();
      gl.readPixels( 0, 0, this.canvasWidth, this.canvasHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels );

      // create a Canvas with the correct size, and fill it with the pixel data
      const canvas = document.createElement( 'canvas' );
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;
      const context = canvas.getContext( '2d' );
      const imageData = context.createImageData( this.canvasWidth, this.canvasHeight );
      imageData.data.set( imageDataBuffer );
      context.putImageData( imageData, 0, 0 );

      return canvas;
    }

    /**
     * @private
     */
    showContextLossDialog() {
      if ( !this.contextLossDialog ) {
        this.contextLossDialog = new ContextLossFailureDialog();
      }
      this.contextLossDialog.show();
    }

    /**
     * Returns a three.js Raycaster meant for ray operations.
     * @private
     *
     * @param {Vector2} screenPoint
     * @returns {THREE.Raycaster}
     */
    getRaycasterFromScreenPoint( screenPoint ) {
      // normalized device coordinates
      const ndcX = 2 * screenPoint.x / this.canvasWidth - 1;
      const ndcY = 2 * ( 1 - ( screenPoint.y / this.canvasHeight ) ) - 1;

      const mousePoint = new THREE.Vector3( ndcX, ndcY, 0 );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera( mousePoint, this.threeCamera );
      return raycaster;
    }

    /**
     * Projects a 3d point in the global coordinate frame to one within the 2d global coordinate frame.
     * @public
     *
     * @param {Vector3} point
     * @returns {Vector2}
     */
    projectPoint( point ) {
      const threePoint = ThreeUtils.vectorToThree( point );
      threePoint.project( this.threeCamera ); // global to NDC

      // Potential fix for https://github.com/phetsims/molecule-shapes/issues/145.
      // The THREE.Vector3.project( THREE.Camera ) is giving is nonsense near startup. Longer-term could identify.
      if ( !isFinite( threePoint.x ) ) {
        threePoint.x = 0;
      }
      if ( !isFinite( threePoint.y ) ) {
        threePoint.y = 0;
      }

      return new Vector2(
        ( threePoint.x + 1 ) * this.canvasWidth / 2,
        ( -threePoint.y + 1 ) * this.canvasHeight / 2
      );
    }

    /**
     * Given a screen point, returns a 3D ray representing the camera's position and direction that point would be in the
     * 3D scene.
     * @private
     *
     * @param {Vector2} screenPoint
     * @returns {Ray3}
     */
    getRayFromScreenPoint( screenPoint ) {
      const threeRay = this.getRaycasterFromScreenPoint( screenPoint ).ray;
      return new Ray3( ThreeUtils.threeToVector( threeRay.origin ), ThreeUtils.threeToVector( threeRay.direction ).normalize() );
    }

    setDimensions( width, height ) {
      assert && assert( typeof width === 'number' && width % 1 === 0 );
      assert && assert( typeof height === 'number' && height % 1 === 0 );

      this.canvasWidth = width;
      this.canvasHeight = height;

      this.threeCamera.updateProjectionMatrix();
      this.threeRenderer.setSize( this.canvasWidth, this.canvasHeight );
    }

    /**
     * @override
     * @protected
     */
    layout( width, height ) {
      this.canvasWidth = Math.ceil( width );
      this.canvasHeight = Math.ceil( height );

      this.backgroundEventTarget.setRectBounds( this.globalToLocalBounds( new Bounds2( 0, 0, this.canvasWidth, this.canvasHeight ) ) );

      // field of view (FOV) computation for the isometric view scaling we use
      const sx = this.canvasWidth / this.layoutBounds.width;
      const sy = this.canvasHeight / this.layoutBounds.height;
      if ( sx === 0 || sy === 0 ) {
        return 1;
      }

      this.threeCamera.fov = ThreeStage.computeIsometricFOV( 50, this.canvasWidth, this.canvasHeight, this.layoutBounds.width, this.layoutBounds.height );
      this.activeScale = sy > sx ? sx : sy;

      // aspect ratio
      this.threeCamera.aspect = this.canvasWidth / this.canvasHeight;

      // three.js requires this to be called after changing the parameters
      this.threeCamera.updateProjectionMatrix();

      // update the size of the renderer
      this.threeRenderer.setSize( this.canvasWidth, this.canvasHeight );

      this.domNode.invalidateDOM();
    }

    /**
     * Renders the simulation to a specific rendering target
     * @public
     *
     * @param {THREE.WebGLRenderTarget|undefined} - undefined for the default target
     */
    render( target ) {
      // render the 3D scene first
      this.threeRenderer.render( this.threeScene, this.threeCamera, target );
      this.threeRenderer.autoClear = false;
    }

    /**
     * It's a bit tricky, since if we are vertically-constrained, we don't need to adjust the camera's FOV (since the
     * width of the scene will scale proportionally to the scale we display our contents at). It's only when our view
     * is horizontally-constrained where we have to account for the changed aspect ratio, and adjust the FOV so that
     * the molecule shows up at a scale of "sy / sx" compared to the normal case. Note that sx === sy is where our
     * layout bounds fit perfectly in the window, so we don't really have a constraint.
     * Most of the complexity here is that threeCamera.fov is in degrees, and our ideal vertically-constrained FOV is
     * 50 (so there's conversion factors in place).
     * @public
     *
     * @param {number} fov
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     * @param {number} layoutWidth
     * @param {number} layoutHeight
     * @returns {number}
     */
    static computeIsometricFOV( fov, canvasWidth, canvasHeight, layoutWidth, layoutHeight ) {
      const sx = canvasWidth / layoutWidth;
      const sy = canvasHeight / layoutHeight;

      return sx > sy ? fov : Math.atan( Math.tan( fov * Math.PI / 360 ) * sy / sx ) * 360 / Math.PI;
    }
  }

  return mobius.register( 'ThreeStage', ThreeStage );
} );
