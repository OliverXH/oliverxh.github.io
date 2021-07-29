
const ACTIVE_TAG$1 = 1;
const ISLAND_SLEEPING = 2;
const WANTS_DEACTIVATION = 3;
const DISABLE_DEACTIVATION$1 = 4;
const DISABLE_SIMULATION = 5;

const BODYTYPE_STATIC = 'static';
const BODYTYPE_DYNAMIC = 'dynamic';
const BODYTYPE_KINEMATIC = 'kinematic';

const CF_DYNAMIC = 0;
const CF_STATIC = 1;
const CF_KINEMATIC = 2;

// Collision flags
const BODYFLAG_STATIC_OBJECT = 1;
const BODYFLAG_KINEMATIC_OBJECT = 2;
const BODYFLAG_NORESPONSE_OBJECT = 4;

// Activation states
const BODYSTATE_ACTIVE_TAG = 1;
const BODYSTATE_ISLAND_SLEEPING$1 = 2;
const BODYSTATE_WANTS_DEACTIVATION = 3;
const BODYSTATE_DISABLE_DEACTIVATION = 4;
const BODYSTATE_DISABLE_SIMULATION = 5;

// groups
const BODYGROUP_NONE = 0;
const BODYGROUP_DEFAULT = 1;
const BODYGROUP_DYNAMIC = 1;
const BODYGROUP_STATIC = 2;
const BODYGROUP_KINEMATIC = 4;
const BODYGROUP_ENGINE_1 = 8;
const BODYGROUP_TRIGGER = 16;
const BODYGROUP_ENGINE_2 = 32;
const BODYGROUP_ENGINE_3 = 64;
const BODYGROUP_USER_1 = 128;
const BODYGROUP_USER_2 = 256;
const BODYGROUP_USER_3 = 512;
const BODYGROUP_USER_4 = 1024;
const BODYGROUP_USER_5 = 2048;
const BODYGROUP_USER_6 = 4096;
const BODYGROUP_USER_7 = 8192;
const BODYGROUP_USER_8 = 16384;

// masks
const BODYMASK_NONE = 0;
const BODYMASK_ALL = 65535;
const BODYMASK_STATIC = 2;
const BODYMASK_NOT_STATIC = 65535 ^ 2;
const BODYMASK_NOT_STATIC_KINEMATIC = 65535 ^ (2 | 4);

class Vec3 {

    constructor(x = 0.0, y = 0.0, z = 0.0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Vector cross product
     * @param target Optional target to save in.
     */
    cross(vector, target) {
        const vx = vector.x;
        const vy = vector.y;
        const vz = vector.z;
        const x = this.x;
        const y = this.y;
        const z = this.z;

        target.x = y * vz - z * vy;
        target.y = z * vx - x * vz;
        target.z = x * vy - y * vx;

        return target;
    }

    equals(vector) {
        return this.x === vector.x && this.y === vector.y && this.z === vector.z;
    }

    /**
     * Set the vectors' 3 elements
     */
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    /**
     * Set all components of the vector to zero.
     */
    setZero() {
        this.x = this.y = this.z = 0;
    }



    /**
     * Normalize the vector. Note that this changes the values in the vector.

    * @return Returns the norm of the vector
    */
    normalize() {
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const n = Math.sqrt(x * x + y * y + z * z);
        if (n > 0.0) {
            const invN = 1 / n;
            this.x *= invN;
            this.y *= invN;
            this.z *= invN;
        } else {
            // Make something up
            this.x = 0;
            this.y = 0;
            this.z = 0;
        }
        return n;
    }

    /**
     * Get the length of the vector
     */
    length() {
        const x = this.x;
        const y = this.y;
        const z = this.z;
        return Math.sqrt(x * x + y * y + z * z);
    }

    /**
     * Get distance from this point to another point
     */
    distanceTo(p) {
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const px = p.x;
        const py = p.y;
        const pz = p.z;
        return Math.sqrt((px - x) * (px - x) + (py - y) * (py - y) + (pz - z) * (pz - z));
    }

    /**
     * Copies value of source to this vector.
     */
    copy(vector) {
        this.x = vector.x;
        this.y = vector.y;
        this.z = vector.z;
        return this;
    }

    /**
     * Do a linear interpolation between two vectors
     * @param alpha A number between 0 and 1. 0 will make this function return u, and 1 will make it return v. Numbers in between will generate a vector in between them.
     */
    lerp(v, alpha) {

        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;
        this.z += (v.z - this.z) * alpha;

        return this;

    }

    lerpVectors(v1, v2, alpha) {

        this.x = v1.x + (v2.x - v1.x) * alpha;
        this.y = v1.y + (v2.y - v1.y) * alpha;
        this.z = v1.z + (v2.z - v1.z) * alpha;

        return this;

    }

    /**
     * Clone the vector
     */
    clone() {
        return new Vec3(this.x, this.y, this.z);
    }

}

Vec3.ZERO = new Vec3(0, 0, 0);
Vec3.UNIT_X = new Vec3(1, 0, 0);
Vec3.UNIT_Y = new Vec3(0, 1, 0);
Vec3.UNIT_Z = new Vec3(0, 0, 1);

class Quaternion {

    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    /**
     * Set the value of the quaternion.
     */
    set(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }

