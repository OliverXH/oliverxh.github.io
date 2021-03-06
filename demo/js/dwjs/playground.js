import * as THREE from "../threejs/build/three.module.js";
import DW from "./dw@2.0.0.module.js";
import { FollowControls } from "./followControls.js";

let createCar = function (scene, world) {
    let physics = new DW.PhysicsEngine();

    let car = {};

    car.camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        5000
    );
    // car.camera.damping = 0.3;
    // car.camera.offset = 7;

    let chassisMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 0.2, 2), new THREE.MeshPhongMaterial({ color: 0xa0afa4 }));
    chassisMesh.body = physics.generatePhysicsBody(chassisMesh, { mass: 400 });
    scene.add(chassisMesh);
    world.addRigidBody(chassisMesh.body);

    car.mesh = chassisMesh;
    car.mesh.matrixWorldNeedsUpdate = true;

    const helper = new THREE.CameraHelper(car.camera);
    // scene.add(helper);

    car.followControls = new FollowControls(car.camera, chassisMesh);
    car.followControls.heightOffset = 2;

    // Raycast Vehicle
    let tuning = new Ammo.btVehicleTuning();
    let rayCaster = new Ammo.btDefaultVehicleRaycaster(world);
    let vehicle = new Ammo.btRaycastVehicle(tuning, chassisMesh.body, rayCaster);
    vehicle.setCoordinateSystem(0, 1, 2);

    world.addAction(vehicle);

    // Wheel
    let wheelMeshes = [];

    let friction = 10;
    let suspensionStiffness = 35.0;
    let suspensionDamping = 2.3;
    let suspensionCompression = 4.4;
    let suspensionRestLength = 0.6;
    let rollInfluence = 0.2;

    let wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
    let wheelAxleCS = new Ammo.btVector3(-1, 0, 0);

    function addWheel(isFront, pos, radius) {
        let wheelInfo = vehicle.addWheel(
            pos,
            wheelDirectionCS0,
            wheelAxleCS,
            suspensionRestLength,
            radius,
            tuning,
            isFront);

        wheelInfo.set_m_suspensionStiffness(suspensionStiffness);
        wheelInfo.set_m_wheelsDampingRelaxation(suspensionDamping);
        wheelInfo.set_m_wheelsDampingCompression(suspensionCompression);
        wheelInfo.set_m_frictionSlip(friction);
        wheelInfo.set_m_rollInfluence(rollInfluence);

        let geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 30);
        geometry.rotateZ(Math.PI / 2);
        let wheelMesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 0x15ccdf }));
        wheelMeshes.push(wheelMesh);
        scene.add(wheelMesh);
    }

    addWheel(false, new Ammo.btVector3(-0.6, 0.3, -0.8), 0.3);
    addWheel(false, new Ammo.btVector3(0.6, 0.3, -0.8), 0.3);
    addWheel(true, new Ammo.btVector3(0.6, 0.3, 0.8), 0.3);
    addWheel(true, new Ammo.btVector3(-0.6, 0.3, 0.8), 0.3);

    // Control

    let left = false;
    let right = false;
    let forward = false;
    let backward = false;

    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', handler);

    function handler(e) {
        // e.preventDefault();
        e.stopPropagation();

        chassisMesh.body.activate();

        let up = e.type == 'keyup';

        switch (e.keyCode) {
            case 83: // forward
                // console.log('forward');
                forward = (up ? false : true);
                break;

            case 87: // backward
                backward = (up ? false : true);
                break;

            case 65: // left
                left = (up ? false : true);
                break;

            case 68: // right
                right = (up ? false : true);
                break;
        }
    }

    let vehicleSteering = 0;
    let steeringIncrement = .02;
    let steeringClamp = .4;
    let maxEngineForce = 600;
    let maxBreakingForce = 12;

    let maxSpeed = 40;

    car.reset = function () {

        console.log("reset");

        let position = new THREE.Vector3();
        let quat = new THREE.Quaternion();
        position.copy(chassisMesh.position);
        quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), chassisMesh.rotation.y);

        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(position.x, position.y + 1, position.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        let motionState = new Ammo.btDefaultMotionState(transform);

        chassisMesh.body.setMotionState(motionState);
    }

    car.setPosition = function (x, y, z) {

        console.log("set position");

        chassisMesh.position.set(x, y, z);

        let quat = new THREE.Vector4();
        quat.copy(chassisMesh.quaternion);

        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(x, y, z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        let motionState = new Ammo.btDefaultMotionState(transform);

        chassisMesh.body.setMotionState(motionState);
    }

    car.update = function (deltaTime) {
        // chassisMesh.body.activate();

        let speed = vehicle.getCurrentSpeedKmHour();

        let breakingForce = 0;
        let engineForce = 0;

        // forward and backward
        if (forward) {
            if (speed < 0)
                breakingForce = maxBreakingForce;
            else
                engineForce = maxEngineForce;
        }
        if (backward) {
            if (speed > 0)
                breakingForce = maxBreakingForce;
            else
                engineForce = -maxEngineForce;
        }

        // left and right
        if (left) {
            if (vehicleSteering < steeringClamp)
                vehicleSteering += steeringIncrement;
        } else {
            if (right) {
                if (vehicleSteering > -steeringClamp)
                    vehicleSteering -= steeringIncrement;
            } else {
                if (vehicleSteering < -steeringIncrement)
                    vehicleSteering += steeringIncrement;
                else {
                    if (vehicleSteering > steeringIncrement)
                        vehicleSteering -= steeringIncrement;
                    else {
                        vehicleSteering = 0;
                    }
                }
            }
        }

        if (speed >= maxSpeed)
            engineForce = 0;

        vehicle.applyEngineForce(engineForce, 2);
        vehicle.applyEngineForce(engineForce, 3);

        vehicle.setBrake(breakingForce / 2, 0);
        vehicle.setBrake(breakingForce / 2, 1);
        vehicle.setBrake(breakingForce, 2);
        vehicle.setBrake(breakingForce, 3);

        vehicle.setSteeringValue(vehicleSteering, 0);
        vehicle.setSteeringValue(vehicleSteering, 1);

        // Camera
        car.followControls.update();
        let target = new THREE.Vector3();
        target.copy(chassisMesh.position);
        // car.camera.lookAt(target);

        window.addEventListener("resize", function () {
            car.camera.aspect = window.innerWidth / window.innerHeight;
            car.camera.updateProjectionMatrix();
        }, false);

        // Wheel
        let tm, p, q, i;
        let n = vehicle.getNumWheels();
        for (i = 0; i < n; i++) {
            vehicle.updateWheelTransform(i, true);
            tm = vehicle.getWheelTransformWS(i);
            p = tm.getOrigin();
            q = tm.getRotation();
            wheelMeshes[i].position.set(p.x(), p.y(), p.z());
            wheelMeshes[i].quaternion.set(q.x(), q.y(), q.z(), q.w());
        }
    }

    return car;
}

