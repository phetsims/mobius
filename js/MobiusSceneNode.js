// Copyright 2014-2019, University of Colorado Boulder

/**
 * Base view for all "show a single molecule in the center" screens
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
define( function( require ) {
  'use strict';

  // modules
  const Bounds2 = require( 'DOT/Bounds2' );
  const Color = require( 'SCENERY/util/Color' );
  const ContextLossFailureDialog = require( 'SCENERY_PHET/ContextLossFailureDialog' );
  const DOM = require( 'SCENERY/nodes/DOM' );
  const mobius = require( 'MOBIUS/mobius' );
  const Node = require( 'SCENERY/nodes/Node' );
  const Property = require( 'AXON/Property' );
  const Ray3 = require( 'DOT/Ray3' );
  const Rectangle = require( 'SCENERY/nodes/Rectangle' );
  const ThreeUtil = require( 'MOBIUS/ThreeUtil' );
  const Vector3 = require( 'DOT/Vector3' );

  class MobiusSceneNode extends Node {
    /**
     * @param {Bounds2} layoutBounds
     * @param {Object} [options]
     */
    constructor( layoutBounds, options ) {

      options = _.extend( {
        // TODO: cleanup
        backgroundProperty: new Property( Color.BLACK ),
        cameraPosition: new Vector3( 0, -1.25, 40 )
      }, options );

      super();

      // @private {Bounds2}
      this.layoutBounds = layoutBounds;

      // @private {Node} - our target for drags that don't hit other UI components
      this.backgroundEventTarget = Rectangle.bounds( this.layoutBounds, {} );
      this.addChild( this.backgroundEventTarget );

      // @public {number} - scale applied to interaction that isn't directly tied to screen coordinates (rotation),
      // updated in layout
      this.activeScale = 1;

      // @private {number}
      this.screenWidth = 0; // @public
      this.screenHeight = 0; // @public

      // @public {THREE.Scene}
      this.threeScene = new THREE.Scene();

      // @public {THREE.Camera} - will set the projection parameters on layout
      this.threeCamera = new THREE.PerspectiveCamera();

      // @public {THREE.Renderer}
      this.threeRenderer = new THREE.WebGLRenderer( {
        antialias: true,
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
        this.threeRenderer.setClearColor( color.toNumber(), 1 );
      } );

      this.threeCamera.position.copy( ThreeUtil.vectorToThree( options.cameraPosition ) ); // sets the camera's position

      // @private add the Canvas in with a DOM node that prevents Scenery from applying transformations on it
      this.domNode = new DOM( this.threeRenderer.domElement, {
        preventTransform: true, // Scenery override for transformation
        invalidateDOM: function() { // don't do bounds detection, it's too expensive. We're not pickable anyways
          this.invalidateSelf( new Bounds2( 0, 0, 0, 0 ) );
        },
        pickable: false
      } );
      this.domNode.invalidateDOM();
      // Scenery override for transformation
      this.domNode.updateCSSTransform = function() {};

      // support Scenery/Joist 0.2 screenshot (takes extra work to output)
      this.domNode.renderToCanvasSelf = wrapper => {
        const effectiveWidth = Math.ceil( this.screenWidth );
        const effectiveHeight = Math.ceil( this.screenHeight );

        // This WebGL workaround is so we can avoid the preserveDrawingBuffer setting that would impact performance.
        // We render to a framebuffer and extract the pixel data directly, since we can't create another renderer and
        // share the view (three.js constraint).

        // set up a framebuffer (target is three.js terminology) to render into
        const target = new THREE.WebGLRenderTarget( effectiveWidth, effectiveHeight, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.NearestFilter,
          format: THREE.RGBAFormat
        } );
        // render our screen content into the framebuffer
        this.render( target );

        // set up a buffer for pixel data, in the exact typed formats we will need
        const buffer = new window.ArrayBuffer( effectiveWidth * effectiveHeight * 4 );
        const imageDataBuffer = new window.Uint8ClampedArray( buffer );
        const pixels = new window.Uint8Array( buffer );

        // read the pixel data into the buffer
        const gl = this.threeRenderer.getContext();
        gl.readPixels( 0, 0, effectiveWidth, effectiveHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels );

        // create a Canvas with the correct size, and fill it with the pixel data
        const canvas = document.createElement( 'canvas' );
        canvas.width = effectiveWidth;
        canvas.height = effectiveHeight;
        const tmpContext = canvas.getContext( '2d' );
        const imageData = tmpContext.createImageData( effectiveWidth, effectiveHeight );
        imageData.data.set( imageDataBuffer );
        tmpContext.putImageData( imageData, 0, 0 );

        const context = wrapper.context;
        context.save();

        context.setTransform( 1, 0, 0, -1, 0, effectiveHeight ); // no need to take pixel scaling into account

        context.drawImage( canvas, 0, 0 );
        context.restore();
      };

      this.addChild( this.domNode );

      this.mutate( options );
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

    /*
     * @private
     * @param {Vector3} screenPoint
     * @returns {THREE.Raycaster}
     */
    getRaycasterFromScreenPoint( screenPoint ) {
      // normalized device coordinates
      const ndcX = 2 * screenPoint.x / this.screenWidth - 1;
      const ndcY = 2 * ( 1 - ( screenPoint.y / this.screenHeight ) ) - 1;

      const mousePoint = new THREE.Vector3( ndcX, ndcY, 0 );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera( mousePoint, this.threeCamera );
      return raycaster;
    }

    /*
     * Global => NDC
     * @public
     *
     * @param {THREE.Vector3} globalPoint
     * @returns {THREE.Vector3}
     */
    convertScreenPointFromGlobalPoint( globalPoint ) {
      globalPoint.project( this.threeCamera );
    }

    /*
     * @private
     *
     * @param {Vector3} screenPoint
     * @returns {Ray3}
     */
    getRayFromScreenPoint( screenPoint ) {
      const threeRay = this.getRaycasterFromScreenPoint( screenPoint ).ray;
      return new Ray3( ThreeUtil.threeToVector( threeRay.origin ), ThreeUtil.threeToVector( threeRay.direction ).normalize() );
    }

    /**
     * @override
     * @protected
     */
    layout( width, height ) {
      this.backgroundEventTarget.setRectBounds( this.globalToLocalBounds( new Bounds2( 0, 0, width, height ) ) );

      this.screenWidth = width;
      this.screenHeight = height;

      const canvasWidth = Math.ceil( width );
      const canvasHeight = Math.ceil( height );

      // field of view (FOV) computation for the isometric view scaling we use
      const sx = canvasWidth / this.layoutBounds.width;
      const sy = canvasHeight / this.layoutBounds.height;
      if ( sx === 0 || sy === 0 ) {
        return 1;
      }

      // It's a bit tricky, since if we are vertically-constrained, we don't need to adjust the camera's FOV (since the
      // width of the scene will scale proportionally to the scale we display our contents at). It's only when our view
      // is horizontally-constrained where we have to account for the changed aspect ratio, and adjust the FOV so that
      // the molecule shows up at a scale of "sy / sx" compared to the normal case. Note that sx === sy is where our
      // layout bounds fit perfectly in the window, so we don't really have a constraint.
      // Most of the complexity here is that threeCamera.fov is in degrees, and our ideal vertically-constrained FOV is
      // 50 (so there's conversion factors in place).
      const c = Math.tan( 25 * Math.PI / 180 ); // constant that will output the factor to use to maintain our 50 degree FOV
      const adaptiveScale = Math.atan( c * sy / sx ) * 2 * 180 / Math.PI; // apply correction scales to maintain correct FOV
      this.threeCamera.fov = sx > sy ? 50 : adaptiveScale;
      this.activeScale = sy > sx ? sx : sy;

      // aspect ratio
      this.threeCamera.aspect = canvasWidth / canvasHeight;

      // near clipping plane
      this.threeCamera.near = 1;

      // far clipping plane
      this.threeCamera.far = 100;

      // three.js requires this to be called after changing the parameters
      this.threeCamera.updateProjectionMatrix();

      // update the size of the renderer
      this.threeRenderer.setSize( Math.ceil( width ), Math.ceil( height ) );

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

    // /**
    //  * @public
    //  *
    //  * @param {THREE.Scene} threeScene
    //  */
    // addLightsToScene: function( threeScene ) {
    //   const ambientLight = new THREE.AmbientLight( 0x191919 ); // closest to 0.1 like the original shader
    //   threeScene.add( ambientLight );

    //   const sunLight = new THREE.DirectionalLight( 0xffffff, 0.8 * 0.9 );
    //   sunLight.position.set( -1.0, 0.5, 2.0 );
    //   threeScene.add( sunLight );

    //   const moonLight = new THREE.DirectionalLight( 0xffffff, 0.6 * 0.9 );
    //   moonLight.position.set( 2.0, -1.0, 1.0 );
    //   threeScene.add( moonLight );
    // }
  }

  return mobius.register( 'MobiusSceneNode', MobiusSceneNode );
} );