    /**
     * Normalize the quaternion. Note that this changes the values of the quaternion.
     */
    normalize() {
        let l = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
        if (l === 0) {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 0;
        } else {
            l = 1 / l;
            this.x *= l;
            this.y *= l;
            this.z *= l;
            this.w *= l;
        }
        return this;
    }

    /**
     * Copies value of source to this quaternion.
     * @return this
     */
    copy(quat) {
        this.x = quat.x;
        this.y = quat.y;
        this.z = quat.z;
        this.w = quat.w;
        return this;
    }

    /**
     * Convert the quaternion to euler angle representation. Order: YZX, as this page describes: https://www.euclideanspace.com/maths/standards/index.htm
     * @param order Three-character string, defaults to "YZX"
     */
    toEuler(target, order = 'YZX') {
        let heading;
        let attitude;
        let bank;
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const w = this.w;

        switch (order) {
            case 'YZX':
                const test = x * y + z * w;
                if (test > 0.499) {
                    // singularity at north pole
                    heading = 2 * Math.atan2(x, w);
                    attitude = Math.PI / 2;
                    bank = 0;
                }
                if (test < -0.499) {
                    // singularity at south pole
                    heading = -2 * Math.atan2(x, w);
                    attitude = -Math.PI / 2;
                    bank = 0;
                }
                if (heading === undefined) {
                    const sqx = x * x;
                    const sqy = y * y;
                    const sqz = z * z;
                    heading = Math.atan2(2 * y * w - 2 * x * z, 1 - 2 * sqy - 2 * sqz); // Heading
                    attitude = Math.asin(2 * test); // attitude
                    bank = Math.atan2(2 * x * w - 2 * y * z, 1 - 2 * sqx - 2 * sqz); // bank
                }
                break;
            default:
                throw new Error(`Euler order ${order} not supported yet.`);
        }

        target.y = heading;
        target.z = attitude;
        target.x = bank;
    }

    /**
     * @param order The order to apply angles: 'XYZ' or 'YXZ' or any other combination.
     *
     * See {@link https://www.mathworks.com/matlabcentral/fileexchange/20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors MathWorks} reference
     */
    setFromEuler(x, y, z, order = 'XYZ') {
        const c1 = Math.cos(x / 2);
        const c2 = Math.cos(y / 2);
        const c3 = Math.cos(z / 2);
        const s1 = Math.sin(x / 2);
        const s2 = Math.sin(y / 2);
        const s3 = Math.sin(z / 2);

        if (order === 'XYZ') {
            this.x = s1 * c2 * c3 + c1 * s2 * s3;
            this.y = c1 * s2 * c3 - s1 * c2 * s3;
            this.z = c1 * c2 * s3 + s1 * s2 * c3;
            this.w = c1 * c2 * c3 - s1 * s2 * s3;
        } else if (order === 'YXZ') {
            this.x = s1 * c2 * c3 + c1 * s2 * s3;
            this.y = c1 * s2 * c3 - s1 * c2 * s3;
            this.z = c1 * c2 * s3 - s1 * s2 * c3;
            this.w = c1 * c2 * c3 + s1 * s2 * s3;
        } else if (order === 'ZXY') {
            this.x = s1 * c2 * c3 - c1 * s2 * s3;
            this.y = c1 * s2 * c3 + s1 * c2 * s3;
            this.z = c1 * c2 * s3 + s1 * s2 * c3;
            this.w = c1 * c2 * c3 - s1 * s2 * s3;
        } else if (order === 'ZYX') {
            this.x = s1 * c2 * c3 - c1 * s2 * s3;
            this.y = c1 * s2 * c3 + s1 * c2 * s3;
            this.z = c1 * c2 * s3 - s1 * s2 * c3;
            this.w = c1 * c2 * c3 + s1 * s2 * s3;
        } else if (order === 'YZX') {
            this.x = s1 * c2 * c3 + c1 * s2 * s3;
            this.y = c1 * s2 * c3 + s1 * c2 * s3;
            this.z = c1 * c2 * s3 - s1 * s2 * c3;
            this.w = c1 * c2 * c3 - s1 * s2 * s3;
        } else if (order === 'XZY') {
            this.x = s1 * c2 * c3 - c1 * s2 * s3;
            this.y = c1 * s2 * c3 - s1 * c2 * s3;
            this.z = c1 * c2 * s3 + s1 * s2 * c3;
            this.w = c1 * c2 * c3 + s1 * s2 * s3;
        }

        return this;
    }

    dot(q) {

        return this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w;

    }

    clone() {
        return new Quaternion(this.x, this.y, this.z, this.w)
    }

