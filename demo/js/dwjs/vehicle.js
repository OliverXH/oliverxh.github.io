
// Car();

function Vehicle(world) {

    this.chassisMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 0.2, 2), new THREE.MeshPhongMaterial({ color: 0xa0afa4 }));
    this.chassisMesh.body = ammoJS.generatePhysicsBody(this.chassisMesh, 'rigid', { mass: 200, friction: 0.2 });
    this.body = this.chassisMesh.body;

    // Raycast Vehicle
    this.tuning = new Ammo.btVehicleTuning();
    let rayCaster = new Ammo.btDefaultVehicleRaycaster(world);

    this.wheelMeshes = [];

    this.vehicle = new Ammo.btRaycastVehicle(this.tuning, this.body, rayCaster);
    this.vehicle.setCoordinateSystem(0, 1, 2);

    world.addRigidBody(this.body);
    world.addAction(this.vehicle);

    Vehicle.initControl.bind(this)();
}

Vehicle.initControl = function () {
    this.left = false;
    this.right = false;
    this.forward = false;
    this.backward = false;

    window.addEventListener('keydown', handler.bind(this));
    window.addEventListener('keyup', handler.bind(this));

    function handler(e) {
        // e.preventDefault();
        e.stopPropagation();

        let up = e.type == 'keyup';

        switch (e.keyCode) {
            case 87: // forward
                this.forward = (up ? false : true);
                break;

            case 83: // backward
                this.backward = (up ? false : true);
                break;

            case 65: // left
                this.left = (up ? false : true);
                break;

            case 68: // right
                this.right = (up ? false : true);
                break;
        }

    }

}

Vehicle.prototype.addWheel = function (isFront, pos, radius, index, mesh) {
    console.log('addthis');

    this.breakingForce = 0;
    this.engineForce = 0;
    this.vehicleSteering = 0;

    this.steeringIncrement = .04;
    this.steeringClamp = .5;
    this.maxEngineForce = 2000;
    this.maxBreakingForce = 100;

    let tuning = this.tuning;
    let friction = 1000;
    let suspensionStiffness = 20.0;
    let suspensionDamping = 2.3;
    let suspensionCompression = 4.4;
    let suspensionRestLength = 0.6;
    let rollInfluence = 0.2;

    let wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
    let wheelAxleCS = new Ammo.btVector3(-1, 0, 0);

    let wheelInfo = this.vehicle.addWheel(
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

    var t = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 30);
    t.rotateZ(Math.PI / 2);
    let wheelMesh = new THREE.Mesh(t, new THREE.MeshPhongMaterial({ color: 0x15ccdf }));
    this.wheelMeshes.push(wheelMesh);
    scene.add(wheelMesh);
}

Vehicle.prototype.update = function (dt) {

    let speed = this.vehicle.getCurrentSpeedKmHour();

    // speedometer.innerHTML = (speed < 0 ? '(R) ' : '') + Math.abs(speed).toFixed(1) + ' km/h';
    this.breakingForce = 0;
    this.engineForce = 0;

    if (this.forward) {
        if (speed < -1)
            this.breakingForce = this.maxBreakingForce;
        else this.engineForce = -this.maxEngineForce;
    }
    if (this.backward) {
        if (speed > 1)
            this.breakingForce = this.maxBreakingForce;
        else this.engineForce = this.maxEngineForce / 2;
    }
    if (this.left) {
        if (this.vehicleSteering < this.steeringClamp)
            this.vehicleSteering += this.steeringIncrement;
    } else {
        if (this.right) {
            if (this.vehicleSteering > -this.steeringClamp)
                this.vehicleSteering -= this.steeringIncrement;
        } else {
            if (this.vehicleSteering < -this.steeringIncrement)
                this.vehicleSteering += this.steeringIncrement;
            else {
                if (this.vehicleSteering > this.steeringIncrement)
                    this.vehicleSteering -= this.steeringIncrement;
                else {
                    this.vehicleSteering = 0;
                }
            }
        }
    }

    this.vehicle.applyEngineForce(this.engineForce, 2);
    this.vehicle.applyEngineForce(this.engineForce, 3);

    this.vehicle.setBrake(this.breakingForce / 2, 0);
    this.vehicle.setBrake(this.breakingForce / 2, 1);
    this.vehicle.setBrake(this.breakingForce, 2);
    this.vehicle.setBrake(this.breakingForce, 2);

    this.vehicle.setSteeringValue(this.vehicleSteering, 0);
    this.vehicle.setSteeringValue(this.vehicleSteering, 1);

    let tm, p, q, i;
    let n = this.vehicle.getNumWheels();
    for (i = 0; i < n; i++) {
        this.vehicle.updateWheelTransform(i, true);
        tm = this.vehicle.getWheelTransformWS(i);
        p = tm.getOrigin();
        q = tm.getRotation();
        this.wheelMeshes[i].position.set(p.x(), p.y(), p.z());
        this.wheelMeshes[i].quaternion.set(q.x(), q.y(), q.z(), q.w());
    }

    tm = this.vehicle.getChassisWorldTransform();
    p = tm.getOrigin();
    q = tm.getRotation();
    this.chassisMesh.position.set(p.x(), p.y(), p.z());
    this.chassisMesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
}
