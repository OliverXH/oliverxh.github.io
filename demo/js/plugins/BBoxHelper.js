
import {
    Vector3,
    LineSegments,
    LineBasicMaterial,
    BufferGeometry
} from 'three';


function createVertices() {

    let vertices = [],
        points = [];

    for ( let c = 0; c < 32; c++ )
        vertices[ c ] = new Vector3();

    const halfExtents = new Vector3( 0.52, 0.52, 0.52 );

    let ind = 0;
    for ( let x = -1; x <= 1; x += 2 ) {
        for ( let y = -1; y <= 1; y += 2 ) {
            for ( let z = -1; z <= 1; z += 2 ) {

                vertices[ ind * 4 ].copy( halfExtents );
                vertices[ ind * 4 ].x *= x;
                vertices[ ind * 4 ].y *= y;
                vertices[ ind * 4 ].z *= z;

                vertices[ ind * 4 + 1 ].copy( vertices[ ind * 4 ] );
                vertices[ ind * 4 + 1 ].x -= halfExtents.x * .3 * x;

                vertices[ ind * 4 + 2 ].copy( vertices[ ind * 4 ] );
                vertices[ ind * 4 + 2 ].y -= halfExtents.y * .3 * y;

                vertices[ ind * 4 + 3 ].copy( vertices[ ind * 4 ] );
                vertices[ ind * 4 + 3 ].z -= halfExtents.z * .3 * z;

                points.push( vertices[ ind * 4 ], vertices[ ind * 4 + 1 ] );
                points.push( vertices[ ind * 4 ], vertices[ ind * 4 + 2 ] );
                points.push( vertices[ ind * 4 ], vertices[ ind * 4 + 3 ] );

                ind++;
            }
        }
    }

    return points;

}

export class BBoxHelper extends LineSegments {

    constructor( box, color = 0xffff00 ) {

        const geometry = new BufferGeometry();

        geometry.setFromPoints( createVertices() );

        super( geometry, new LineBasicMaterial( { color: color, toneMapped: false } ) );

        this.box = box;

        this.type = 'Box3Helper';

        this.geometry.computeBoundingSphere();

    }

    updateMatrixWorld( force ) {

        const box = this.box;

        if ( box.isEmpty() ) return;

        box.getCenter( this.position );

        box.getSize( this.scale );

        super.updateMatrixWorld( force );

    }

}