    slerp(q2, t) {

        if (t === 0) return this;
        if (t === 1) return this.copy(q2);

        const x = this.x,
            y = this.y,
            z = this.z,
            w = this.w;

        // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

        let cosom = this.dot(q2);

        if (cosom < 0) {

            this.w = - q2.w;
            this.x = - q2.x;
            this.y = - q2.y;
            this.z = - q2.z;

            cosom = - cosom;

        } else {

            this.copy(q2);

        }

        if (cosom >= 1.0) {

            this.w = w;
            this.x = x;
            this.y = y;
            this.z = z;

            return this;

        }

        const sqrSinHalfTheta = 1.0 - cosom * cosom;

        if (sqrSinHalfTheta <= Number.EPSILON) {

            const s = 1 - t;
            this.w = s * w + t * this.w;
            this.x = s * x + t * this.x;
            this.y = s * y + t * this.y;
            this.z = s * z + t * this.z;

            this.normalize();

            return this;

        }

        const sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
        const halfTheta = Math.atan2(sinHalfTheta, cosom);
        const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta,
            ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

        this.w = (w * ratioA + this.w * ratioB);
        this.x = (x * ratioA + this.x * ratioB);
        this.y = (y * ratioA + this.y * ratioB);
        this.z = (z * ratioA + this.z * ratioB);

        return this;

    }

    lerpQuaternions(q1, q2, t) {

        this.copy(q1).slerp(q2, t);

    }
}

class RigidBody {

    constructor(entity, options = {}) {

        this.entity = entity;

        entity.userData.body = this;

        this._body = null;
        this._mass = options.mass !== undefined ? options.mass : 1;

        this._type = BODYTYPE_DYNAMIC;

        this._friction = 0.5;
        this._restitution = 0;

        let shape = options.shape !== undefined ? options.shape : null;
        this._shape = shape._shape;

        this._position = options.position !== undefined ? options.position : new Vec3();
        this._quaternion = options.quaternion !== undefined ? options.quaternion : new Quaternion();

        this._angularDamping = 0;
        this._angularFactor = new Vec3(1, 1, 1);
        this._angularVelocity = new Vec3();

        this._linearDamping = 0;
        this._linearFactor = new Vec3(1, 1, 1);
        this._linearVelocity = new Vec3();

        this._animated = false;

    }

    get animated() {
        return this._animated;
    }

    set animated(value) {

        if (this._animated !== value) {
            this._animated = value;


        }

    }


    get type() {
        return this._type;
    }

    set type(type) {
        if (this._type !== type) {
            this._type = type;

            // this.disableSimulation();

            // set group and mask to defaults for type
            switch (type) {
                case BODYTYPE_DYNAMIC:
                    this._group = BODYGROUP_DYNAMIC;
                    // this._mask = BODYMASK_ALL;
                    break;
                case BODYTYPE_KINEMATIC:
                    this._group = BODYGROUP_KINEMATIC;
                    // this._mask = BODYMASK_ALL;
                    break;
                case BODYTYPE_STATIC:
                default:
                    this._group = BODYGROUP_STATIC;
                    // this._mask = BODYMASK_NOT_STATIC;
                    break;
            }

            // Create a new body
            // this.createBody();
        }
    }


    get mass() {
        return this._mass;
    }

    set mass(mass) {
        if (this._mass !== mass) {
            this._mass = mass;

            if (this._body && this._type === BODYTYPE_DYNAMIC) {
                const enabled = this.enabled && this.entity.enabled;
                if (enabled) {
                    this.disableSimulation();
                }

                let localInertia = new Ammo.btVector3(0, 0, 0);

                if (mass)
                    /* calculate new inertia if non-zero mass */
                    // calculateLocalInertia writes local inertia to localInertia here...
                    this._body.getCollisionShape().calculateLocalInertia(mass, localInertia);

                // ...and then writes the calculated local inertia to the body
                this._body.setMassProps(mass, localInertia);
                this._body.updateInertiaTensor();
            }
        }
    }


    get position() {
        return this._position;
    }

    set position(loc) {
        this.setTransform(loc, this.quaternion);
    }

    get quaternion() {
        return this._quaternion;
    }

    set quaternion(rot) {
        this.setTransform(this.position, rot);
    }

    _getTransform() {

        const pos = this.position;
        const rot = this.quaternion;

        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(rot.x, rot.y, rot.z, rot.w));

        return transform;
    }

    setTransform(loc, rot) {

        this._position.copy(loc);
        this._quaternion.copy(rot);

        if (!this._body)
            return;

        let ms = this._body.getMotionState();

        let trans = new Ammo.btTransform();
        trans.setIdentity();
        trans.setOrigin(new Ammo.btVector3(loc.x, loc.y, loc.z));
        trans.setRotation(new Ammo.btQuaternion(rot.x, rot.y, rot.z, rot.w));

        if (this.mass == 0 || this._type === BODYTYPE_KINEMATIC) {
            ms.setWorldTransform(trans);
            return;
        }

        this._body.setWorldTransform(trans);

    }


    // -------------

    get angularDamping() {
        return this._angularDamping;
    }

    set angularDamping(damping) {
        if (this._angularDamping !== damping) {
            this._angularDamping = damping;

            if (this._body) {
                this._body.setDamping(this._linearDamping, damping);
            }
        }
    }


    get angularFactor() {
        return this._angularFactor;
    }

    set angularFactor(factor) {
        if (!this._angularFactor.equals(factor)) {
            this._angularFactor.copy(factor);

            if (this._body && this._type === BODYTYPE_DYNAMIC) {
                let vec = new Ammo.btVector3(factor.x, factor.y, factor.z);
                this._body.setAngularFactor(vec);
            }
        }
    }


