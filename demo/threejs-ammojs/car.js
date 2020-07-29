import * as THREE from "./lib/three.module.js";
import DW from "./js/dw.module.js";

export default function createCar(scene, world) {
    let ammoJS = new DW.AmmoJSPlugin();

    let car = {};

    car.camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        5000
    );

    let chassisMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 0.2, 2), new THREE.MeshPhongMaterial({ color: 0xa0afa4 }));
    chassisMesh.body = ammoJS.generatePhysicsBody(chassisMesh, 'rigid', { mass: 400 });
    scene.add(chassisMesh);
    world.addRigidBody(chassisMesh.body);

    // let p = chassisMesh.body.getCenterOfMassTransform().getOrigin();
    // let q = chassisMesh.body.getCenterOfMassTransform().getRotation();
    // let transform = new Ammo.btTransform();
    // transform.setIdentity();
    // transform.setOrigin(new Ammo.btVector3(p.x(), p.y() - 20, p.z()));
    // transform.setRotation(new Ammo.btQuaternion(q.x(), q.y(), q.z(), q.w()));
    // chassisMesh.body.setCenterOfMassTransform(transform);

    // console.log(p.x(), p.y(), p.z());

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

    addWheel(true, new Ammo.btVector3(0.6, 0.3, 0.8), 0.3);
    addWheel(true, new Ammo.btVector3(-0.6, 0.3, 0.8), 0.3);
    addWheel(false, new Ammo.btVector3(-0.6, 0.3, -0.8), 0.3);
    addWheel(false, new Ammo.btVector3(0.6, 0.3, -0.8), 0.3);

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
            case 87: // forward
                forward = (up ? false : true);
                // vehicle.applyEngineForce(up ? 0 : maxEngineForce, 2);
                // vehicle.applyEngineForce(up ? 0 : maxEngineForce, 3);
                break;

            case 83: // backward
                backward = (up ? false : true);
                // vehicle.applyEngineForce(up ? 0 : -maxEngineForce / 2, 2);
                // vehicle.applyEngineForce(up ? 0 : -maxEngineForce / 2, 3);
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
    let steeringIncrement = .04;
    let steeringClamp = .5;
    let maxEngineForce = 600;
    let maxBreakingForce = 8;

    let maxSpeed = 50;

    car.reset = function () {
        let position = new THREE.Vector3();
        let quat = new THREE.Vector4(0, 0, 0, 1);
        position.copy(chassisMesh.position);
        // quat.copy(transformControls.object.quaternion);

        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(position.x, position.y + 1, position.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        let motionState = new Ammo.btDefaultMotionState(transform);

        chassisMesh.body.setMotionState(motionState);
    }

    car.update = function () {
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
        let position = new THREE.Vector3();
        position.copy(chassisMesh.position);
        let newPosition = chassisMesh.localToWorld(new THREE.Vector3(0, 2, -6));
        car.camera.position.lerp(newPosition, 0.3);
        // car.camera.position.copy(newPosition);
        car.camera.lookAt(position.add(new THREE.Vector3(0, 0, 0)));

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