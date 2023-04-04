// Copyright 2019-2023, University of Colorado Boulder

/**
 * Encapsulates the main three.js primitives needed for a stage (scene/camera/renderer).
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import Property from '../../axon/js/Property.js';
import TinyEmitter from '../../axon/js/TinyEmitter.js';
import Bounds2 from '../../dot/js/Bounds2.js';
import Ray3 from '../../dot/js/Ray3.js';
import Vector2 from '../../dot/js/Vector2.js';
import Vector3 from '../../dot/js/Vector3.js';
import optionize from '../../phet-core/js/optionize.js';
import ContextLossFailureDialog from '../../scenery-phet/js/ContextLossFailureDialog.js';
import { Color } from '../../scenery/js/imports.js';
import MobiusQueryParameters from './MobiusQueryParameters.js';
import ThreeUtils from './ThreeUtils.js';
import mobius from './mobius.js';
import TReadOnlyProperty from '../../axon/js/TReadOnlyProperty.js';
import TEmitter from '../../axon/js/TEmitter.js';

// hard-coded gamma (assuming the exponential part of the sRGB curve as a simplification)
const GAMMA = 2.2;
const INVERSE_GAMMA = 1 / GAMMA;

export type ThreeStageOptions = {
  backgroundProperty?: TReadOnlyProperty<Color>;

  // The initial camera position
  cameraPosition?: Vector3;
};

export default class ThreeStage {

  // Scale applied to interaction that isn't directly tied to screen coordinates (rotation), updated in layout
  public activeScale: number;

  public canvasWidth: number;
  public canvasHeight: number;

  public readonly threeScene: THREE.Scene;
  public readonly threeCamera: THREE.PerspectiveCamera;
  public threeRenderer: THREE.WebGLRenderer | null;

  private contextLossDialog: ContextLossFailureDialog | null;

  private readonly backgroundProperty: TReadOnlyProperty<Color>;

  private readonly colorListener: ( c: Color ) => void;

  public readonly dimensionsChangedEmitter: TEmitter;

  public constructor( providedOptions?: ThreeStageOptions ) {

    const options = optionize<ThreeStageOptions, ThreeStageOptions>()( {
      backgroundProperty: new Property( Color.BLACK ),
      cameraPosition: new Vector3( 0, 0, 10 )
    }, providedOptions );

    this.activeScale = 1;
    this.canvasWidth = 0;
    this.canvasHeight = 0;
    this.threeScene = new THREE.Scene();

    // will set the projection parameters on layout
    this.threeCamera = new THREE.PerspectiveCamera();

    // near/far clipping planes
    this.threeCamera.near = 1;
    this.threeCamera.far = 100;

    try {
      this.threeRenderer = new THREE.WebGLRenderer( {
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: phet.chipper.queryParameters.preserveDrawingBuffer
      } );
    }
    catch( e ) {
      // For https://github.com/phetsims/density/issues/105, we'll need to generate the full API without WebGL
      console.log( e );
      this.threeRenderer = null;
    }
    this.threeRenderer && this.threeRenderer.setPixelRatio( window.devicePixelRatio || 1 );

    // Dialog shown on context loss, constructed lazily because Dialog requires sim bounds during construction
    this.contextLossDialog = null;

    // In the event of a context loss, we'll just show a dialog. See https://github.com/phetsims/molecule-shapes/issues/100
    this.threeRenderer && this.threeRenderer.context.canvas.addEventListener( 'webglcontextlost', event => {
      this.showContextLossDialog();
    } );

    // For https://github.com/phetsims/density/issues/100, we'll also allow context-restore, and will auto-hide the dialog
    this.threeRenderer && this.threeRenderer.context.canvas.addEventListener( 'webglcontextrestored', event => {
      this.contextLossDialog!.hideWithoutReload();
    } );

    this.backgroundProperty = options.backgroundProperty;

    this.colorListener = color => {
      this.threeRenderer && this.threeRenderer.setClearColor( color.toNumber(), color.alpha );
    };
    this.backgroundProperty.link( this.colorListener );

    this.threeCamera.position.copy( ThreeUtils.vectorToThree( options.cameraPosition ) ); // sets the camera's position

    this.dimensionsChangedEmitter = new TinyEmitter();
  }

  /**
   * Returns a Canvas containing the displayed content in this scene.
   */
  public renderToCanvas( supersampleMultiplier = 1, backingMultiplier = 1 ): HTMLCanvasElement {
    assert && assert( Number.isInteger( supersampleMultiplier ) );

    const canvasWidth = Math.ceil( this.canvasWidth * backingMultiplier );
    const canvasHeight = Math.ceil( this.canvasHeight * backingMultiplier );

    const width = canvasWidth * supersampleMultiplier;
    const height = canvasHeight * supersampleMultiplier;

    const canvas = document.createElement( 'canvas' );
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // We need to still be able to run things without the threeRenderer, fail as gracefully as possible,
    // see https://github.com/phetsims/density/issues/105
    if ( this.threeRenderer ) {
      // This WebGL workaround is so we can avoid the preserveDrawingBuffer setting that would impact performance.
      // We render to a framebuffer and extract the pixel data directly, since we can't create another renderer and
      // share the view (three.js constraint).

      // set up a framebuffer (target is three.js terminology) to render into
      const target = new THREE.WebGLRenderTarget( width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat
      } );

      // render our screen content into the framebuffer
      this.render( target );

      // set up a buffer for pixel data, in the exact typed formats we will need
      const buffer = new window.ArrayBuffer( width * height * 4 );
      const pixels = new window.Uint8Array( buffer );

      // read the pixel data into the buffer
      const gl = this.threeRenderer.getContext();
      gl.readPixels( 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels );

      let imageDataBuffer;
      if ( supersampleMultiplier === 1 ) {
        imageDataBuffer = new window.Uint8ClampedArray( buffer );
      }
      else {
        imageDataBuffer = new window.Uint8ClampedArray( canvasWidth * canvasHeight * 4 );

        const squaredSupersampleInverse = 1 / ( supersampleMultiplier * supersampleMultiplier );

        // NOTE: duplication exists here to maintain both optimized code-paths. No if-else inside.
        if ( MobiusQueryParameters.mobiusCanvasSkipGamma ) {
          for ( let x = 0; x < canvasWidth; x++ ) {
            const xBlock = x * supersampleMultiplier;
            for ( let y = 0; y < canvasHeight; y++ ) {
              const yBlock = y * supersampleMultiplier;
              const outputIndex = ( x + y * canvasWidth ) * 4;

              // Optimized version of Color.supersampleBlend, inlined
              let premultipliedRed = 0;
              let premultipliedGreen = 0;
              let premultipliedBlue = 0;
              let alpha = 0;

              for ( let i = 0; i < supersampleMultiplier; i++ ) {
                for ( let j = 0; j < supersampleMultiplier; j++ ) {
                  const inputIndex = ( xBlock + i + ( yBlock + j ) * width ) * 4;

                  const pixelAlpha = pixels[ inputIndex + 3 ];

                  premultipliedRed += pixels[ inputIndex + 0 ] * pixelAlpha;
                  premultipliedGreen += pixels[ inputIndex + 1 ] * pixelAlpha;
                  premultipliedBlue += pixels[ inputIndex + 2 ] * pixelAlpha;
                  alpha += pixelAlpha;
                }
              }

              if ( alpha === 0 ) {
                imageDataBuffer[ outputIndex + 0 ] = 0;
                imageDataBuffer[ outputIndex + 1 ] = 0;
                imageDataBuffer[ outputIndex + 2 ] = 0;
                imageDataBuffer[ outputIndex + 3 ] = 0;
              }
              else {
                imageDataBuffer[ outputIndex + 0 ] = Math.floor( premultipliedRed / alpha );
                imageDataBuffer[ outputIndex + 1 ] = Math.floor( premultipliedGreen / alpha );
                imageDataBuffer[ outputIndex + 2 ] = Math.floor( premultipliedBlue / alpha );
                imageDataBuffer[ outputIndex + 3 ] = Math.floor( alpha * squaredSupersampleInverse );
              }
            }
          }
        }
        else {
          for ( let x = 0; x < canvasWidth; x++ ) {
            const xBlock = x * supersampleMultiplier;
            for ( let y = 0; y < canvasHeight; y++ ) {
              const yBlock = y * supersampleMultiplier;
              const outputIndex = ( x + y * canvasWidth ) * 4;

              // Optimized version of Color.supersampleBlend, inlined
              let linearPremultipliedRed = 0;
              let linearPremultipliedGreen = 0;
              let linearPremultipliedBlue = 0;
              let linearAlpha = 0;

              for ( let i = 0; i < supersampleMultiplier; i++ ) {
                for ( let j = 0; j < supersampleMultiplier; j++ ) {
                  const inputIndex = ( xBlock + i + ( yBlock + j ) * width ) * 4;

                  const alpha = Math.pow( pixels[ inputIndex + 3 ], GAMMA );

                  linearPremultipliedRed += Math.pow( pixels[ inputIndex + 0 ], GAMMA ) * alpha;
                  linearPremultipliedGreen += Math.pow( pixels[ inputIndex + 1 ], GAMMA ) * alpha;
                  linearPremultipliedBlue += Math.pow( pixels[ inputIndex + 2 ], GAMMA ) * alpha;
                  linearAlpha += alpha;
                }
              }

              if ( linearAlpha === 0 ) {
                imageDataBuffer[ outputIndex + 0 ] = 0;
                imageDataBuffer[ outputIndex + 1 ] = 0;
                imageDataBuffer[ outputIndex + 2 ] = 0;
                imageDataBuffer[ outputIndex + 3 ] = 0;
              }
              else {
                imageDataBuffer[ outputIndex + 0 ] = Math.floor( Math.pow( linearPremultipliedRed / linearAlpha, INVERSE_GAMMA ) );
                imageDataBuffer[ outputIndex + 1 ] = Math.floor( Math.pow( linearPremultipliedGreen / linearAlpha, INVERSE_GAMMA ) );
                imageDataBuffer[ outputIndex + 2 ] = Math.floor( Math.pow( linearPremultipliedBlue / linearAlpha, INVERSE_GAMMA ) );
                imageDataBuffer[ outputIndex + 3 ] = Math.floor( Math.pow( linearAlpha * squaredSupersampleInverse, INVERSE_GAMMA ) );
              }
            }
          }
        }
      }

      // fill the canvas with the pixel data
      const context = canvas.getContext( '2d' )!;
      const imageData = context.createImageData( canvasWidth, canvasHeight );
      imageData.data.set( imageDataBuffer );
      context.putImageData( imageData, 0, 0 );

      target.dispose();
    }

    return canvas;
  }

  private showContextLossDialog(): void {
    if ( !this.contextLossDialog ) {
      this.contextLossDialog = new ContextLossFailureDialog();
    }
    this.contextLossDialog.show();
  }

  /**
   * Returns a three.js Raycaster meant for ray operations.
   */
  private getRaycasterFromScreenPoint( screenPoint: Vector2 ): THREE.Raycaster {
    assert && assert( screenPoint && screenPoint.isFinite() );

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
   */
  public projectPoint( point: Vector3 ): Vector2 {
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
   */
  public getRayFromScreenPoint( screenPoint: Vector2 ): Ray3 {
    const threeRay = this.getRaycasterFromScreenPoint( screenPoint ).ray;
    return new Ray3( ThreeUtils.threeToVector( threeRay.origin ), ThreeUtils.threeToVector( threeRay.direction ).normalize() );
  }

  public setDimensions( width: number, height: number ): void {
    assert && assert( width % 1 === 0 );
    assert && assert( height % 1 === 0 );

    this.canvasWidth = width;
    this.canvasHeight = height;

    this.threeCamera.updateProjectionMatrix();
    this.threeRenderer && this.threeRenderer.setSize( this.canvasWidth, this.canvasHeight );

    this.dimensionsChangedEmitter.emit();
  }

  /**
   * Adjusts the camera's view offsets so that it displays the camera's main output within the specified cameraBounds.
   * This is a generalization of the isometric FOV computation, as it also supports other combinations such as properly
   * handling pan/zoom. See https://github.com/phetsims/density/issues/50
   */
  public adjustViewOffset( cameraBounds: Bounds2 ): void {
    assert && assert( Math.abs( this.threeCamera.aspect - cameraBounds.width / cameraBounds.height ) < 1e-5, 'Camera aspect should match cameraBounds' );

    // We essentially reverse some of the computation being done by PerspectiveCamera's updateProjectionMatrix(), so
    // that we can do computations within that coordinate frame. The specific code needed to handle this is in
    // https://github.com/mrdoob/three.js/blob/d39d82999f0ac5cdd1b4eb9f4aba3f9626f32ab6/src/cameras/PerspectiveCamera.js#L179-L196

    // What we essentially want to do is take our "layout bounds + fov + zoom" combination to determine what the bounds
    // of this ends up being in the projection frustum's near plane.
    // https://stackoverflow.com/questions/58615238/opengl-perspective-projection-how-to-define-left-and-right is
    // supremely helpful to visualize this. Then we'd want to adjust the bounds in the near plane with a linear
    // relationship. In the normal global coordinate space, we have "cameraBounds" => (0,0,canvasWidth,canvasHeight).
    // The center of cameraBounds gets mapped to (0,0) in the near plane (since it's where the camera is pointing),
    // and cameraBounds maps to a centered rectangle determined by (-halfWidth,-halfHeight,halfWidth,halfHeight).
    // We then want to map our actual canvas (0,0,canvasWidth,canvasHeight) into the near plane, and THEN we compute
    // what threeCamera.setViewOffset call will adjust the near plane coordinates to what we need (since there isn't
    // a more direct way).
    // Additionally, note that the "top" is positive in the near-plane coordinate frame, whereas it's negative in
    // Scenery/global coordinates.

    // Get the basic half width/height of the projection on the near-clip plane. We'll be adjusting in this coordinate
    // frame below. These determine the original rectangle of our ideal camera's space in the near-plane coordinates.
    const halfHeight = this.threeCamera.near * Math.tan( ( Math.PI / 360 ) * this.threeCamera.fov ) / this.threeCamera.zoom;
    const halfWidth = this.threeCamera.aspect * halfHeight;

    // Our Canvas's bounds, adjusted so that the origin is the cameraBounds center.
    const implicitBounds = new Bounds2( 0, 0, this.canvasWidth, this.canvasHeight ).shifted( cameraBounds.center.negated() );

    // Derivation for adjusted width/height from PerspectiveCamera projection setup
    // width *= view.width / fullWidth
    // newWidth = 2 * halfWidth * this.canvasWidth / adjustedFullWidth
    // adjustedFullWidth * newWidth = 2 * halfWidth * this.canvasWidth;
    // adjustedFullWidth = 2 * halfWidth * this.canvasWidth / newWidth;
    // newWidth = 2 * halfWidth * this.canvasWidth / cameraBounds.width;
    // adjustedFullWidth = 2 * halfWidth * this.canvasWidth / ( 2 * halfWidth * this.canvasWidth / cameraBounds.width );
    // adjustedFullWidth = cameraBounds.width;
    const adjustedFullWidth = cameraBounds.width;
    const adjustedFullHeight = cameraBounds.height;

    const oldLeft = -halfWidth;
    const oldTop = halfHeight;

    // -0.5 * cameraBounds.width ==> [left] -halfWidth
    const newLeft = implicitBounds.left * halfWidth / ( 0.5 * cameraBounds.width );

    // -0.5 * cameraBounds.height ==> [top] halfHeight
    const newTop = -implicitBounds.top * halfHeight / ( 0.5 * cameraBounds.height );

    // Derivation from PerspectiveCamera projection setup
    // left += view.offsetX * width / fullWidth;
    // newLeft = oldLeft + offsetX * ( 2 * halfWidth ) / adjustedFullWidth
    // newLeft - oldLeft = offsetX * ( 2 * halfWidth ) / adjustedFullWidth
    // ( newLeft - oldLeft ) * adjustedFullWidth / ( 2 * halfWidth ) = offsetX
    const offsetX = ( newLeft - oldLeft ) * adjustedFullWidth / ( 2 * halfWidth );

    // Derivation from PerspectiveCamera projection setup
    // top -= offsetY * height / adjustedFullHeight;
    // newTop = oldTop - offsetY * ( 2 * halfHeight ) / adjustedFullHeight;
    // offsetY * ( 2 * halfHeight ) / adjustedFullHeight = oldTop - newTop;
    // offsetY = ( oldTop - newTop ) * adjustedFullHeight / ( 2 * halfHeight );
    const offsetY = ( oldTop - newTop ) * adjustedFullHeight / ( 2 * halfHeight );

    this.threeCamera.setViewOffset( adjustedFullWidth, adjustedFullHeight, offsetX, offsetY, this.canvasWidth, this.canvasHeight );

    // The setViewOffset call weirdly mucks with with the aspect ratio, so we need to fix it afterward.
    this.threeCamera.aspect = cameraBounds.width / cameraBounds.height;

    // This forces a recomputation, as we've changed the inputs.
    this.threeCamera.updateProjectionMatrix();
  }

  public get width(): number {
    return this.canvasWidth;
  }

  public get height(): number {
    return this.canvasHeight;
  }

  /**
   * Renders the simulation to a specific rendering target
   *
   * @param target - undefined for the default target
   */
  public render( target: THREE.WebGLRenderTarget | undefined ): void {
    // render the 3D scene first
    if ( this.threeRenderer ) {
      this.threeRenderer.setRenderTarget( target || null );
      this.threeRenderer.render( this.threeScene, this.threeCamera );
      this.threeRenderer.autoClear = false;
    }
  }

  /**
   * Releases references.
   */
  public dispose(): void {
    this.threeRenderer && this.threeRenderer.dispose();

    // @ts-expect-error
    this.threeScene.dispose();
    this.backgroundProperty.unlink( this.colorListener );
  }

  /**
   * It's a bit tricky, since if we are vertically-constrained, we don't need to adjust the camera's FOV (since the
   * width of the scene will scale proportionally to the scale we display our contents at). It's only when our view
   * is horizontally-constrained where we have to account for the changed aspect ratio, and adjust the FOV so that
   * the content shows up at a scale of "sy / sx" compared to the normal case. Note that sx === sy is where our
   * layout bounds fit perfectly in the window, so we don't really have a constraint.
   * Most of the complexity here is that threeCamera.fov is in degrees, and our ideal vertically-constrained FOV is
   * 50 (so there's conversion factors in place).
   */
  public static computeIsometricFOV( fov: number, canvasWidth: number, canvasHeight: number, layoutWidth: number, layoutHeight: number ): number {
    const sx = canvasWidth / layoutWidth;
    const sy = canvasHeight / layoutHeight;

    return sx > sy ? fov : Math.atan( Math.tan( fov * Math.PI / 360 ) * sy / sx ) * 360 / Math.PI;
  }
}

mobius.register( 'ThreeStage', ThreeStage );
