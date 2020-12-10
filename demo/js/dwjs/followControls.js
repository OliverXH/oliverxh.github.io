import { Object3D, Vector3 } from "../threejs/build/three.module.js";

export class FollowControls {

    constructor(camera, target = null) {
        this.target = target; /* mesh */
        this.camera = camera; /* camera */

        this.radius = 10;
        this.maxRadius = null;
        this.minRadius = null;

        this.rotationOffset = 0;

        this.acceleration = 0.05;

        this.heightOffset = 4;
        this.maxHeightOffset = null;
        this.minHeightOffset = null;

        this.maxCameraSpeed = 20;

    }

    _follow() {
        if (!this.target) {
            console.error("Target should be included!");
            return;
        }

        let rotationY;

        let vec = this.target.localToWorld(new Vector3(0, 0, 1)).sub(this.target.position).normalize();
        rotationY = Math.atan2(vec.x, vec.z);

        let radians = this.rotationOffset + rotationY;
        let targetPosition = this.target.position;

        let newPositionX = targetPosition.x + Math.sin(radians) * this.radius;
        let newPositionZ = targetPosition.z + Math.cos(radians) * this.radius;
        let newPositionY = targetPosition.y + this.heightOffset;

        let dx = newPositionX - this.camera.position.x;
        let dy = newPositionY - this.camera.position.y;
        let dz = newPositionZ - this.camera.position.z;

        let vx = dx * this.acceleration * 2;
        let vy = dy * this.acceleration;
        let vz = dz * this.acceleration * 2;

        if (vx > this.maxCameraSpeed || vx < -this.maxCameraSpeed) {
            vx = vx < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
        }

        if (vy > this.maxCameraSpeed || vy < -this.maxCameraSpeed) {
            vy = vy < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
        }

        if (vz > this.maxCameraSpeed || vz < -this.maxCameraSpeed) {
            vz = vz < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
        }

        this.camera.position.x += vx;
        this.camera.position.y += vy;
        this.camera.position.z += vz;

        this.setTarget(targetPosition);
    }

    update() {
        this._follow();
        // console.log(this.camera.position);
    }

    setTarget(targetPos) {
        
        let _cameraPosition = new Vector3();
        _cameraPosition.copy(this.camera.position);
        _cameraPosition.sub(targetPos);

        this.camera.rotation.y = Math.atan2(_cameraPosition.x, _cameraPosition.z);

        // this.camera.rotation.x = -Math.atan2(_cameraPosition.y,_cameraPosition.z);

        // this.camera.setRotationFromAxisAngle(new Vector3(1, 0, 0), );
        this.camera.rotation.z = 0;
        // this.camera.lookAt(this.target.position);

    }

}