
import {
	ShaderMaterial,
	UniformsUtils,
	UniformsLib,
	Color
} from 'three';

export class SurfaceMaterial extends ShaderMaterial {

	constructor( params ) {

		const vertex = /* glsl */`

varying vec3 vViewPosition;

#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

}
        `;

		const fragment = /* glsl */ `

uniforms_loc

varying vec3 vViewPosition;

uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <bsdfs>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>

// #include <lights_physical_pars_fragment>

float lerp( float a, float b, float i ) {
	return a * ( 1.0 - i ) + b * i;
}

vec3 lerp ( vec3 a, vec3 b, float i ) {
	float x = lerp( a.x, b.x, i );
	float y = lerp( a.y, b.y, i );
	float z = lerp( a.z, b.z, i );
	return vec3( x, y, z );
}

struct Input {
	vec2 uv;
	vec2 uv2;

	vec3 Pos;
	vec3 Normal;
	vec3 viewDir;
    vec3 lightDir;
};

struct SurfaceOutput {
    vec3 Albedo;
	vec3 Normal;
    vec3 Emission;
    vec3 Specular;
    float Gloss;
    float Alpha;
};

// custom_function
light_model
surface_func

void RE_Direct_Surface( const in IncidentLight directLight, const in GeometricContext geometry, in SurfaceOutput material, inout ReflectedLight reflectedLight ) {

	Input IN;
#if ( defined( USE_UV ) && ! defined( UVS_VERTEX_ONLY ) )
	IN.uv = vUv;
#endif
#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	IN.uv2 = vUv2;
#endif
	IN.Pos = geometry.position;
	IN.Normal = geometry.normal;
	IN.viewDir = geometry.viewDir;
	IN.lightDir = directLight.direction;

	surface( IN, material );

	reflectedLight.directDiffuse = material.Albedo;

}

#define RE_Direct RE_Direct_Surface


#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>

    // TODO: add support for surface function
	vec4 diffuseColor = vec4( diffuse, opacity );
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );

    #include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>

    // TODO: add support for light model

	// accumulation
	SurfaceOutput material;
	material.Albedo = diffuseColor.rgb;
	material.Normal = normal;
	material.Emission = emissive;
	material.Specular = specular;
	material.Gloss = shininess;
	material.Alpha = opacity;

	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

    // modulation
	#include <aomap_fragment>

    // outgoingLight
    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular;

    #include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>


}
        `;

		super( {
			lights: true,
			vertexShader: vertex,
			fragmentShader: fragment
		} );

		this.isSurfaceMaterial = true;

		this.buildUniforms( params.properties );
		this.buildLightModel( params.lightModel ?? '' );
		this.buildSurfaceFunc( params.surfaceFunc ?? '' );

	}

	buildUniforms( properties ) {

		this.uniforms = UniformsUtils.merge( [
			UniformsLib.common,
			UniformsLib.lights,
			UniformsLib.fog,
			UniformsLib.aomap,
			UniformsLib.lightmap,
			UniformsLib.emissivemap,
			UniformsLib.bumpmap,
			UniformsLib.normalmap,
			UniformsLib.displacementmap,
			UniformsLib.gradientmap,
		] );

		let _uniforms = [];

		for ( const key in properties ) {
			if ( Object.hasOwnProperty.call( properties, key ) ) {

				let keyInfo = key.split( ':' );

				this.uniforms[ keyInfo[ 0 ] ] = {
					value: properties[ key ]
				};

				_uniforms.push( `uniform ${this.getType( keyInfo[ 1 ] )} ${keyInfo[ 0 ]};` );

			}
		}

		this.fragmentShader = this.fragmentShader.replace(
			'uniforms_loc',
			_uniforms.join( '\n' )
		);

		// console.log( this.fragmentShader );

	}

	buildLightModel( lightModel = '' ) {

		this.fragmentShader = this.fragmentShader.replace(
			'light_model',
			lightModel
		);

	}

	buildSurfaceFunc( surfaceFunc = '' ) {

		this.fragmentShader = this.fragmentShader.replace(
			'surface_func',
			surfaceFunc
		);

	}

	getType( type ) {

		switch ( type ) {

			case 't':
				return 'float';

			case 'v2':
				return 'vec2';

			case 'v3':
				return 'vec3';

			case 'v4':
				return 'vec4';

			case 'm3':
				return 'mat3';

			case 'm4':
				return 'mat4';

			case '2d':
				return 'sampler2D';
		}

	}

	setUniformValue( uniform, value ) {

		if ( this.uniforms[ uniform ] ) {

			this.uniforms[ uniform ].value = value;

		}

	}

	setUniformsValue( uniforms ) {

		for ( const uniform in uniforms ) {

			if ( Object.hasOwnProperty.call( uniforms, uniform ) ) {

				const value = uniforms[ uniform ];
				this.setUniformValue( uniform, value );

			}

		}

	}

	onBeforeCompile( shader ) {

		// console.log( shader.fragmentShader );

	}

}
