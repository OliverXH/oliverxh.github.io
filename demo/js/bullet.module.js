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
     * @param t A number between 0 and 1. 0 will make this function return u, and 1 will make it return v. Numbers in between will generate a vector in between them.
     */
    lerp(vector, t, target) {
        const x = this.x;
        const y = this.y;
        const z = this.z;
        target.x = x + (vector.x - x) * t;
        target.y = y + (vector.y - y) * t;
        target.z = z + (vector.z - z) * t;
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

class World {

    constructor(options = {}) {

        const _collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),

            _dispatcher = new Ammo.btCollisionDispatcher(_collisionConfiguration),
            //  btGImpactCollisionAlgorithm::registerAlgorithm((btCollisionDispatcher *)world->dispatcher);

            _pairCache = new Ammo.btDbvtBroadphase(),

            // world.filterCallback = new rbFilterCallback();
            // world.pairCache.getOverlappingPairCache().setOverlapFilterCallback(world.filterCallback);

            /* constraint solving */
            _constraintSolver = new Ammo.btSequentialImpulseConstraintSolver();


        /* world */
        this._dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(_dispatcher, _pairCache, _constraintSolver, _collisionConfiguration);

        this._gravity = new Vec3();

        this.gravity = options.gravity !== undefined ? options.gravity : new Vec3(0, -9.82, 0);

        this._bodies = [];

    }

    get gravity() {
        return this._gravity;
    }

    set gravity(gravity) {
        this._gravity.copy(gravity);
        this._dynamicsWorld.setGravity(new Ammo.btVector3(gravity.x, gravity.y, gravity.z));
    }

    addBody(body) {
        this._bodies.push(body);
        this._dynamicsWorld.addRigidBody(body._body);
    }

    removeBody(body) {
        let index = this._bodies.indexOf(body);
        this._bodies.splice(index, 1);

        this._dynamicsWorld.removeRigidBody(body);
    }

    step(timeStep, maxSubSteps = 1, fixedTimeStep = 1 / 60) {

        this._dynamicsWorld.stepSimulation(timeStep, maxSubSteps, fixedTimeStep);

    }

}

const ACTIVE_TAG = 1;
const DISABLE_DEACTIVATION = 4;
const BODYTYPE_KINEMATIC = 'kinematic';

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

    clone() {
        return new Quaternion(this.x, this.y, this.z, this.w)
    }


}

class RigidBody {

    constructor(options = {}) {

        this._body = null;
        this._mass = options.mass !== undefined ? options.mass : 1;

        this._shape = options.shape !== undefined ? options.shape._shape : null;

        this._position = options.position !== undefined ? options.position : new Vec3();
        this._quaternion = options.quaternion !== undefined ? options.quaternion : new Quaternion();

        this._createBody();

    }


    get mass() {
        return this._mass;
    }

    set mass(mass) {
        if (this._mass !== mass) {
            this._mass = mass;

            let localInertia = new Ammo.btVector3(0, 0, 0);

            /* calculate new inertia if non-zero mass */
            if (mass) {
                this._body.getCollisionShape().calculateLocalInertia(mass, localInertia);
            }

            this._body.setMassProps(mass, localInertia);
            this._body.updateInertiaTensor();

        }
    }

    get position() {
        return this._position;
    }

    set position(pos) {

        this._position.copy(pos);

        let rot = this._body.getWorldTransform().getRotation();

        let trans = new Ammo.btTransform();
        trans.setIdentity();
        trans.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        trans.setRotation(rot);

        this._body.setWorldTransform(trans);

        if (this._type === BODYTYPE_KINEMATIC) {
            const ms = this._body.getMotionState();
            if (ms) {
                ms.setWorldTransform(trans);
            }
        }

    }

    addToWorld(world) {
        world.addBody(this);
        return this;
    }

    isActive() {
        return this._body ? this._body.isActive() : false;
    }

    activate() {
        if (this._body) {
            this._body.activate();
        }
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

    _createBody() {

        let trans = new Ammo.btTransform();
        trans.setIdentity();
        trans.setOrigin(new Ammo.btVector3(this._position.x, this._position.y, this._position.z));
        trans.setRotation(new Ammo.btQuaternion(this._quaternion.x, this._quaternion.y, this._quaternion.z, this._quaternion.w));
        let motionState = new Ammo.btDefaultMotionState(trans);

        const localInertia = new Ammo.btVector3(0, 0, 0);
        if (this._mass !== 0) {
            this._shape.setMargin(0.05);
            this._shape.calculateLocalInertia(this._mass, localInertia);
        }

        let rbInfo = new Ammo.btRigidBodyConstructionInfo(this._mass, motionState, this._shape, localInertia);
        this._body = new Ammo.btRigidBody(rbInfo);

    }

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

}
/*

mass
velocity

*/

// export const Box = Ammo.btBoxShape;

// export const Capsule = Ammo.btCapsuleShape;     // The btCapsuleShape represents a capsule around the Y axis
// export const CapsuleX = Ammo.btCapsuleShapeX;
// export const CapsuleZ = Ammo.btCapsuleShapeZ;

// export const Compound = Ammo.btCompoundShape;

// export const Concave = Ammo.btConcaveShape;

// export const Cone = Ammo.btConeShape;
// export const ConeX = Ammo.btConeShapeX;
// export const ConeZ = Ammo.btConeShapeZ;

// export const ConvexHull = Ammo.btConvexHullShape;

// export const Cylinder = Ammo.btCylinderShape;
// export const CylinderX = Ammo.btCylinderShapeX;
// export const CylinderZ = Ammo.btCylinderShapeZ;

// export const StaticMesh = Ammo.btBvhTriangleMeshShape;
// export const Mesh = Ammo.btGImpactMeshShape;

// export const Heightfield = Ammo.btHeightfieldTerrainShape;

// export const Plane = Ammo.btPlaneShape;
// export const StaticPlane = Ammo.btStaticPlaneShape;

// export const Sphere = Ammo.btSphereShape;

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

        let size = mesh.geometry.parameters;

        if (type !== undefined) {
            switch (type) {
                case 'box':
                    shape = new Box(size.width, size.height, size.depth);
                    break;
                case 'sphere':
                    shape = new Sphere(size.radius);
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

// export class Plane extends Shape {

//     constructor(radius = 1, height = 1) {

//         super();

//         this._shape = new Ammo.btConeShape(radius, height);

//     }

// }



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

        if (mesh.type == 'Mesh') {

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

        if (mesh.type == 'Mesh') {
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

export { Box, Cone, ConvexHull, Cylinder, Mesh, RigidBody, Shape, Sphere, Vec3, World };
