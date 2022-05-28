
import {
    Scene,
    Group,
    Box3,
    Box3Helper,
    Raycaster,
    Vector2
} from 'three';

import { TransformControls } from "https://threejs.org/examples/jsm/controls/TransformControls.js";

import { EventEmitter } from "../event-emitter.js";

import { History } from './history.js';

import { SetPositionCommand } from './commands/SetPositionCommand.js';
import { SetRotationCommand } from './commands/SetRotationCommand.js';
import { SetScaleCommand } from './commands/SetScaleCommand.js';

export class EditorPlugin extends EventEmitter {

    constructor( app ) {

        super();

        const scope = this;

        this.history = new History( this );

        const camera = app.camera;
        const scene = app.root;
        const container = app.container;
        const controls = app.controls;

        this.group = new Group();
        scene.add( this.group );

        const sceneHelpers = new Scene();

        const box = new Box3();

        const selectionBox = new Box3Helper( box, 0x73ff66 );
        selectionBox.material.depthTest = false;
        selectionBox.material.transparent = true;
        selectionBox.visible = false;
        sceneHelpers.add( selectionBox );

        let objectPositionOnDown = null;
        let objectRotationOnDown = null;
        let objectScaleOnDown = null;

        const transformControls = new TransformControls( camera, app.renderer.domElement );
        transformControls.addEventListener( 'change', () => {

            const object = transformControls.object;

            if ( object !== undefined ) {

                box.setFromObject( object, true );

            }

        } );
        transformControls.addEventListener( 'mouseDown', () => {

            const object = transformControls.object;

            objectPositionOnDown = object.position.clone();
            objectRotationOnDown = object.rotation.clone();
            objectScaleOnDown = object.scale.clone();

            controls.enabled = false;

        } );
        transformControls.addEventListener( 'mouseUp', () => {

            const object = transformControls.object;

            if ( object !== undefined ) {

                switch ( transformControls.getMode() ) {

                    case 'translate':

                        if ( !objectPositionOnDown.equals( object.position ) ) {

                            scope.execute( new SetPositionCommand( scope, object, object.position, objectPositionOnDown ) );

                        }

                        break;

                    case 'rotate':

                        if ( !objectRotationOnDown.equals( object.rotation ) ) {

                            scope.execute( new SetRotationCommand( scope, object, object.rotation, objectRotationOnDown ) );

                        }

                        break;

                    case 'scale':

                        if ( !objectScaleOnDown.equals( object.scale ) ) {

                            scope.execute( new SetScaleCommand( scope, object, object.scale, objectScaleOnDown ) );

                        }

                        break;

                }

            }

            controls.enabled = true;

        } );

        sceneHelpers.add( transformControls );

        // object picking

        const raycaster = new Raycaster();
        const mouse = new Vector2();

        function getIntersects( point ) {

            mouse.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );

            raycaster.setFromCamera( mouse, camera );

            const objects = [];

            let objectFrom;

            if ( scope.group.children.length === 0 ) {

                objectFrom = scene;

            } else {

                objectFrom = scope.group;

            }

            objectFrom.traverseVisible( function ( child ) {

                objects.push( child );

            } );

            sceneHelpers.traverseVisible( function ( child ) {

                if ( child.name === 'picker' ) objects.push( child );

            } );

            return raycaster.intersectObjects( objects, false );

        }

        const onDownPosition = new Vector2();
        const onUpPosition = new Vector2();
        const onDoubleClickPosition = new Vector2();

        function getMousePosition( dom, x, y ) {

            const rect = dom.getBoundingClientRect();
            return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];

        }

        this.on( 'select', ( object ) => {

            selectionBox.visible = false;
            transformControls.detach();

            if ( object !== null && object !== scene && object !== camera ) {

                // controls.enabled = false;

                box.setFromObject( object, true );

                if ( box.isEmpty() === false ) {

                    selectionBox.visible = true;

                }

                transformControls.attach( object );

            }

        } )

        function handleClick() {

            if ( onDownPosition.distanceTo( onUpPosition ) === 0 ) {

                const intersects = getIntersects( onUpPosition );

                if ( intersects.length > 0 ) {

                    const object = intersects[ 0 ].object;

                    if ( object.userData.object !== undefined ) {

                        // helper

                        // editor.select( object.userData.object );
                        scope.emit( 'select', object.userData.object );

                    } else {

                        // editor.select( object );
                        scope.emit( 'select', object );

                    }

                } else {

                    // editor.select( null );
                    scope.emit( 'select', null );

                }

                // render();

            }

        }

        function onMouseDown( event ) {

            // event.preventDefault();

            const array = getMousePosition( container, event.clientX, event.clientY );
            onDownPosition.fromArray( array );

            document.addEventListener( 'mouseup', onMouseUp );

        }

        function onMouseUp( event ) {

            const array = getMousePosition( container, event.clientX, event.clientY );
            onUpPosition.fromArray( array );

            handleClick();

            document.removeEventListener( 'mouseup', onMouseUp );

        }

        function onTouchStart( event ) {

            const touch = event.changedTouches[ 0 ];

            const array = getMousePosition( container, touch.clientX, touch.clientY );
            onDownPosition.fromArray( array );

            document.addEventListener( 'touchend', onTouchEnd );

        }

        function onTouchEnd( event ) {

            const touch = event.changedTouches[ 0 ];

            const array = getMousePosition( container, touch.clientX, touch.clientY );
            onUpPosition.fromArray( array );

            handleClick();

            document.removeEventListener( 'touchend', onTouchEnd );

        }

        function onDoubleClick( event ) {

            const array = getMousePosition( container, event.clientX, event.clientY );
            onDoubleClickPosition.fromArray( array );

            const intersects = getIntersects( onDoubleClickPosition );

            if ( intersects.length > 0 ) {

                const intersect = intersects[ 0 ];

                // signals.objectFocused.dispatch( intersect.object );
                // controls.focus( intersect.object );
                controls.target = intersect.object.position.clone();

            }

        }

        container.addEventListener( 'mousedown', onMouseDown );
        container.addEventListener( 'touchstart', onTouchStart );
        container.addEventListener( 'dblclick', onDoubleClick );

        app.on( 'postrender', () => {

            app.renderer.autoClear = false;
            app.renderer.render( sceneHelpers, camera );
            app.renderer.autoClear = true;

        } );

        const IS_MAC = navigator.platform.toUpperCase().indexOf( 'MAC' ) >= 0;

        document.addEventListener( 'keydown', function ( event ) {

            switch ( event.key.toLowerCase() ) {

                case 'w':

                    transformControls.setMode( 'translate' );

                    break;

                case 'e':

                    transformControls.setMode( 'rotate' );

                    break;

                case 'r':

                    transformControls.setMode( 'scale' );

                    break;

                case 'z':

                    if ( IS_MAC ? event.metaKey : event.ctrlKey ) {

                        event.preventDefault(); // Prevent browser specific hotkeys

                        if ( event.shiftKey ) {

                            scope.redo();

                        } else {

                            scope.undo();

                        }

                        transformControls.object && box.setFromObject( transformControls.object, true );

                    }

                    break;

            }

        } );

    }

    execute( cmd, optionalName ) {

        this.history.execute( cmd, optionalName );

    }

    undo() {

        this.history.undo();

    }

    redo() {

        this.history.redo();

    }

}