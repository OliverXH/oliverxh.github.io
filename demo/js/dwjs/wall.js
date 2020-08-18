function createWall(scene, world, _options) {
    const type = _options.type || 'rectangle';
    let widthCount = _options.widthCount;
    let heightCount = _options.heightCount;

    let mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 0.2, 0.4), new THREE.MeshPhongMaterial({ color: 0xa0afa4 }));
    let body = physics.generatePhysicsBody(mesh, 'rigid', { mass: 4 });

    switch (type) {
        case 'rectangle':
        case 'brick':
            for (let i = 0; i < heightCount; i++) {

                for (let j = 0; j < widthCount; j++) {

                    let _x = _options.position.x + box.params.width * j - (widthCount / 2 - 0.5) * box.params.width,
                        _y = _options.position.y + box.params.height * (i + 0.5),
                        _z = _options.position.z;

                    let box = mesh.clone();
                    box.position.set(_x, _y, _z);
                    box.body = physics.generatePhysicsBody(mesh, 'rigid', { mass: 4 });

                    scene.add(box);
                    world.addRigidBody(box.body);
                }
            }

            break;

        case 'triangle':
            for (let i = 0; i < heightCount; i++) {

                for (let j = 0; j < widthCount; j++) {

                    let _x = _options.position.x + box.params.width * j - ((widthCount - i) / 2 - 0.5) * box.params.width,
                        _y = _options.position.y + box.params.height * (i + 0.5),
                        _z = _options.position.z;

                    let box = mesh.clone();
                    box.position.set(_x, _y, _z);
                    box.body = physics.generatePhysicsBody(mesh, 'rigid', { mass: 4 });

                    scene.add(box);
                    world.addRigidBody(box.body);
                }
            }
            break;
    }
}