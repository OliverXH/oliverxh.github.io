/**
 * @fileOverview A JavaScript/GLSL sculpting script for sculpting Three.js meshes
 * @author Skeel Lee / http://cg.skeelogy.com/
 * @author Update by OliverXH / https://oliverxh.github.io/
 */

let GPUSculpt = (function () {

    /**
     * Creates a GPUSculpt instance for sculpting
     * @constructor
     * @param {object} options Options
     * @param {THREE.WebGLRenderer} options.renderer Three.js WebGL renderer
     * @param {THREE.Mesh} options.mesh Three.js mesh for sculpting
     * @param {Number} options.size size of mesh
     * @param {Number} options.res resolution of mesh
     * @param {Number} [options.proxyRes] resolution of proxy mesh
     */
    function GPUSculpt(options) {
        let threeJS = THREE;

        if (threeJS == void 0) {
            console.error("Three.js not specified");
            return;
        }

        if (typeof options.mesh === "undefined") {
            throw new Error("mesh not specified");
        }
        this.mesh = options.mesh;
        if (typeof options.renderer === "undefined") {
            throw new Error("renderer not specified");
        }
        this.renderer = options.renderer;
        if (typeof options.size === "undefined") {
            throw new Error("size not specified");
        }
        this.size = options.size;
        this.halfSize = this.size / 2.0;
        if (typeof options.res === "undefined") {
            throw new Error("res not specified");
        }
        this.res = options.res;

        this.gridSize = this.size / this.res;
        this.texelSize = 1.0 / this.res;

        this.imageProcessedData = new Float32Array(4 * this.res * this.res);

        this.isSculpting = false;
        this.sculptUvPos = new THREE.Vector2();

        this.cursorHoverColor = new THREE.Vector3(1.0, 0.5, 0.0);
        this.cursorAddColor = new THREE.Vector3(1.0, 0.5, 0.0);
        this.cursorRemoveColor = new THREE.Vector3(1.0, 0.5, 0.0);

        this.shouldClear = false;

        this.linearFloatRgbParams = {
            minFilter: THREE.LinearFilter,		// default
            magFilter: THREE.LinearFilter,		// default
            wrapS: THREE.ClampToEdgeWrapping,	// default
            wrapT: THREE.ClampToEdgeWrapping,	// default
            format: THREE.RGBAFormat,			// default
            stencilBuffer: false,
            depthBuffer: false,
            type: THREE.FloatType
        };

        this.callbacks = {};

        this._setupShaders();
        this._setupRttScene();
        this._setupRttRenderTargets();

        // this.setBrushSize(1.0);

        //create a DataTexture, with filtering type based on whether linear filtering is available
        //use linear with mipmapping
        this.imageDataTexture = new THREE.DataTexture(null, this.res, this.res, THREE.RGBAFormat, THREE.FloatType, undefined, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearMipMapLinearFilter);
        this.imageDataTexture.generateMipmaps = true;
    }

    GPUSculpt.prototype.shaders = {

        vert: {

            passUv: [

                //Pass-through vertex shader for passing interpolated UVs to fragment shader

                "varying vec2 vUv;",

                "void main() {",
                "   vUv = uv;",
                "   gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
                "}"

            ].join("\n"),

            heightMap: [

                //Vertex shader that displaces vertices in local Y based on a texture

                "uniform sampler2D uTexture;",
                "uniform vec2 uTexelSize;",
                "uniform vec2 uTexelWorldSize;",
                "uniform float uHeightMultiplier;",

                "varying vec3 vViewPosition;",
                "varying vec3 vViewNormal;",
                "varying vec2 vUv;",

                THREE.ShaderChunk['common'],
                // THREE.ShaderChunk['bsdfs'],
                THREE.ShaderChunk['shadowmap_pars_vertex'],

                "void main() {",

                // THREE.ShaderChunk['uv_vertex'],
                // THREE.ShaderChunk['uv2_vertex'],
                // THREE.ShaderChunk['color_vertex'],
                THREE.ShaderChunk['beginnormal_vertex'],
                //THREE.ShaderChunk['morphnormal_vertex'],
                //THREE.ShaderChunk['skinbase_vertex'],
                //THREE.ShaderChunk['skinnormal_vertex'],
                THREE.ShaderChunk['defaultnormal_vertex'],
                // THREE.ShaderChunk['begin_vertex'],

                "   vUv = uv;",
				//"	vUv = vec2(4.0 * uv.x, 4.0 * uv.y);",

                //displace y based on texel value
                "   vec4 t = texture2D(uTexture, vUv) * uHeightMultiplier;",
                "   vec3 displacedPos = position;",
                // "if(t.r>2.0)",
                "	displacedPos = vec3(position.x, t.r, position.z);",
                // "   vPosition = displacedPos;",

                //find normal
                "   vec2 du = vec2(uTexelSize.r, 0.0);",    // increment
                "   vec2 dv = vec2(0.0, uTexelSize.g);",

                "   vec3 vecPosU = vec3(displacedPos.x + uTexelWorldSize.r, texture2D(uTexture, vUv + du).r * uHeightMultiplier, displacedPos.z) - displacedPos;",  // U+
                "   vec3 vecNegU = vec3(displacedPos.x - uTexelWorldSize.r, texture2D(uTexture, vUv - du).r * uHeightMultiplier, displacedPos.z) - displacedPos;",  // U-
                "   vec3 vecPosV = vec3(displacedPos.x, texture2D(uTexture, vUv + dv).r * uHeightMultiplier, displacedPos.z - uTexelWorldSize.g) - displacedPos;",  // V+
                "   vec3 vecNegV = vec3(displacedPos.x, texture2D(uTexture, vUv - dv).r * uHeightMultiplier, displacedPos.z + uTexelWorldSize.g) - displacedPos;",  // V-

                "   vViewNormal = normalize(normalMatrix * 0.25 * (cross(vecPosU, vecPosV) + cross(vecPosV, vecNegU) + cross(vecNegU, vecNegV) + cross(vecNegV, vecPosU)));",

                "   vec4 worldPosition = modelMatrix * vec4(displacedPos, 1.0);",
                "   vec4 viewPos = modelViewMatrix * vec4(displacedPos, 1.0);",
                "   vViewPosition = viewPos.rgb;",

                "   gl_Position = projectionMatrix * viewPos;",

                THREE.ShaderChunk['shadowmap_vertex'],

                "}"

            ].join("\n")

        },

        frag: {

            sculpt: [

                //Fragment shader for sculpting

                "uniform sampler2D uBaseTexture;",
                "uniform sampler2D uSculptTexture1;",
                "uniform vec2 uTexelSize;",
                "uniform int uIsSculpting;",
                "uniform int uSculptType;",
                "uniform float uSculptAmount;",     // The initial value is 0.01;
                "uniform float uSculptRadius;",     // The initial value is 0.0;
                "uniform vec2 uSculptPos;",

                "varying vec2 vUv;",

                "float add(vec2 uv) {",
                "   float len = length(uv - vec2(uSculptPos.x, 1.0 - uSculptPos.y));",
                "   return uSculptAmount * smoothstep(uSculptRadius, 0.0, len);",
                // "   if(len > uSculptRadius)",
                // "       return 0.03;",
                // "   else",
                // "       return 0.03;",
                // "   return num;",
                "}",

                "void main() {",

                //r channel: height

                //read base texture
                "   vec4 tBase = texture2D(uBaseTexture, vUv);",

                //read texture from previous step
                "   vec4 t1 = texture2D(uSculptTexture1, vUv);",

                //add sculpt
                "   if (uSculptType == 1) {",
                "      if (uSculptType == 1) {",  //add
                "          t1.r += add(vUv);",
                // "          t1.r += 0.03;",   // 测试无误
                "      } else if (uSculptType == 2) {",  //remove
                "          t1.r -= add(vUv);",
                "          t1.r = max(0.0, tBase.r + t1.r) - tBase.r;",
                "      }",
                "   }",

                //write out to texture for next step
                "   gl_FragColor = t1;",
                "}"

            ].join("\n"),

            combineTextures: [

                //Fragment shader to combine textures

                "uniform sampler2D uTexture1;",
                "uniform sampler2D uTexture2;",

                "varying vec2 vUv;",

                "void main() {",
                "	gl_FragColor = texture2D(uTexture1, vUv) + texture2D(uTexture2, vUv);",	// 颜色值相加
                // "	vec4 color2 = texture2D(uTexture2, vUv);",
                // "	gl_FragColor = vec4(3.0, 0.0, 0.0, 0.0) + vec4(color2.rgb, 0.0);",	
                "}"

            ].join("\n"),

            setColor: [

                //Fragment shader to set colors on a render target

                "uniform vec4 uColor;",

                "void main() {",
                "   gl_FragColor = uColor;",
                "}"

            ].join("\n"),

            lambert: [
                "uniform vec3 diffuse;",
                "uniform vec3 emissive;",
                "uniform float opacity;",

                "varying vec3 vLightFront;",
                "varying vec3 vIndirectFront;",

                "#ifdef DOUBLE_SIDED",
                "    varying vec3 vLightBack;",
                "    varying vec3 vIndirectBack;",
                "#endif",


                THREE.ShaderChunk['common'],
                THREE.ShaderChunk['packing'],
                THREE.ShaderChunk['dithering_pars_fragment'],
                THREE.ShaderChunk['color_pars_fragment'],
                THREE.ShaderChunk['uv_pars_fragment'],
                THREE.ShaderChunk['uv2_pars_fragment'],
                THREE.ShaderChunk['map_pars_fragment'],
                THREE.ShaderChunk['alphamap_pars_fragment'],
                THREE.ShaderChunk['aomap_pars_fragment'],
                THREE.ShaderChunk['lightmap_pars_fragment'],
                THREE.ShaderChunk['emissivemap_pars_fragment'],
                THREE.ShaderChunk['envmap_common_pars_fragment'],
                THREE.ShaderChunk['envmap_pars_fragment'],
                THREE.ShaderChunk['cube_uv_reflection_fragment'],
                THREE.ShaderChunk['bsdfs'],
                THREE.ShaderChunk['lights_pars_begin'],
                THREE.ShaderChunk['fog_pars_fragment'],
                THREE.ShaderChunk['shadowmap_pars_fragment'],
                THREE.ShaderChunk['shadowmask_pars_fragment'],
                THREE.ShaderChunk['specularmap_pars_fragment'],
                THREE.ShaderChunk['logdepthbuf_pars_fragment'],
                THREE.ShaderChunk['clipping_planes_pars_fragment'],

                "void main() {",

                THREE.ShaderChunk['clipping_planes_fragment'],

                "    vec4 diffuseColor = vec4( diffuse, opacity );",
                "    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );",
                "    vec3 totalEmissiveRadiance = emissive;",

                THREE.ShaderChunk['logdepthbuf_fragment'],
                THREE.ShaderChunk['map_fragment'],
                THREE.ShaderChunk['color_fragment'],
                THREE.ShaderChunk['alphamap_fragment'],
                THREE.ShaderChunk['alphatest_fragment'],
                THREE.ShaderChunk['specularmap_fragment'],
                THREE.ShaderChunk['emissivemap_fragment'],

                // accumulation

                "    #ifdef DOUBLE_SIDED",

                "        reflectedLight.indirectDiffuse += ( gl_FrontFacing ) ? vIndirectFront : vIndirectBack;",

                "    #else",

                "        reflectedLight.indirectDiffuse += vIndirectFront;",

                "    #endif",

                THREE.ShaderChunk['lightmap_fragment'],

                "    reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );",

                "    #ifdef DOUBLE_SIDED",

                "        reflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;",

                "    #else",

                "        reflectedLight.directDiffuse = vLightFront;",

                "    #endif",

                "    reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();",

                // modulation

                THREE.ShaderChunk['aomap_fragment'],

                "    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;",

                THREE.ShaderChunk['envmap_fragment'],

                "    gl_FragColor = vec4( outgoingLight, diffuseColor.a );",

                THREE.ShaderChunk['tonemapping_fragment'],
                THREE.ShaderChunk['encodings_fragment'],
                THREE.ShaderChunk['fog_fragment'],
                THREE.ShaderChunk['premultiplied_alpha_fragment'],
                THREE.ShaderChunk['dithering_fragment'],
                "}",
            ].join("\n"),

            lambertCursor: [

                //Fragment shader that does basic lambert shading.
                //This is the version that overlays a circular cursor patch.

                THREE.ShaderChunk['common'],
                THREE.ShaderChunk['packing'],
                THREE.ShaderChunk['bsdfs'],

                // THREE.ShaderChunk['map_pars_fragment'],

                THREE.ShaderChunk['lights_pars_begin'],
                THREE.ShaderChunk['lights_pars_maps'],
                THREE.ShaderChunk['shadowmap_pars_fragment'],
                THREE.ShaderChunk['shadowmask_pars_fragment'],

				"uniform sampler2D map;",
                "uniform vec3 uBaseColor;",

                "uniform int uShowCursor;",
                "uniform vec2 uCursorPos;",
                "uniform float uCursorRadius;",
                "uniform vec3 uCursorColor;",

                "varying vec3 vViewPosition;",
                "varying vec3 vViewNormal;",
                "varying vec2 vUv;",

                /**
                 *  directionalLights: { value: [], properties: {
                 *      direction: {},
                 *      color: {}
                 *  } },
                 */

                "void main() {",

                //diffuse component

                // "vec4 diffuseColor = vec4( diffuse, opacity );",

                // "ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );",

                // "vec3 totalEmissiveRadiance = emissive;",

                // THREE.ShaderChunk['map_fragment'],
				
				"	float scale = 50.0;",
				
				"	vec2 scaledUv = vec2(vUv.x * scale, vUv.y * scale);",
				
				"	vec4 texelColor = texture2D( map, scaledUv );",

                "   vec3 diffuse = vec3(0.0);",

                "   #if NUM_DIR_LIGHTS > 0",

                "       for (int i = 0; i < NUM_DIR_LIGHTS; i++) {",

                "           vec3 direction = directionalLights[ i ].direction;",    // 视点坐标系下
                "           vec3 color = directionalLights[ i ].color;",

                // "vec4 lightVector = viewMatrix * vec4(directionalLightDirection[i], 0.0);",
                // "float normalModulator = dot(normalize(vViewNormal), normalize(lightVector.xyz));",
                // "diffuse += normalModulator * directionalLightColor[i];",

                // "           vec4 lightVector = viewMatrix * vec4(directionalLights[ 0 ].direction, 0.0);",
                "           vec3 L = normalize(direction);",
                "           vec3 N = normalize(vViewNormal);",
                "           diffuse += (0.1 + dot(N, L)) * vec3(color.x);",
                //"           diffuse += vec3(0.4 * color.x, 0.4 * color.x, 0.4 * color.z);",

                "       }",

                "   #endif",

                //combine components to get final color
                // "vec3 finalColor = uBaseColor * (ambient + diffuse);",
                // "   vec3 finalColor = uBaseColor * diffuse;",
                "   vec3 finalColor = diffuse * texelColor.xyz;",

                //mix in cursor color
                "   if (uShowCursor == 1) {",
                "       float len = length(vUv - vec2(uCursorPos.x, 1.0 - uCursorPos.y));",
                "       finalColor = mix(finalColor, uCursorColor, smoothstep(uCursorRadius, 0.0, len));",
                // "       finalColor = vec3(1.0, 0.0, 0.0);",
                "   }",

                "   gl_FragColor = vec4(finalColor * ( 0.3 + getShadowMask() ), 1.0);",

                "}"

            ].join("\n")

        }

    };
    /**
     * Gets the color of the cursor in hover mode
     * @return {THREE.Vector3} A vector that represents the color of the cursor in hover mode
     */
    GPUSculpt.prototype.getCursorHoverColor = function () {
        return this.cursorHoverColor;
    };
    /**
     * Sets the color of the cursor in hover mode
     * @param {Number} r Red floating-point value between 0 and 1, inclusive
     * @param {Number} g Green floating-point value between 0 and 1, inclusive
     * @param {Number} b Blue floating-point value between 0 and 1, inclusive
     */
    GPUSculpt.prototype.setCursorHoverColor = function (r, g, b) {
        this.cursorHoverColor.copy(r, g, b);
    };
    /**
     * Gets the color of the cursor in add mode
     * @return {THREE.Vector3} A vector that represents the color of the cursor in add mode
     */
    GPUSculpt.prototype.getCursorAddColor = function () {
        return this.cursorAddColor;
    };
    /**
     * Sets the color of the cursor in add mode
     * @param {Number} r Red floating-point value between 0 and 1, inclusive
     * @param {Number} g Green floating-point value between 0 and 1, inclusive
     * @param {Number} b Blue floating-point value between 0 and 1, inclusive
     */
    GPUSculpt.prototype.setCursorAddColor = function (r, g, b) {
        this.cursorAddColor.copy(r, g, b);
    };
    /**
     * Gets the color of the cursor in remove mode
     * @return {THREE.Vector3} A vector that represents the color of the cursor in remove mode
     */
    GPUSculpt.prototype.getCursorRemoveColor = function () {
        return this.cursorRemoveColor;
    };
    /**
     * Sets the color of the cursor in remove mode
     * @param {Number} r Red floating-point value between 0 and 1, inclusive
     * @param {Number} g Green floating-point value between 0 and 1, inclusive
     * @param {Number} b Blue floating-point value between 0 and 1, inclusive
     */
    GPUSculpt.prototype.setCursorRemoveColor = function (r, g, b) {
        this.cursorRemoveColor.copy(r, g, b);
    };
    GPUSculpt.prototype._setupShaders = function () {

        //setup a reset material for clearing render targets
        this._clearMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uColor: { type: "v4", value: new THREE.Vector4() }
            },
            vertexShader: this.shaders.vert['passUv'],
            fragmentShader: this.shaders.frag['setColor']
        });

        //Sets up the vertex-texture-fetch for the given mesh
        this.mesh.material = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib['common'],
                THREE.UniformsLib['lightmap'],
                THREE.UniformsLib['displacementmap'],
                THREE.UniformsLib['lights'],
                {
                    uTexture: { type: "t", value: null },
                    uTexelSize: { type: "v2", value: new THREE.Vector2(1.0 / this.res, 1.0 / this.res) },
                    uTexelWorldSize: { type: "v2", value: new THREE.Vector2(this.gridSize, this.gridSize) },
                    uHeightMultiplier: { type: "f", value: 1.0 },
                    uBaseColor: { type: "v3", value: new THREE.Vector3(0.6, 0.8, 0.0) },
                    uShowCursor: { type: "i", value: 0 },
                    uCursorPos: { type: "v2", value: new THREE.Vector2() },
                    uCursorRadius: { type: "f", value: 0.0 },
                    uCursorColor: { type: "v3", value: new THREE.Vector3() }
                }
            ]),
            vertexShader: this.shaders.vert['heightMap'],
            fragmentShader: this.shaders.frag['lambertCursor'],
            // fragmentShader: this.shaders.frag['lambert'],
            lights: true
        });
		
		let texture = new THREE.DataTexture( new Float32Array([0.8, 0.8, 0.8, 1.0, 0.2, 0.2, 0.2, 1.0, 0.2, 0.2, 0.2, 1.0, 0.8, 0.8, 0.8, 1.0]), 2, 2, THREE.RGBAFormat, THREE.FloatType, undefined, THREE.RepeatWrapping, THREE.RepeatWrapping, THREE.LinearFilter, THREE.LinearMipMapLinearFilter);
		
		const texLoader = new THREE.TextureLoader();
		let tex = texLoader.load('./assert/texture/tex.png');
		tex.wrapS = THREE.RepeatWrapping;
		tex.wrapT = THREE.RepeatWrapping;
		
		this.mesh.material.uniforms['map'].value = tex;
		
        this._sculptMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uBaseTexture: { type: "t", value: null },
                uSculptTexture1: { type: "t", value: null },
                uTexelSize: { type: "v2", value: new THREE.Vector2(this.texelSize, this.texelSize) },
                uTexelWorldSize: { type: "v2", value: new THREE.Vector2(this.size / this.res, this.size / this.res) },
                uIsSculpting: { type: "i", value: 0 },
                uSculptType: { type: "i", value: 0 },
                uSculptPos: { type: "v2", value: new THREE.Vector2() },
                uSculptAmount: { type: "f", value: 0.01 },
                uSculptRadius: { type: "f", value: 0.0 }
            },
            vertexShader: this.shaders.vert['passUv'],
            fragmentShader: this.shaders.frag['sculpt']
        });

        this._combineTexturesMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTexture1: { type: "t", value: null },
                uTexture2: { type: "t", value: null }
            },
            vertexShader: this.shaders.vert['passUv'],
            fragmentShader: this.shaders.frag['combineTextures']
        });
    };
    //Sets up the render-to-texture scene (2 render targets for accumulative feedback)
    GPUSculpt.prototype._setupRttScene = function () {

        //create a RTT scene
        this.rttScene = new THREE.Scene();

        //create an orthographic RTT camera
        const far = 10000;
        const near = -far;
        this.rttCamera = new THREE.OrthographicCamera(-this.halfSize, this.halfSize, this.halfSize, -this.halfSize, near, far);

        //create a quad which we will use to invoke the shaders
        this.rttQuadGeom = new THREE.PlaneGeometry(this.size, this.size);
        this.rttQuadMesh = new THREE.Mesh(this.rttQuadGeom, this._clearMaterial);
        this.rttScene.add(this.rttQuadMesh);
    };
    GPUSculpt.prototype._setupRttRenderTargets = function () {

        //create RTT render targets (we need two to do feedback)
        console.log("linear");
        this._rttRenderTarget = new THREE.WebGLRenderTarget(this.res, this.res, this.linearFloatRgbParams);

        this._rttRenderTarget.texture.generateMipmaps = false;
        this._clearRenderTarget(this._rttRenderTarget, 0.0, 0.0, 0.0, 0.0);  //clear render target (necessary for FireFox)

        this._rttlayer1 = this._rttRenderTarget.clone();
        this._clearRenderTarget(this._rttlayer1, 0.0, 0.0, 0.0, 0.0);  //clear render target (necessary for FireFox)

        //create a RTT render target for storing the combine results of all layers
        this._rttCombinedLayer = this._rttRenderTarget.clone();
        this._clearRenderTarget(this._rttCombinedLayer, 0.0, 0.0, 0.0, 0.0);  //clear render target (necessary for FireFox)
    };
    GPUSculpt.prototype._clearRenderTarget = function (renderTarget, r, g, b, a) {
        this.rttQuadMesh.material = this._clearMaterial;
        this._clearMaterial.uniforms['uColor'].value.set(r, g, b, a);
        this.renderer.setRenderTarget(renderTarget);
        this.renderer.render(this.rttScene, this.rttCamera);
        this.renderer.setRenderTarget(null);
    };
    GPUSculpt.prototype.enableGUI = function (gui) {

        if (gui == void 0) {
            console.error("dat.GUI not specified");
            return;
        }

        let options = {
            // terrainImage: terrainImages[Object.keys(terrainImages)[0]],
            // terrainShowImage: false,
            // terrainMidGreyIsLowest: true,
            // terrainPreBlur: terrainImageSettings[Object.keys(terrainImageSettings)[0]].preblur,
            // terrainHeight: terrainImageSettings[Object.keys(terrainImageSettings)[0]].height,
            sculptSize: 1.5,
            sculptAmount: 0.04,
            clearSculpts: function () {
                this.clear();
            }.bind(this),
            // renderingShadows: true,
            // renderingShadowCasters: false,
            // displaySculptTexture: true
        };

        //Sculpt folder
        let sculptFolder = gui.addFolder("Sculpt");
        sculptFolder.add(options, "sculptSize", 0.1, 10.0).name("Brush Size").onChange((value) => {
            this.setBrushSize(value);
        });
        this.setBrushSize(options.sculptSize);
        sculptFolder.add(options, "sculptAmount", 0.01, 0.2).step(0.01).name("Amount").onChange((value) => {
            this.setBrushAmount(value);
        });
        this.setBrushAmount(options.sculptAmount);
        sculptFolder.add(options, "clearSculpts").name("Clear Sculpts");

        sculptFolder.open();
    }
    /**
     * Updates the sculpt<br/><strong>NOTE:  This needs to be called every frame, after renderer.clear() and before renderer.render(...)</strong>
     */
    GPUSculpt.prototype.update = function () {

        //have to set flags from other places and then do all steps at once during update

        //clear sculpts if necessary
        if (this.shouldClear) {
            this._clearMaterial.uniforms['uColor'].value.set(0.0, 0.0, 0.0, 0.0);
            this.rttQuadMesh.material = this._clearMaterial;
            this.renderer.setRenderTarget(this._rttRenderTarget);
            this.renderer.render(this.rttScene, this.rttCamera);
            this.renderer.setRenderTarget(this._rttlayer1);
            this.renderer.render(this.rttScene, this.rttCamera);
            this.renderer.setRenderTarget(null);
            this.shouldClear = false;
            this.updateCombinedLayers = true;
        }

        //do the main sculpting
        if (this.isSculpting) {
            // console.log("sculpt");
            this._sculptMaterial.uniforms['uBaseTexture'].value = this.imageDataTexture;
            this._sculptMaterial.uniforms['uSculptTexture1'].value = this._rttlayer1.texture;
            this._sculptMaterial.uniforms['uIsSculpting'].value = this.isSculpting;
            this._sculptMaterial.uniforms['uSculptPos'].value.copy(this.sculptUvPos);
            this.rttQuadMesh.material = this._sculptMaterial;
            this.renderer.setRenderTarget(this._rttRenderTarget);
            this.renderer.render(this.rttScene, this.rttCamera);
            this.renderer.setRenderTarget(null);
            this._swapRenderTargets();
            this.isSculpting = false;
            this.updateCombinedLayers = true;
        }

        //combine layers into one
        if (this.updateCombinedLayers) {  //this can be triggered somewhere else without sculpting

            this._combineTexturesMaterial.uniforms['uTexture1'].value = this.imageDataTexture;
            this._combineTexturesMaterial.uniforms['uTexture2'].value = this._rttlayer1.texture;
            this.rttQuadMesh.material = this._combineTexturesMaterial;
            this.renderer.setRenderTarget(this._rttCombinedLayer);
            this.renderer.render(this.rttScene, this.rttCamera);
            this.renderer.setRenderTarget(null);
            this.updateCombinedLayers = false;

            //need to rebind _rttCombinedLayer to uTexture
            this.mesh.material.uniforms['uTexture'].value = this._rttCombinedLayer.texture;

            //check for the callback of type "update"
            // if (this.callbacks.hasOwnProperty("update")) {
            //     let renderCallbacks = this.callbacks['update'];
            //     let i, len;
            //     for (i = 0, len = renderCallbacks.length; i < len; i++) {
            //         renderCallbacks[i]();
            //     }
            // }
        }

        this.renderer.setRenderTarget(null);
    };
    GPUSculpt.prototype._swapRenderTargets = function () {
        let temp = this._rttRenderTarget;
        this._rttRenderTarget = this._rttlayer1;
        this._rttlayer1 = temp;
        // this._sculptMaterial.uniforms['uSculptTexture1'].value = this._rttlayer1;
    };
    /**
     * Sets brush size
     * @param {Number} size The diameter of the brush
     */
    GPUSculpt.prototype.setBrushSize = function (size) {
        let brushSize = size / (this.size * 2.0);
        this._sculptMaterial.uniforms['uSculptRadius'].value = brushSize;
        this.mesh.material.uniforms['uCursorRadius'].value = brushSize;
    };
    /**
     * Sets brush amount
     * @param {Number} amount Brush amount
     */
    GPUSculpt.prototype.setBrushAmount = function (amount) {
        this._sculptMaterial.uniforms['uSculptAmount'].value = amount;
    };
    /**
     * Loads terrain heights from image
     * @param  {String} src The path of the picture
     * @param  {Number} amount Height multiplier
     * @param  {Boolean} midGreyIsLowest Whether mid grey is considered the lowest part of the image
     */
    GPUSculpt.prototype.loadFromImage = function (src, amount, midGreyIsLowest) {

        let img = new Image();
        img.onload = () => {

            let min = 99999;

            let w = this.res,
                h = this.res;

            let _canvas = document.createElement("canvas"),
                ctx = _canvas.getContext("2d");

            _canvas.width = w;
            _canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);

            let data = ctx.getImageData(0, 0, w, h).data;

            for (let i = 0; i < this.imageProcessedData.length; i++) {
                if (midGreyIsLowest) {
                    normalizedHeight = Math.abs(data[i] / 255.0 - 0.5);
                } else {
                    normalizedHeight = data[i] / 255.0;
                }
                this.imageProcessedData[i] = normalizedHeight * amount;

                //store min
                if (this.imageProcessedData[i] < min) {
                    min = this.imageProcessedData[i];
                }
            }

            for (let i = 0; i < this.imageProcessedData.length; i++) {
                this.imageProcessedData[i] -= min;
            }

            //assign data to DataTexture
            this.imageDataTexture.image.data = this.imageProcessedData;
            this.imageDataTexture.needsUpdate = true;
            // this._sculptMaterial.uniforms['uBaseTexture'].value = this.imageDataTexture;
            this._combineTexturesMaterial.uniforms['uTexture1'].value = this.imageDataTexture;
            // this.mesh.material.uniforms['uBaseTexture'].value = this.imageDataTexture;
            this.updateCombinedLayers = true;

        };

        img.src = src;
    }
    /**
     * Sculpt the terrain
     * @param  {enum} type Sculpt operation type: GPUSculpt.ADD, GPUSculpt.REMOVE
     * @param  {THREE.Vector3} position World-space position to sculpt at
     * @param  {Number} amount Amount to sculpt
     */
    GPUSculpt.prototype.sculpt = function (type, position, amount) {
        if (amount) {
            this.setBrushAmount(amount);
        }
        this._sculptMaterial.uniforms['uSculptType'].value = type;
        this.isSculpting = true;
        this.sculptUvPos.x = (position.x + this.halfSize) / this.size;
        this.sculptUvPos.y = (position.z + this.halfSize) / this.size;
        if (type === 1) {
            this.mesh.material.uniforms['uCursorColor'].value.copy(this.cursorAddColor);
        } else if (type === 2) {
            this.mesh.material.uniforms['uCursorColor'].value.copy(this.cursorRemoveColor);
        }
    };
    /**
     * Clears all sculpts
     */
    GPUSculpt.prototype.clear = function () {
        this.shouldClear = true;
    };
    /**
     * Updates the cursor position
     * @param  {THREE.Vector3} position World-space position to update the cursor to
     */
    GPUSculpt.prototype.updateCursor = function (position) {
        this.sculptUvPos.x = (position.x + this.halfSize) / this.size;
        this.sculptUvPos.y = (position.z + this.halfSize) / this.size;
        this.mesh.material.uniforms['uCursorPos'].value.copy(this.sculptUvPos);
        this.mesh.material.uniforms['uCursorColor'].value.copy(this.cursorHoverColor);
    };
    /**
     * Shows the sculpt cursor
     */
    GPUSculpt.prototype.showCursor = function () {
        this.mesh.material.uniforms['uShowCursor'].value = 1;
    };
    /**
     * Hides the sculpt cursor
     */
    GPUSculpt.prototype.hideCursor = function () {
        this.mesh.material.uniforms['uShowCursor'].value = 0;
    };
    /**
     * Gets the sculpt texture that is used for displacement of mesh
     * @return {Texture} Sculpt texture that is used for displacement of mesh
     */
    GPUSculpt.prototype.getSculptDisplayTexture = function () {
        return this._rttCombinedLayer.texture;
    };

    GPUSculpt.prototype.getPixelData = function () {

        // create buffer for reading single pixel
        let pixelBuffer = new Float32Array(this.res * this.res);	// RGBA
        let data = new Float32Array(4 * this.res * this.res);

        this.renderer.readRenderTargetPixels(this._rttCombinedLayer, 0, 0, this.res, this.res, data);
        // read the pixel
        for (let i = 0; i < pixelBuffer.length; i++) {

            pixelBuffer[i] = data[4 * i];

        }

        return pixelBuffer;
    }

    /**
     * Add sculpt operation
     * @const
     */
    GPUSculpt.ADD = 1;
    /**
     * Remove sculpt operation
     * @const
     */
    GPUSculpt.REMOVE = 2;

    return GPUSculpt;

})();