    get angularVelocity() {
        if (this._body && this._type === BODYTYPE_DYNAMIC) {
            const velocity = this._body.getAngularVelocity();
            this._angularVelocity.set(velocity.x(), velocity.y(), velocity.z());
        }
        return this._angularVelocity;
    }

    set angularVelocity(velocity) {
        if (this._body && this._type === BODYTYPE_DYNAMIC) {
            this._body.activate();

            let vec = new Ammo.btVector3(velocity.x, velocity.y, velocity.z);
            this._body.setAngularVelocity(vec);

            this._angularVelocity.copy(velocity);
        }
    }


    get linearDamping() {
        return this._linearDamping;
    }

    set linearDamping(damping) {
        if (this._linearDamping !== damping) {
            this._linearDamping = damping;

            if (this._body) {
                this._body.setDamping(damping, this._angularDamping);
            }
        }
    }

    get linearFactor() {
        return this._linearFactor;
    }

    set linearFactor(factor) {
        if (!this._linearFactor.equals(factor)) {
            this._linearFactor.copy(factor);

            if (this._body && this._type === BODYTYPE_DYNAMIC) {
                let vec = new Ammo.btVector3(factor.x, factor.y, factor.z);
                this._body.setLinearFactor(vec);
            }
        }
    }

    get linearVelocity() {
        if (this._body && this._type === BODYTYPE_DYNAMIC) {
            const velocity = this._body.getLinearVelocity();
            this._linearVelocity.set(velocity.x(), velocity.y(), velocity.z());
        }
        return this._linearVelocity;
    }

    set linearVelocity(velocity) {
        if (this._body && this._type === BODYTYPE_DYNAMIC) {
            this._body.activate();

            let vec = new Ammo.btVector3(velocity.x, velocity.y, velocity.z);
            this._body.setLinearVelocity(vec);

            this._linearVelocity.copy(velocity);
        }
    }


    get friction() {
        return this._friction;
    }

    set friction(friction) {
        if (this._friction !== friction) {
            this._friction = friction;

            if (this._body) {
                this._body.setFriction(friction);
            }
        }
    }


    get restitution() {
        return this._restitution;
    }

    set restitution(restitution) {
        if (this._restitution !== restitution) {
            this._restitution = restitution;

            if (this._body) {
                this._body.setRestitution(restitution);
            }
        }
    }

    setKinematicState(kinematic) {
        let body = this._body;

        if (kinematic) {
            this.type = BODYTYPE_KINEMATIC;
            body.setCollisionFlags(body.getCollisionFlags() | BODYFLAG_KINEMATIC_OBJECT);
        }
        else {
            this.type = BODYTYPE_DYNAMIC;
            body.setCollisionFlags(body.getCollisionFlags() & ~BODYFLAG_KINEMATIC_OBJECT);
        }

    }

    setActivationState(use_deactivation) {
        let body = this._body;

        if (use_deactivation) {
            body.forceActivationState(BODYSTATE_ACTIVE_TAG);
        }
        else {
            body.setActivationState(BODYSTATE_DISABLE_DEACTIVATION);
        }
    }

    isActive() {
        return this._body ? this._body.isActive() : false;
    }

    /* activate() {
        if (this._body) {
            this._body.activate();
        }
    } */

    activate() {
        this._body.setActivationState(BODYSTATE_ACTIVE_TAG);
    }
    deactivate() {
        this._body.setActivationState(BODYSTATE_ISLAND_SLEEPING);
    }


    /**
     * @private
     * @function
     * @name RigidBodyComponent#_getEntityTransform
     * @description Writes an entity transform into an Ammo.btTransform but ignoring scale.
     * @return {Ammo.btTransform} transform - The ammo transform to write the entity transform to.
     */
    _getEntityTransform() {

        let transform = new Ammo.btTransform();
        transform.setIdentity();

        const entity = this.entity;
        const pos = entity.position;
        const rot = entity.rotation;

        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(rot.x, rot.y, rot.z, rot.w));

