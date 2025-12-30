import * as THREE from "three";
import { EffectComposer, RenderPass, EffectPass, BlendFunction, BloomEffect, ChromaticAberrationEffect, LambdaPass } from "postprocessing";

let camera, scene, renderer;
let ambientLight, light;
let mesh;

init();

function init() {

    scene = new THREE.Scene();

    // CAMERA
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 100 );
    // camera.position.set( 4, 5, 6 );
    camera.position.z = 3;

    // LIGHTS
    ambientLight = new THREE.AmbientLight( 0x7c7c7c, 2.0 );
    scene.add( ambientLight );

    light = new THREE.DirectionalLight( 0xFFFFFF, 2.0 );
    light.position.set( 0.32, 0.39, 0.7 );
    scene.add( light );

    // const texture = new THREE.TextureLoader().load( 'textures/crate.gif' );
    // texture.colorSpace = THREE.SRGBColorSpace;

    const geometry = new THREE.BoxGeometry();
    // const material = new THREE.MeshBasicMaterial( { map: texture } );
    const material = new THREE.MeshPhongMaterial();

    mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    // RENDERER
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    // renderer.setClearColor( 0xc5c5c5 );
    renderer.setAnimationLoop( animate );
    document.body.appendChild( renderer.domElement );

    //

    // EVENTS
    window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    mesh.rotation.x += 0.002;
    mesh.rotation.y += 0.006;

    renderer.render( scene, camera );

}