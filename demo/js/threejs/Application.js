import {
    Clock,
    EventDispatcher,
    WebGLRenderer,
    Scene,
    ShaderLib
} from './build/three.module.js';

import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';

const GLTF_PROGRESS_WEIGHT = 0.6;
const COMPILE_PROGRESS_WEIGHT = 0.4;
const ONLOAD_100_TIMEOUT = 16; // ms

class Application extends EventDispatcher {

    constructor(container, ctxSettings) {

        super();

        this.container = container instanceof HTMLElement ? container : document.getElementById(container);

        this.scene = null;
        this.camera = null;

        this.clock = new Clock();

        // renderer

        ctxSettings = ctxSettings || {};
        if (ctxSettings.alpha === undefined) ctxSettings.alpha = false;
        if (ctxSettings.depth === undefined) ctxSettings.depth = true;
        if (ctxSettings.stencil === undefined) ctxSettings.stencil = true;
        if (ctxSettings.antialias === undefined) ctxSettings.antialias = true;
        if (ctxSettings.premultipliedAlpha === undefined) ctxSettings.premultipliedAlpha = true;
        if (ctxSettings.preserveDrawingBuffer === undefined) ctxSettings.preserveDrawingBuffer = false;

        this.renderer = new WebGLRenderer(ctxSettings);
        this.renderer.outputEncoding = sRGBEncoding;

        this.container.appendChild(this.renderer.domElement);

        this.loader = new GLTFLoader();

        this._resizeCb = null;

        this.stats = null;
    }

    loadScene(url, loadCb, progressCb, errorCb) {

        const scope = this;

        if (!scope.renderer) {
            if (errorCb) errorCb('WebGL not found');
            return;
        }

        this.loader.load(url, function (gltf) {

            // setup scene/camera
            scope.scene = gltf.scene || new Scene();


            // make matrices up to date for possible use in the load callback
            scope.scene.updateMatrixWorld();

            if (scope.onResize) scope.onResize();

            // make matrices up to date for possible use in the load callback
            scope.scene.updateMatrixWorld();

            if (loadCb) {
                loadCb(scope.scene);
            }

        }, function (percentage) {

            const totalPercentage = GLTF_PROGRESS_WEIGHT * percentage / (GLTF_PROGRESS_WEIGHT + COMPILE_PROGRESS_WEIGHT);
            if (progressCb) progressCb(totalPercentage);
            if (scope.preloader) scope.preloader.onUpdate(totalPercentage);

        }, function (error) {

            console.error(error);
            if (errorCb) errorCb(error);

        });

        // remove previous resize callback if exists
        window.removeEventListener('resize', this._resizeCb, false);
        this._resizeCb = function () { if (scope.onResize) scope.onResize(); }
        window.addEventListener('resize', this._resizeCb, false);

    }

    getWidth() {
        return this.container.offsetWidth;
    }

    getHeight() {
        return this.container.offsetHeight;
    }

    onResize() {

        const width = this.getWidth();
        const height = this.getHeight();

        const aspect = width / height;

        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);

        if (this.postprocessing) {
            const pixRatio = this.renderer.getPixelRatio();
            this.postprocessing.composer.setSize(width * pixRatio, height * pixRatio);
        }
    }

    showFPS() {
        if (this.container) {
            this.hideFPS();
            const stats = new Stats();
            stats.showPanel(0);
            this.container.appendChild(stats.dom);
            this.stats = stats;
        }
    }

    hideFPS() {
        if (this.container && this.stats) {
            this.container.removeChild(this.stats.dom);
            this.stats = null;
        }
    }

}