        return transform;

    }

    _setActivationState(use_deactivation) {
        if (use_deactivation) {
            this._body.forceActivationState(ACTIVE_TAG);
        }
        else {
            this._body.setActivationState(DISABLE_DEACTIVATION);
        }
    }

    setActivationState(newState) {
        this._body.setActivationState(newState);
    }


    /**
     * @private
     * @function
     * @name RigidBodyComponent#createBody
     * @description If the Entity has a Collision shape attached then create 
     * a rigid body using this shape. This method destroys the existing body.
     */
    createBody() {
        const entity = this.entity;
        let shape = this._shape;

        if (shape) {
            // if (this._body)
            // this.system.onRemove(entity, this);

            const mass = this._type === BODYTYPE_DYNAMIC ? this._mass : 0;

            let transform = this._getTransform();

            // const body = this.system.createBody(mass, shape, transform);
            // crete body
            const localInertia = new Ammo.btVector3(0, 0, 0);
            if (mass !== 0) {
                shape.calculateLocalInertia(mass, localInertia);
            }

            const motionState = new Ammo.btDefaultMotionState(transform);
            const bodyInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
            const body = new Ammo.btRigidBody(bodyInfo);
            Ammo.destroy(bodyInfo);
            Ammo.destroy(localInertia);

            body.setRestitution(this._restitution);
            body.setFriction(this._friction);
            body.setRollingFriction(this._rollingFriction);
            body.setDamping(this._linearDamping, this._angularDamping);

            let vec = new Ammo.btVector3();

            if (this._type === BODYTYPE_DYNAMIC) {
                const linearFactor = this._linearFactor;
                vec.setValue(linearFactor.x, linearFactor.y, linearFactor.z);
                body.setLinearFactor(vec);

                const angularFactor = this._angularFactor;
                vec.setValue(angularFactor.x, angularFactor.y, angularFactor.z);
                body.setAngularFactor(vec);
            } else if (this._type === BODYTYPE_KINEMATIC) {
                body.setCollisionFlags(body.getCollisionFlags() | BODYFLAG_KINEMATIC_OBJECT);
                body.setActivationState(BODYSTATE_DISABLE_DEACTIVATION);
            }

            body.entity = entity;

            this._body = body;

            if (this.enabled && entity.enabled) ;

        }
    }

    addToWorld(world) {
        world.addBody(this);
        return this;
    }

    /* Sync rigid body and object transformations */
    update(object3D) {

        let trans = new Ammo.btTransform();
        const ms = this._body.getMotionState();

        if (ms) {

            ms.getWorldTransform(trans);
            const p = trans.getOrigin();
            const q = trans.getRotation();
            object3D.position.set(p.x(), p.y(), p.z());
            object3D.quaternion.set(q.x(), q.y(), q.z(), q.w());

        }

    }

    /**
     * 
     * @param {World} world Physics world
     */
    static createSubstepData(world) {

        /* Objects that we want to update substep location/rotation for. */
        let substepTargets = [];

        world.bodies.forEach((body) => {

            if (body.type == BODYTYPE_KINEMATIC) {

                let loc = new Vec3(), rot = new Quaternion(); new Vec3();

                let data = new KinematicSubstepData("RigidBody Substep data");

                data.body = body;

                loc.copy(body.position);
                rot.copy(body.quaternion);

                data.old_pos.copy(loc);
                data.old_rot.copy(rot);

                loc.copy(body.entity.position);
                rot.copy(body.entity.quaternion);

                data.new_pos.copy(loc);
                data.new_rot.copy(rot);

                substepTargets.push(data);

            }

        });

        return substepTargets;

    }

    /**
     * @description Kinematic object update
     * @param {*} targets Kinematic type object array need update
     * @param {*} interpFac interpolation factor
     */

    static updateKinematic(datas = [], interpFac = 1) {

        if (datas.length == 0)
            return;

        datas.forEach((data) => {

            let loc = new Vec3(), rot = new Quaternion();

            loc.lerpVectors(data.old_pos, data.new_pos, interpFac);
            rot.lerpQuaternions(data.old_rot, data.new_rot, interpFac);

            data.body.activate();
            data.body.setTransform(loc, rot);

        });
    }

}


class KinematicSubstepData {
    constructor(name) {
        this.name = name || '';
        this.body;
        this.old_pos = new Vec3();
        this.new_pos = new Vec3();
        this.old_rot = new Quaternion();
        this.new_rot = new Quaternion();
        this.scale_changed = false;
        this.old_scale = new Vec3();
        this.new_scale = new Vec3();
    }
}

class World {

    constructor(options = {}) {

        if (false) {

            const collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
            const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
            const broadphase = new Ammo.btDbvtBroadphase();
            const solver = new Ammo.btSequentialImpulseConstraintSolver();
            const softBodySolver = new Ammo.btDefaultSoftBodySolver();
            this._dynamicsWorld = new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
            this._dynamicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, -9.8, 0));
        
            softBodyHelpers = new Ammo.btSoftBodyHelpers();
        
        } else {
        
            const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
            const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
            const broadphase = new Ammo.btDbvtBroadphase();
            const solver = new Ammo.btSequentialImpulseConstraintSolver();
            this._dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
        
        }

        this._gravity = new Vec3();

        this.gravity = options.gravity !== undefined ? options.gravity : new Vec3(0, -9.82, 0);

        this.bodies = [];
        this.constraints = [];

    }

    /**
     * Gravity
     */
    get gravity() {
        return this._gravity;
    }

    set gravity(gravity) {
        this._gravity.copy(gravity);
        this._dynamicsWorld.setGravity(new Ammo.btVector3(gravity.x, gravity.y, gravity.z));
    }

    /**
     * RigidBody
     */
    addBody(body) {

        body.createBody();

        this.bodies.push(body);
        this._dynamicsWorld.addRigidBody(body._body);
    }

    removeBody(body) {
        let index = this.bodies.indexOf(body);
        this.bodies.splice(index, 1);

        this._dynamicsWorld.removeRigidBody(body._body);
    }

    /**
     * Constraint
     */
    addJoint(joint, disableCollisionsBetweenLinkedBodies = false) {
        this._dynamicsWorld.addConstraint(joint._constraint, disableCollisionsBetweenLinkedBodies);
    }

    removeJoint(joint) {
        this._dynamicsWorld.removeConstraint(joint._constraint);
    }

    /**
     * Action
     */
    addAction(action) {
        this._dynamicsWorld.addAction(action);
    }

    removeAction(action) {
        this._dynamicsWorld.removeAction(action);
    }


    /* 
     * Run RigidBody simulation for the specified physics world 
     */
    step(timestep, maxSubSteps = 1, fixedTimeStep = 1 / 60) {

        /* 
         * advance simulation, we can only step one frame forward
         * 
         * copy from blender
         */

        const substep = timestep / maxSubSteps;

        let substep_data = RigidBody.createSubstepData(this);

        const interpStep = 1 / maxSubSteps;
        let curInterpVal = interpStep;

        for (let i = 0; i < maxSubSteps; i++) {
            RigidBody.updateKinematic(substep_data, curInterpVal);
            // step_simulation(rbw->shared->physics_world, substep, 0, substep);
            this._dynamicsWorld.stepSimulation(substep, 0, substep);
            curInterpVal += interpStep;
        }

        for (let i = 0, il = this.bodies.length; i < il; i++) {

            const objPhys = this.bodies[i];
            const objThree = objPhys.entity;

            if (objPhys.type != BODYTYPE_KINEMATIC)
                // if (!objPhys.animated)
                objPhys.update(objThree);

        }

    }

}

