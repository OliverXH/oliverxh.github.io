
import * as THREE from "./lib/three.module.js";
// import { OrbitControls } from "../lib/OrbitControls.js";
import { GLTFLoader } from "./lib/GLTFLoader.js";
import DW from "./js/dw.module.js";
import createCar from "./car.js";

//letiable declaration

//Ammojs Initialization
window.onload = function () {

    const gltfLoader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    let engine = new DW.Engine();
    engine.enabledPhysics();

    let scene = engine.scene;
    let world = engine.world;
    let ammoJS = new DW.AmmoJSPlugin();

    let gui = engine.gui;

    initGUI();

    createSphere();
    createCylinder();

    (function () {
        let texture = textureLoader.load("assert/grid.png");
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(200, 200);
        let plane = new THREE.Mesh(
            new THREE.PlaneGeometry(200, 200),
            new THREE.MeshLambertMaterial({
                color: 0xffffff,
                map: texture,
                // side: THREE.DoubleSide
            })
        );
        plane.receiveShadow = true;
        scene.add(plane);

        plane.rotateX(-Math.PI / 2);

        plane.body = ammoJS.generatePhysicsBody(plane, 'rigid', { mass: 0 });

        world.addRigidBody(plane.body)
    })();

    (function () {
        // Hinge constraint
        let boxA = createBox(10, 0.4, 0.4, 0);
        let boxB = createBox(10, 0.4, 4, 10);
        // boxB.position.z += 4;
        // let pivotA = new Ammo.btVector3(boxA.position.x, boxA.position.y, boxA.position.z);
        let pivotA = new Ammo.btVector3(0, 0, 0);
        // let pivotB = new Ammo.btVector3(boxB.position.x, boxB.position.y, boxB.position.z);
        let pivotB = new Ammo.btVector3(0, 0, 2.5);
        let axis = new Ammo.btVector3(1, 0, 0);
        let hinge = new Ammo.btHingeConstraint(boxA.body, boxB.body, pivotA, pivotB, axis, axis, true);
        world.addConstraint(hinge, true);
    })();

    gltfLoader.load(
        "assert/slope.glb",
        (glb) => {
            console.log(glb);

            let model = glb.scene.children[0];
            // let model = glb.scene;

            // glb.scene.children[0].material.side = THREE.BackSide;

            glb.scene.children[0].position.set(40, 3, 0);
            glb.scene.children[0].rotateX(-Math.PI / 2);

            // glb.scene.children[0].geometry.type = 'ConvexHull';

            scene.add(model);

            model.body = ammoJS.generatePhysicsBody(model, 'rigid', { mass: 0, restitution: 0.6 });
            world.addRigidBody(model.body);

        }
    );

    (function () {
        //  Add a ramp
        let rampMeshA = new THREE.Mesh(new THREE.BoxBufferGeometry(20.0, 0.1, 10.0), new THREE.MeshPhongMaterial({ color: 0xa0afa4 }));
        rampMeshA.position.set(-12, 2, 30);
        rampMeshA.rotateZ(Math.PI / 12);
        scene.add(rampMeshA);

        rampMeshA.body = ammoJS.generatePhysicsBody(rampMeshA, 'rigid', { mass: 0 });
        world.addRigidBody(rampMeshA.body);

        // Another ramp
        let rampMeshB = new THREE.Mesh(new THREE.BoxBufferGeometry(20.0, 0.1, 10.0), new THREE.MeshPhongMaterial({ color: 0xa0afa4 }));
        rampMeshB.position.set(12, 2, 30);
        rampMeshB.rotateZ(-Math.PI / 12);
        scene.add(rampMeshB);

        rampMeshB.body = ammoJS.generatePhysicsBody(rampMeshB, 'rigid', { mass: 0 });
        world.addRigidBody(rampMeshB.body);

    })();

    function initGUI() {
        let options = {
            Box: function () {
                createBox(1, 1, 1, 10);
            },
            Sphere: createSphere,
            Cylinder: createCylinder,
        }

        let add = gui.addFolder('Add');
        add.add(options, 'Box');
        add.add(options, 'Sphere');
        add.add(options, 'Cylinder');
    }

    function createBox(width, height, depth, mass) {

        //threeJS Section
        let mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(width, height, depth), new THREE.MeshPhongMaterial({ color: 0xa0afa4 }));
        mesh.position.set(4, 2, 0);
        scene.add(mesh);

        //Ammojs Section
        mesh.body = ammoJS.generatePhysicsBody(mesh, 'rigid', { mass: mass });
        world.addRigidBody(mesh.body);

        return mesh;
    }


    function createSphere() {

        //threeJS Section
        let mesh = new THREE.Mesh(new THREE.SphereBufferGeometry(0.2, 30, 30), new THREE.MeshPhongMaterial({ color: 0xff0505 }));
        mesh.position.set(0, 3, 0);
        scene.add(mesh);

        //Ammojs Section
        mesh.body = ammoJS.generatePhysicsBody(mesh, 'rigid', { mass: 6, restitution: 0.8 });
        world.addRigidBody(mesh.body);

        return mesh;
    }

    function createCylinder() {
        let cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 30), new THREE.MeshPhongMaterial({ color: 0x15ccdf }));
        cylinder.position.set(1, 5, 0);
        cylinder.rotateX(Math.PI / 2);
        scene.add(cylinder);
        cylinder.body = ammoJS.generatePhysicsBody(cylinder, 'rigid', { mass: 6 });
        world.addRigidBody(cylinder.body);
    }

    let car = createCar(scene, world);
    let mainCamera = engine.camera;

    window.addEventListener('keydown', (e) => {
        // console.log(e);
        if (e.keyCode == 32) {
            if (engine.camera == car.camera)
                engine.camera = mainCamera;
            else
                engine.camera = car.camera;
        }

        if (e.code == "KeyN")
            car.reset();
    });
    // engine.camera = car.camera;

    engine.runRenderLoop(car.update);

};
