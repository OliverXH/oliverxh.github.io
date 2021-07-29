import { Object3D } from './core/Object3D.js';
import { Box3 } from './math/Box3.js';
import { Vector3 } from './math/Vector3.js';

let SceneUtils = {
    createMultiMaterialObject: function (e, t) {
        for (var n = new Ls, r = 0, i = t.length; r < i; r++)
            n.add(new ta(e, t[r]));
        return n
    },
    detach: function (e, t, n) {
        e.applyMatrix(t.matrixWorld),
            t.remove(e),
            n.add(e)
    },
    attach: function (e, t, n) {
        e.applyMatrix((new or).copy(n.matrixWorld).invert()),
            t.remove(e),
            n.add(e)
    },
    getMaterialByName: function (e, t) {
        t = this.getMaterialsByName(e, t);
        return t.length ? t[0] : null
    },
    getMaterialsByName: function (e, t) {
        var n = [];
        return null !== e.scene && (e.scene.traverse(function (e) {
            e.material && e.material.name === t && -1 === n.indexOf(e.material) && n.push(e.material)
        }),
            null !== (e = e.scene.worldMaterial) && e.name === t && -1 === n.indexOf(e) && n.push(e)),
            n
    },
    getAnimationActionByName: function (e, t) {
        for (var n = 0; n < e.actions.length; n++) {
            var r = e.actions[n];
            if (r.getClip().name == t)
                return r
        }
        return null
    },
    checkActionIsUsed: function (t, e) {
        return Boolean(e._propertyBindings.find(function (e) {
            e = e.binding.node;
            return e && e.findRoot() === t
        }))
    },
    createEnvironmentMaterial: function (e, t, n) {
        var r = new Eu.DiGraph(6)
            , i = {};
        return r.node(0).originData = {
            name: "Light Path",
            type: "LIGHT_PATH_BL",
            inputs: [],
            outputs: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            is_active_output: !1
        },
            r.node(1).originData = {
                name: "Lighting Texture",
                type: "TEX_ENVIRONMENT_BL",
                projection: "EQUIRECTANGULAR",
                inputs: [[0, 0, 0]],
                outputs: [[0, 0, 0, 0]],
                texture: 0,
                is_active_output: !1
            },
            i[Md.nodeTexUniName("TEX_ENVIRONMENT_BL", 0)] = t,
            n instanceof ei ? ((t = [0, 0, 0, 0])[0] = n.r,
                t[1] = n.g,
                t[2] = n.b,
                t[3] = 1,
                r.node(2).originData = {
                    name: "Background Color",
                    type: "RGB_BL",
                    inputs: [],
                    outputs: [t],
                    is_active_output: !1
                }) : (r.node(2).originData = {
                    name: "Background Texture",
                    type: "TEX_ENVIRONMENT_BL",
                    projection: "EQUIRECTANGULAR",
                    inputs: [[0, 0, 0]],
                    outputs: [[0, 0, 0, 0]],
                    texture: 1,
                    is_active_output: !1
                },
                    i[Md.nodeTexUniName("TEX_ENVIRONMENT_BL", 1)] = n),
            r.node(3).originData = {
                name: "Mix",
                type: "MIX_RGB_BL",
                blendType: "MIX",
                inputs: [0, [0, 0, 0, 0], [0, 0, 0, 0]],
                outputs: [[0, 0, 0, 0]],
                is_active_output: !1
            },
            r.node(4).originData = {
                name: "Background",
                type: "BACKGROUND_BL",
                inputs: [[0, 0, 0, 0], 1],
                outputs: [[0, 0, 0, 0]],
                is_active_output: !1
            },
            r.node(5).originData = {
                name: "Output",
                type: "OUTPUT_WORLD_BL",
                inputs: [[0, 0, 0, 0], [0, 0, 0, 0]],
                outputs: [],
                is_active_output: !0
            },
            wd(r, 0, 0, 3, 0),
            wd(r, 1, 0, 3, 1),
            wd(r, 2, 0, 3, 2),
            wd(r, 3, 0, 4, 0),
            wd(r, 4, 0, 5, 0),
            new MeshNodeMaterial({
                name: e,
                nodeGraph: r,
                nodeTextures: i
            })
    },
    calcSceneBox: function (scene) {
        var box = new Box3();
        return box.expandByObject(scene),
            box
    },
    createDefaultCamera: function (box, aspect) {
        var n = new Vector3()
            , r = 2 * box.getSize(n).length()
            , r = new PerspectiveCamera(45, aspect, r / 1e4, r);
        return r.position.copy(box.max).multiplyScalar(2),
            r.lookAt(box.getCenter(n)),
            r
    },
    assignDefaultControls: function (camera, box) {
        var target = new Object3D();
        box.getCenter(camera.position),
            camera.controls = {
                type: "ORBIT",
                enablePan: !0,
                rotateSpeed: 1,
                moveSpeed: 1,
                orbitMinDistance: camera.near,
                orbitMaxDistance: camera.far,
                orbitMinPolarAngle: 0,
                orbitMaxPolarAngle: Math.PI,
                orbitMinAzimuthAngle: -1 / 0,
                orbitMaxAzimuthAngle: 1 / 0,
                orbitTarget: target
            }
    }
}

export { SceneUtils };