class Shape {

    constructor() {

        this._shape = null;

        this.type = '';
    }

    setMargin(margin) {
        this._shape.setMargin(margin);
    }

    static fromMesh() {

    }

    static CreateShape(mesh, type) {

        let shape = null;

        let size = mesh && mesh.isMesh ? mesh.geometry.parameters : {};

        if (type !== undefined) {
            switch (type) {
                case 'box':
                    shape = new Box(size.width, size.height, size.depth);
                    break;
                case 'sphere':
                    shape = new Sphere(size.radius);
                    break;
                case 'capsule':
                    shape = new Capsule();
                    break;
                case 'cylinder':
                    shape = new Cylinder(Math.max(size.radiusTop, size.radiusBottom), size.height);
                    break;
                case 'cone':
                    shape = new Cone(size.radius, size.height);
                    break;
                case 'convex':
                    shape = new ConvexHull(mesh);
                    break;
                case 'mesh':
                    shape = new Mesh(mesh);
                    break;
                case 'gmesh':
                    shape = new GImpactMesh(mesh);
                    break;
                case 'compound':
                    shape = new Compound();
                    break;
            }
        } else {
            switch (mesh.geometry.type) {
                case 'BoxGeometry':
                    shape = new Box(size.width, size.height, size.depth);
                    break;
                case 'SphereGeometry':
                    shape = new Sphere(size.radius);
                    break;
                case 'CylinderGeometry':
                    shape = new Cylinder(Math.max(size.radiusTop, size.radiusBottom), size.height);
                    break;
                case 'ConeGeometry':
                    shape = new Cone(size.radius, size.height);
                    break;
            }

        }

        return shape;
    }

}

class Box extends Shape {

    constructor(width = 1.0, height = 1.0, depth = 1.0) {

        super();

        this._shape = new Ammo.btBoxShape(new Ammo.btVector3(width / 2, height / 2, depth / 2));

    }


}

class Sphere extends Shape {

    constructor(radius = 0.5) {

        super();

        this._shape = new Ammo.btSphereShape(radius);
    }
}


class Capsule extends Shape {

    constructor(radius = 0.5, height = 2) {

        super();

        height = Math.max(height - 2 * radius, 0);

        this._shape = new Ammo.btCapsuleShape(radius, height);
    }

}

class Cylinder extends Shape {

    constructor(radius = 0.5, height = 1) {

        super();

        this._shape = new Ammo.btCylinderShape(new Ammo.btVector3(radius, height / 2, radius));

    }

}

class Cone extends Shape {

    constructor(radius = 1, height = 1) {

        super();

        this._shape = new Ammo.btConeShape(radius, height);

    }

}

// class Plane extends Shape {

//     constructor(radius = 1, height = 1) {

//         super();

//         this._shape = new Ammo.btConeShape(radius, height);

//     }

// }

class Compound extends Shape {

    constructor() {

        super();

        this._shape = new Ammo.btCompoundShape();

    }

    addShape(shape, pos = new Vec3(0, 0, 0), qua = new Quaternion(0, 0, 0, 1)) {

        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(qua.x, qua.y, qua.z, qua.w));

        this._shape.addChildShape(transform, shape._shape);

    }

}

class GImpactMesh extends Shape {

