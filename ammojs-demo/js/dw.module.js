import * as THREE from "../lib/three.module.js";
import { OrbitControls } from "../lib/OrbitControls.js";
import { TransformControls } from "../lib/TransformControls.js";
import * as dat from "../lib/dat.gui.module.js";

/** 
 * Ammo.js as a physics engine
*/

let DW = {};

DW.Engine = (function () {

    function Engine() {
        let options = {
            antialias: false,
            allowSleep: false,
            // gravity: new CANNON.Vec3(0, 0, -10),
            message: 'Select an object to start',
            save_as_picture: null
        }

        this.options = options;

        this.world = null;
        this.timestep = 1 / 60;
        this.environment = null;
        this.camera = null;
        this.renderer = null;
        this.control = null;
        this.raycaster = null;
        this.mouse = null;

        //create clock for timing
        this.clock = new THREE.Clock();

        this._activeRenderLoops = [];

        this.antialias = false;

        Engine._initWorld.bind(this)();
        Engine._initScene.bind(this)();
        Engine._initControl.bind(this)();
        Engine._initUI.bind(this)();
        Engine._initGUI.bind(this)();

        window.addEventListener("resize", this.onWindowResize.bind(this), false);
    }

    Engine._initWorld = function () {

        let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
            dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
            overlappingPairCache = new Ammo.btDbvtBroadphase(),
            solver = new Ammo.btSequentialImpulseConstraintSolver();

        this.world = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
        this.world.setGravity(new Ammo.btVector3(0, -20, 0));

    }

    Engine._initScene = function () {
        this.environment = new THREE.Scene();
        this.scene = new THREE.Scene();
        this.environment.add(this.scene);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.camera.position.set(30, 30, 40);

        // RENDERER
        this.renderer = new THREE.WebGLRenderer({
            antialias: this.antialias,
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x787878);
        // renderer.sortObjects = false;
        document.body.appendChild(this.renderer.domElement);

        //添加辅助线
        let helper = new THREE.GridHelper(400, 100);
        helper.rotateX(Math.PI / 2);
        // helper.material.opacity = 0.75;
        helper.material.transparent = true;
        // this.environment.add(helper);

        //添加光源
        let ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // soft white light
        let spotLight = new THREE.PointLight(0xffffff, 1);
        spotLight.position.set(20, 20, 50);
        // spotLight.castShadow = true;
        // spotLight.shadow.mapSize.height = 4096;
        // spotLight.shadow.mapSize.width = 4096;
        //spotLight.castShadow = true ;
        this.environment.add(spotLight, ambientLight);

        // const spotLightHelper = new THREE.SpotLightHelper(spotLight);
        // this.environment.add(spotLightHelper);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMapSoft = true;

        // this.environment.fog = new THREE.FogExp2(0x000000, 0.01);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }

    Engine._initControl = function () {

        this.control = new OrbitControls(this.camera, this.renderer.domElement);
        this.control.enableDamping = true;
        this.control.dampingFactor = 0.05;
        // this.control.maxPolarAngle = 1.5;
        this.control.update();

        window.addEventListener('keydown', (event) => {
            // console.log(event.keyCode);

            switch (event.keyCode) {
                case 110:
                    if (this.transformControls.object) {
                        let position = new THREE.Vector3();
                        position.copy(this.transformControls.object.position);
                        this.control.target = position;
                    }
                    break;
            }

        });

        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        this.environment.add(this.transformControls);

        /**
         * Select Controls
        */

        (function (_canvas, _camera, _scene) {

            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();

            let onDownPosition = new THREE.Vector2();
            let onUpPosition = new THREE.Vector2();

            let transformControls = this.transformControls;

            transformControls.addEventListener('dragging-changed', (event) => {

                this.control.enabled = !event.value;    // 禁用 OrbitControls

            });
            transformControls.addEventListener('mouseDown', () => {

                // console.log(transformControls.object.body);

                if (transformControls.object.body !== void 0) {

                    // if (!transformControls.object.body.isStaticObject())
                    transformControls.object.body.setActivationState(2);

                    document.body.addEventListener('mousemove', handleMove);

                    transformControls.addEventListener('mouseUp', () => {

                        // if (!transformControls.object.body.isStaticObject())
                        transformControls.object.body.setActivationState(1);

                        transformControls.object.body.activate();

                        document.body.removeEventListener('mousemove', handleMove);

                    });
                }

            });

            /** 
             * 更改模式
            */
            window.addEventListener('keydown', (event) => {
                console.log(event.keyCode);
                switch (event.keyCode) {
                    case 84: // Translate
                        transformControls.setMode('translate');
                        break;
                    case 82: // Rotate
                        transformControls.setMode('rotate');
                        break;
                }
            });

            /** 
             * 处理Transform Controls 的移动
            */
            function handleMove() {
                let position = new THREE.Vector3();
                let quat = new THREE.Vector4();
                position.copy(transformControls.object.position);
                quat.copy(transformControls.object.quaternion);

                let transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
                transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
                let motionState = new Ammo.btDefaultMotionState(transform);

                transformControls.object.body.setMotionState(motionState);
            }

            document.body.addEventListener('mousedown', onMouseDown, false);
            // document.body.addEventListener('touchstart', onTouchStart, false);

            function onMouseDown(event) {

                // event.preventDefault();

                onDownPosition = getMousePosition(_canvas, event.clientX, event.clientY);

                document.addEventListener('mouseup', onMouseUp, false);

            }

            function onMouseUp(event) {

                onUpPosition = getMousePosition(_canvas, event.clientX, event.clientY);

                handleClick();

                document.removeEventListener('mouseup', onMouseUp, false);

            }

            function getMousePosition(dom, x, y) {

                let rect = dom.getBoundingClientRect();

                let p_x = (x - rect.left) / rect.width,
                    p_y = (y - rect.top) / rect.height;

                return new THREE.Vector2(p_x, p_y);

            }

            // object picking

            function getIntersects(point, objects) {

                mouse.set((point.x * 2) - 1, - (point.y * 2) + 1);

                raycaster.setFromCamera(mouse, _camera);

                return raycaster.intersectObjects(objects);

            }

            function handleClick() {

                if (onDownPosition.distanceTo(onUpPosition) === 0) {

                    transformControls.detach();

                    let objectCollections = [];

                    _scene.traverse((child) => {
                        if (child.children.length == 0)
                            objectCollections.push(child);
                    });

                    // console.log(objectCollections);


                    let intersects = getIntersects(onUpPosition, objectCollections);

                    if (intersects.length > 0) {

                        let object = intersects[0].object;

                        // console.log(object);

                        transformControls.attach(object);

                    }

                }

            }
        }).bind(this)(this.renderer.domElement, this.camera, this.scene);

    }

    Engine._initUI = function () {

        /**
         * download button
         */

        this.options.save_as_picture = function () {
            let link = document.createElement("a");

            document.body.appendChild(link);

            let canvas = this.renderer.domElement;

            link.download = "myimage.png";
            link.href = canvas.toDataURL("image/png");

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }.bind(this);

    }

    Engine._initGUI = function () {
        this.gui = new dat.GUI();

        this.settings = this.gui.addFolder('Settings');
        // let gravity = this.settings.addFolder('Gravity');
        // gravity.add(this.options.gravity, 'x');
        // gravity.add(this.options.gravity, 'y');
        // gravity.add(this.options.gravity, 'z');
        this.settings.add(this.options, 'allowSleep').onChange((enabled) => {
            if (enabled) {
                this.world.allowSleep = true;
            } else {
                this.world.allowSleep = false;
                console.log('false');
            }
        });

        this.settings.add(this.options, 'antialias').onChange((enabled) => {
            if (enabled) {

                // this.renderer = new THREE.WebGLRenderer({
                //     antialias: true,
                //     preserveDrawingBuffer: true
                // });

                console.log('true');
            } else {

                // this.renderer = new THREE.WebGLRenderer({
                //     antialias: false,
                //     preserveDrawingBuffer: true
                // });

                console.log('false');
            }

        });
        this.gui.add(this.options, 'message');
        this.gui.add(this.options, 'save_as_picture');

    }

    // Engine.prototype.enabledPhysics = function(gravity){

    // }

    Engine.prototype.stopRenderLoop = function (renderFunction) {
        if (!renderFunction) { // 停止全部
            this._activeRenderLoops = [];
            return;
        }
        var index = this._activeRenderLoops.indexOf(renderFunction);
        if (index >= 0) {
            this._activeRenderLoops.splice(index, 1);
        }
    };

    Engine._updatePhysics = function () {
        let tmpTrans = new Ammo.btTransform();

        let deltaTime = this.clock.getDelta();

        // Step world
        this.world.stepSimulation(deltaTime, 10);

        this.scene.traverse((child) => {
            if ((!this.transformControls.dragging || this.transformControls.object !== child) && child.body) {
                // Update rigid bodies

                let objAmmo = child.body;
                let ms = objAmmo.getMotionState();

                if (ms) {

                    ms.getWorldTransform(tmpTrans);

                    let p = tmpTrans.getOrigin();
                    // console.log(p);
                    let q = tmpTrans.getRotation();
                    child.position.set(p.x(), p.y(), p.z());
                    child.quaternion.set(q.x(), q.y(), q.z(), q.w());

                }

            }
        });


    }

    Engine.prototype._renderLoop = function () {

        this.renderer.render(this.environment, this.camera);

        this.control.update();

        Engine._updatePhysics.bind(this)();

        if (this._activeRenderLoops.length > 0) {

            for (var index = 0; index < this._activeRenderLoops.length; index++) {
                var renderFunction = this._activeRenderLoops[index];
                renderFunction();
            }

        }

        window.requestAnimationFrame(this._boundRenderFunction);

    };

    /** 
     * Render the scene
     * @param {Function} renderFunction - additional function
    */
    Engine.prototype.runRenderLoop = function (renderFunction) {
        if (this._activeRenderLoops.indexOf(renderFunction) !== -1) { // 若在 this._activeRenderLoops 中存在
            return;
        }
        if (renderFunction)
            this._activeRenderLoops.push(renderFunction);

        this._boundRenderFunction = this._renderLoop.bind(this);

        window.requestAnimationFrame(this._boundRenderFunction);
    };

    Engine.prototype.onWindowResize = function () {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    return Engine;


})();

DW.AmmoJSPlugin = (function () {

    /** 
     * Initializes the ammoJS plugin
    */
    function AmmoJSPlugin() {
        this.name = "AmmoJSPlugin";
        this._timeStep = 1 / 60;
        this._fixedTimeStep = 1 / 60;
        this._maxSteps = 5;

        this._collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        this._dispatcher = new Ammo.btCollisionDispatcher(this._collisionConfiguration);
        this._overlappingPairCache = new Ammo.btDbvtBroadphase();
        this._solver = new Ammo.btSequentialImpulseConstraintSolver();
        this._softBodySolver = new Ammo.btDefaultSoftBodySolver();

        // this.world = new Ammo.btSoftRigidDynamicsWorld(this._dispatcher, this._overlappingPairCache, this._solver, this._collisionConfiguration, this._softBodySolver);

        // this.world = new Ammo.btDiscreteDynamicsWorld(this._dispatcher, this._overlappingPairCache, this._solver, this._collisionConfiguration);
        // this.world.setGravity(new Ammo.btVector3(0, -20, 0));
    }

    /**
     * Sets the gravity of the physics world (m/(s^2))
     * @param {Ammo.btVector3} gravity Gravity to set
     */
    AmmoJSPlugin.prototype.setGravity = function (gravity) {
        this.world.setGravity(gravity);
        this.world.getWorldInfo().set_m_gravity(gravity);
    };

    /**
     * Amount of time to step forward on each frame (only used if useDeltaForWorldStep is false in the constructor)
     * @param timeStep timestep to use in seconds
     */
    AmmoJSPlugin.prototype.setTimeStep = function (timeStep) {
        this._timeStep = timeStep;
    };

    /**
     * Increment to step forward in the physics engine (If timeStep is set to 1/60 and fixedTimeStep is set to 1/120 the physics engine should run 2 steps per frame) (Default: 1/60)
     * @param fixedTimeStep fixedTimeStep to use in seconds
     */
    AmmoJSPlugin.prototype.setFixedTimeStep = function (fixedTimeStep) {
        this._fixedTimeStep = fixedTimeStep;
    };

    /**
     * Sets the maximum number of steps by the physics engine per frame (Default: 5)
     * @param maxSteps the maximum number of steps by the physics engine per frame
     */
    AmmoJSPlugin.prototype.setMaxSteps = function (maxSteps) {
        this._maxSteps = maxSteps;
    };

    /**
     * Gets the current timestep (only used if useDeltaForWorldStep is false in the constructor)
     * @returns the current timestep in seconds
     */
    AmmoJSPlugin.prototype.getTimeStep = function () {
        return this._timeStep;
    };

    // Ammo's behavior when maxSteps > 0 does not behave as described in docs
    // @see http://www.bulletphysics.org/mediawiki-1.5.8/index.php/Stepping_The_World
    //
    // When maxSteps is 0 do the entire simulation in one step
    // When maxSteps is > 0, run up to maxStep times, if on the last step the (remaining step - fixedTimeStep) is < fixedTimeStep, the remainder will be used for the step. (eg. if remainder is 1.001 and fixedTimeStep is 1 the last step will be 1.001, if instead it did 2 steps (1, 0.001) issues occuered when having a tiny step in ammo)
    // Note: To get deterministic physics, timeStep would always need to be divisible by fixedTimeStep
    AmmoJSPlugin.prototype._stepSimulation = function (timeStep, maxSteps, fixedTimeStep) {
        if (timeStep === void 0) { timeStep = 1 / 60; }
        if (maxSteps === void 0) { maxSteps = 10; }
        if (fixedTimeStep === void 0) { fixedTimeStep = 1 / 60; }
        if (maxSteps == 0) {
            this.world.stepSimulation(timeStep, 0);
        }
        else {
            while (maxSteps > 0 && timeStep > 0) {
                if (timeStep - fixedTimeStep < fixedTimeStep) {
                    this.world.stepSimulation(timeStep, 0);
                    timeStep = 0;
                }
                else {
                    timeStep -= fixedTimeStep;
                    this.world.stepSimulation(fixedTimeStep, 0);
                }
                maxSteps--;
            }
        }
    };

    /**
     * Creates a physics body using the plugin
     * @param {Mesh} mesh
     * @param {Object} params the info to create the physics body on
     */
    AmmoJSPlugin.prototype.generatePhysicsBody = function (mesh, params) {
        let mass = params.mass || 0;
        let restitution = params.restitution || 0.4;
        let friction = params.friction || 0.8;

        let colShape = this._createShape(mesh);

        let body;

        switch (params.type) {
            case 'soft':
                console.warn('SoftBody is not currently supported');
                break;

            case 'rigid':
                let transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin(new Ammo.btVector3(mesh.position.x, mesh.position.y, mesh.position.z));
                transform.setRotation(new Ammo.btQuaternion(mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w));

                let motionState = new Ammo.btDefaultMotionState(transform);

                let localInertia = new Ammo.btVector3(0, 0, 0);

                if (mass !== 0) {
                    colShape.calculateLocalInertia(mass, localInertia);
                }

                let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
                body = new Ammo.btRigidBody(rbInfo);
                body.setRestitution(restitution);
                body.setFriction(friction);

                break;
        }

        return body;
    }

    // adds all verticies (including child verticies) to the convex hull shape
    AmmoJSPlugin.prototype._addHullVerts = function (btConvexHullShape, topLevelMesh, mesh) {
        let geometry = new THREE.Geometry().fromBufferGeometry(mesh.geometry);

        let scale = mesh.scale;

        // console.log(geometry);

        let triangleCount = geometry.vertices.length;

        let vertex = new Ammo.btVector3(0, 0, 0);

        for (let i = 0; i < geometry.vertices.length; i++) {
            let a = scale.x * geometry.vertices[i].x;
            let b = scale.y * geometry.vertices[i].y;
            let c = scale.z * geometry.vertices[i].z;

            vertex.setValue(a, b, c);

            btConvexHullShape.addPoint(vertex, true);
        }

        mesh.children.forEach(function (childMesh) {
            triangleCount += this._addHullVerts(btConvexHullShape, topLevelMesh, childMesh);
        });

        return triangleCount;
    }

    /** 
     * Create Collision Shape 
     * @param {Mesh} mesh 
     * @param {Boolean} ignoreChildren whether to ignore the children
    */
    AmmoJSPlugin.prototype._createShape = function (mesh, ignoreChildren) {

        let returnShape;

        if (ignoreChildren === void 0) { ignoreChildren = false; }

        if (!ignoreChildren) {
            let meshChildren = mesh.children;

            returnShape = new Ammo.btCompoundShape();

            let childrenAdded = 0;

            meshChildren.forEach((childMesh) => {

                let shape = createCollisionShape(childMesh);

                let scale = childMesh.parent.scale;

                let transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin(new Ammo.btVector3(childMesh.position.x * scale.x, childMesh.position.y * scale.y, childMesh.position.z * scale.z));
                transform.setRotation(new Ammo.btQuaternion(childMesh.quaternion.x, childMesh.quaternion.y, childMesh.quaternion.z, childMesh.quaternion.w));

                returnShape.addChildShape(transform, shape);

                childrenAdded++;
            });

            if (childrenAdded > 0) {
                // Add parents shape as a child if present
                if (mesh.type == 'Mesh') {
                    var shape = this._createShape(mesh, true);
                    if (shape) {
                        let transform = new Ammo.btTransform();
                        transform.setIdentity();
                        transform.setOrigin(new Ammo.btVector3(0, 0, 0));
                        transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
                        returnValue.addChildShape(transform, shape);
                    }
                }
                return returnShape;
            }
            else {
                // If no children with impostors create the actual shape below instead
                Ammo.destroy(returnShape);
                returnShape = null;
            }
        }

        switch (mesh.geometry.type) {
            case 'BoxGeometry':
            case 'BoxBufferGeometry':
                returnShape = new Ammo.btBoxShape(new Ammo.btVector3(mesh.geometry.parameters.width * 0.5, mesh.geometry.parameters.height * 0.5, mesh.geometry.parameters.depth * 0.5));
                break;
            case 'CircleGeometry':
            case 'CircleBufferGeometry':
                console.warn('CircleGeometry is not currently supported');
                break;
            case 'ConeGeometry':
            case 'ConeBufferGeometry':
                console.warn('ConeGeometry is not currently supported');
                break;
            case 'CylinderGeometry':
            case 'CylinderBufferGeometry':
                if (mesh.geometry.parameters.radiusTop == mesh.geometry.parameters.radiusBottom)
                    returnShape = new Ammo.btCylinderShape(new Ammo.btVector3(mesh.geometry.parameters.radiusTop, mesh.geometry.parameters.height * 0.5, mesh.geometry.parameters.radiusTop));
                else
                    console.warn('The radius is not equal');
                break;
            case 'PlaneGeometry':
            case 'PlaneBufferGeometry':
                returnShape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(0, 0, 1), 1);
                break;
            case 'SphereGeometry':
            case 'SphereBufferGeometry':
                returnShape = new Ammo.btSphereShape(mesh.geometry.parameters.radius);
                break;
            case 'ConvexHull':
                let convexShape = new Ammo.btConvexHullShape();
                let triangeCount = this._addHullVerts(convexShape, mesh, mesh);
                if (triangeCount == 0) {
                    // Cleanup Unused Convex Hull Shape
                    // impostor._pluginData.toDispose.push(convexShape);
                    returnShape = new Ammo.btCompoundShape();
                }
                else {
                    returnShape = convexShape;
                }
                break;
        }

        return returnShape;
    }

    return AmmoJSPlugin;

})();

export default DW;