let createWall = function (scene, world, _options) {
    /*
        _options = {
            type,
            widthCount,
            heightCount,
            position,
        }
    */

    let physics = new DW.PhysicsEngine();

    let type = _options.type || 'rectangle';
    let widthCount = _options.widthCount || 4;
    let heightCount = _options.heightCount || 8;

    let brickMass = 0.5;
    let brickLength = 1.6;
    let brickDepth = 0.8;
    let brickHeight = brickLength * 0.5;

    let mesh = new THREE.Mesh(
        new THREE.BoxGeometry(brickLength, brickHeight, brickDepth),
        new THREE.MeshPhongMaterial({ color: Math.floor(Math.random() * (1 << 24)) })
    );

    switch (type) {
        case 'rectangle':
        case 'brick':
            for (let i = 0; i < heightCount; i++) {

                for (let j = 0; j < widthCount; j++) {

                    let _x = _options.position.x + brickLength * j/* - (widthCount / 2 - 0.5) * mesh.geometry.parameters.width*/,
                        _y = _options.position.y + brickHeight * (i + 0.5),
                        _z = _options.position.z;

                    let box = mesh.clone();
                    box.material = new THREE.MeshPhongMaterial({ color: Math.floor(Math.random() * (1 << 24)) });
                    box.position.set(_x, _y, _z);

                    // console.log(_x, _y, _z);
                    box.body = physics.generatePhysicsBody(box, { mass: brickMass });

                    scene.add(box);
                    world.addRigidBody(box.body);
                }
            }

            break;

        case 'triangle':
            for (let i = 0; i < heightCount; i++) {

                for (let j = 0; j < widthCount; j++) {

                    let _x = _options.position.x + mesh.geometry.parameters.width * j - ((widthCount - i) / 2 - 0.5) * mesh.geometry.parameters.width,
                        _y = _options.position.y + mesh.geometry.parameters.height * (i + 0.5),
                        _z = _options.position.z;

                    let box = mesh.clone();
                    box.position.set(_x, _y, _z);
                    box.body = physics.generatePhysicsBody(box, { mass: 4 });

                    scene.add(box);
                    world.addRigidBody(box.body);
                }
            }
            break;
    }

    return true;
}

export { createCar, createWall };