    constructor(mesh) {

        super();

        // 
        let faces, vertices;
        let totvert = 0;

        if (mesh.type == 'Mesh') {
            let data = getMeshData(mesh);
            console.log(data);

            faces = data.faces;
            vertices = data.vertices;

            totvert = vertices.length;

        }
        else {
            console.error("cannot make mesh shape for non-Mesh object");
        }

        if (totvert == 0) {
            console.error("no vertices to define mesh shape with");
        }

        /* vertices, faces */
        // this._shape = new Ammo.btCompoundShape();

        let triMesh = new Ammo.btTriangleMesh(true, true);

        for (let i = 0, l = faces.length; i < l; i++) {
            let a = faces[i].a;
            let b = faces[i].b;
            let c = faces[i].c;
            triMesh.addTriangle(
                new Ammo.btVector3(vertices[a].x, vertices[a].y, vertices[a].z),
                new Ammo.btVector3(vertices[b].x, vertices[b].y, vertices[b].z),
                new Ammo.btVector3(vertices[c].x, vertices[c].y, vertices[c].z),
                false
            );
        }

        // let gimpactShape = new Ammo.btGImpactMeshShape(triMesh);
        this._shape = new Ammo.btGImpactMeshShape(triMesh);

        // console.log(this._shape)

        // let transform = new Ammo.btTransform();
        // transform.setIdentity();
        // transform.setOrigin(new Ammo.btVector3(0, 0, 0));
        // transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));

        // this._shape.addChildShape(transform, gimpactShape);
    }
}

class ConvexHull extends Shape {

    constructor(mesh) {

        super();

        if (mesh.isMesh) {

            this._shape = new Ammo.btConvexHullShape();

            let scale = mesh.scale;

            let vertices = getMeshData(mesh).vertices;

            let vertex = new Ammo.btVector3(0, 0, 0);

            for (let i = 0; i < vertices.length; i++) {
                let a = scale.x * vertices[i].x;
                let b = scale.y * vertices[i].y;
                let c = scale.z * vertices[i].z;

                vertex.setValue(a, b, c);

                this._shape.addPoint(vertex, true);
            }

        } else {
            console.error("cannot make Convex Hull collision shape for non-Mesh object");
        }

    }
}

class Mesh extends Shape {

    constructor(mesh) {

        super();

        // 
        let faces, vertices;
        let totvert = 0;

        if (mesh.isMesh) {
            let data = getMeshData(mesh);

            faces = data.faces;
            vertices = data.vertices;

            totvert = vertices.length;

        }
        else {
            console.error("cannot make mesh shape for non-Mesh object");
        }

        if (totvert == 0) {
            console.error("no vertices to define mesh shape with");
        }

        /* vertices, faces */
        this._shape = new Ammo.btCompoundShape();

        let triMesh = new Ammo.btTriangleMesh(true, true);

        for (let i = 0, l = faces.length; i < l; i++) {
            let a = faces[i].a;
            let b = faces[i].b;
            let c = faces[i].c;
            triMesh.addTriangle(
                new Ammo.btVector3(vertices[a].x, vertices[a].y, vertices[a].z),
                new Ammo.btVector3(vertices[b].x, vertices[b].y, vertices[b].z),
                new Ammo.btVector3(vertices[c].x, vertices[c].y, vertices[c].z),
                false
            );
        }

        let triangleMeshShape = new Ammo.btBvhTriangleMeshShape(triMesh, true, true);

        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(0, 0, 0));
        transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));

        this._shape.addChildShape(transform, triangleMeshShape);

    }
}

function getMeshData(mesh) {

    const index = mesh.geometry.index !== null ? mesh.geometry.index : undefined;
    const attributes = mesh.geometry.attributes;
    const scale = mesh.scale;

    if (attributes.position === undefined) {

        console.error('getMeshData(): Position attribute required for conversion.');
        return;

    }

    const position = attributes.position;

    let vertices = [];
    let faces = [];

    for (let i = 0; i < position.count; i++) {

        vertices.push({
            x: scale.x * position.getX(i),
            y: scale.y * position.getY(i),
            z: scale.z * position.getZ(i)
        });

    }

    if (index !== undefined) {

        for (let i = 0; i < index.count; i += 3) {

            faces.push({
                a: index.getX(i),
                b: index.getX(i + 1),
                c: index.getX(i + 2)
            });

        }

    } else {

        for (let i = 0; i < position.count; i += 3) {

            faces.push({
                a: i,
                b: i + 1,
                c: i + 2
            });

        }
    }

    return {
        vertices,
        faces
    }
}

class Joint {

    constructor() {

        this._constraint = null;

        this._bodyA = null;
        this._bodyB = null;
        this._breakForce = 3.4e+38;
        this._enableCollision = true;

    }

    set bodyA(body) {
        // this._destroyConstraint();
        this._bodyA = body;
        // this._createConstraint();
    }

    get bodyA() {
        return this._bodyA;
    }

    set bodyB(body) {
        // this._destroyConstraint();
        this._bodyB = body;
        // this._createConstraint();
    }

    get bodyB() {
        return this._bodyB;
    }

    set breakForce(force) {
        if (this._constraint && this._breakForce !== force) {
            this._constraint.setBreakingImpulseThreshold(force);
            this._breakForce = force;
        }
    }

    get breakForce() {
        return this._breakForce;
    }

    set enableCollision(enableCollision) {
        this._destroyConstraint();
        this._enableCollision = enableCollision;
        this._createConstraint();
    }

    get enableCollision() {
        return this._enableCollision;
    }

}

class PointJoint extends Joint {

    /**
     * 
     * @param {RigidBody} rb1 
     * @param {Vec3} p1 local pivot position
     * @param {RigidBody} rb2 
     * @param {Vec3} p2 local pivot position
     */
    constructor(rb1, p1, rb2, p2) {

        super();

        // console.log(pivot);

        // x.dot3(m_basis[0], m_basis[1], m_basis[2]) + m_origin;
        // let pivot1 = transMulVec(body1.getWorldTransform().inverse(),
        //     new Ammo.btVector3(pivot.x, pivot.y, pivot.z));
        // let pivot2 = transMulVec(body2.getWorldTransform().inverse(),
        //     new Ammo.btVector3(pivot.x, pivot.y, pivot.z));

        let body1 = rb1._body;
        let pivot1 = new Ammo.btVector3(p1.x, p1.y, p1.z);

        if (rb2 && p2) {
            let body2 = rb2._body;
            let pivot2 = new Ammo.btVector3(p2.x, p2.y, p2.z);
            this._constraint = new Ammo.btPoint2PointConstraint(body1, body2, pivot1, pivot2);
        } else {
            this._constraint = new Ammo.btPoint2PointConstraint(body1, pivot1);
        }

        // let loc = worldToLocal(body1.getWorldTransform(), new Ammo.btVector3(p1.x, p1.y, p1.z));
        // console.log(loc.x(), loc.y(), loc.z());

    }

}

class HingeJoint extends Joint {

    constructor(rb1, p1, a1, rb2, p2, a2) {
        super();

        let body1 = rb1._body;
        let pivot1 = new Ammo.btVector3(p1.x, p1.y, p1.z);
        let axis1 = new Ammo.btVector3(a1.x, a1.y, a1.z);

        if (rb2 && p2 && a2) {
            let body2 = rb2._body;
            let pivot2 = new Ammo.btVector3(p2.x, p2.y, p2.z);
            let axis2 = new Ammo.btVector3(a2.x, a2.y, a2.z);

            this._constraint = new Ammo.btHingeConstraint(body1, body2, pivot1, pivot2, axis1, axis2);
        } else {
            this._constraint = new Ammo.btHingeConstraint(body1, pivot1, axis1);
        }

    }
}

// TODO
class SixDofSpringJoint extends Joint {

    constructor(rb1, p1, a1, rb2, p2, a2) {
        super();

        let body1 = rb1._body;
        new Ammo.btVector3(p1.x, p1.y, p1.z);
        new Ammo.btVector3(a1.x, a1.y, a1.z);

        if (rb2 && p2 && a2) {
            let body2 = rb2._body;
            new Ammo.btVector3(p2.x, p2.y, p2.z);
            new Ammo.btVector3(a2.x, a2.y, a2.z);

            this._constraint = new Ammo.btGeneric6DofSpringConstraint(body1, body2, frameA, frameB, !this._enableCollision);

            Ammo.destroy(frameB);
        } else {
            this._constraint = new Ammo.btGeneric6DofSpringConstraint(body1, frameA, !this._enableCollision);
        }

        const axis = ['X', 'Y', 'Z', 'X', 'Y', 'Z'];

        for (let i = 0; i < 6; i++) {
            const type = i < 3 ? '_linear' : '_angular';
            this._constraint.enableSpring(i, this[type + 'Spring' + axis[i]]);
            this._constraint.setDamping(i, this[type + 'Damping' + axis[i]]);
            this._constraint.setEquilibriumPoint(i, this[type + 'Equilibrium' + axis[i]]);
            this._constraint.setStiffness(i, this[type + 'Stiffness' + axis[i]]);
        }

    }

}

export { ACTIVE_TAG$1 as ACTIVE_TAG, BODYFLAG_KINEMATIC_OBJECT, BODYFLAG_NORESPONSE_OBJECT, BODYFLAG_STATIC_OBJECT, BODYGROUP_DEFAULT, BODYGROUP_DYNAMIC, BODYGROUP_ENGINE_1, BODYGROUP_ENGINE_2, BODYGROUP_ENGINE_3, BODYGROUP_KINEMATIC, BODYGROUP_NONE, BODYGROUP_STATIC, BODYGROUP_TRIGGER, BODYGROUP_USER_1, BODYGROUP_USER_2, BODYGROUP_USER_3, BODYGROUP_USER_4, BODYGROUP_USER_5, BODYGROUP_USER_6, BODYGROUP_USER_7, BODYGROUP_USER_8, BODYMASK_ALL, BODYMASK_NONE, BODYMASK_NOT_STATIC, BODYMASK_NOT_STATIC_KINEMATIC, BODYMASK_STATIC, BODYSTATE_ACTIVE_TAG, BODYSTATE_DISABLE_DEACTIVATION, BODYSTATE_DISABLE_SIMULATION, BODYSTATE_ISLAND_SLEEPING$1 as BODYSTATE_ISLAND_SLEEPING, BODYSTATE_WANTS_DEACTIVATION, BODYTYPE_DYNAMIC, BODYTYPE_KINEMATIC, BODYTYPE_STATIC, Box, CF_DYNAMIC, CF_KINEMATIC, CF_STATIC, Capsule, Compound, Cone, ConvexHull, Cylinder, DISABLE_DEACTIVATION$1 as DISABLE_DEACTIVATION, DISABLE_SIMULATION, HingeJoint, ISLAND_SLEEPING, Joint, Mesh, PointJoint, Quaternion, RigidBody, Shape, SixDofSpringJoint, Sphere, Vec3, WANTS_DEACTIVATION, World };