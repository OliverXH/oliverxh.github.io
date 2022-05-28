
/**
 * EventEmitter class
 * @description Creates an object with event registering and firing methods
 * https://github.com/ericz/EventEmitter/blob/master/EventEmitter.js
 */

 export class EventEmitter {

    constructor() {
        this._events = {};
    }

    on(type, callback) {

        // Errors
        if (typeof type === 'undefined' || type === '') {
            console.warn('wrong names');
            return false;
        }

        if (typeof callback === 'undefined' || 'function' !== typeof callback) {
            console.warn('wrong callback');
            return false;
        }

        if (!this._events[type]) {

            this._events[type] = callback;

        } else if (Array.isArray(this._events[type])) {

            // If we've already got an array, just append.
            this._events[type].push(callback);

        } else {

            // Adding the second element, need to change to array.
            this._events[type] = [this._events[type], callback];

        }

        return this;

    }

    once(type, callback) {

        // Errors
        if (typeof type === 'undefined' || type === '') {
            console.warn('wrong name');
            return false;
        }

        if ('function' !== typeof callback) {
            console.warn('.once only takes instances of Function');
            return false;
        }

        let self = this;
        function temp() {
            self.off(type, temp);
            callback.apply(self, arguments);
        };

        self.on(type, temp);

        return this;

    }

    off(type, callback) {

        // Errors
        if (typeof type === 'undefined' || type === '') {
            console.warn('wrong name');
            return false;
        }

        if (!this._events[type]) return this;

        let list = this._events[type];

        if (Array.isArray(list)) {

            let position = -1;

            for (let i = 0, length = list.length; i < length; i++) {
                if (list[i] === callback) {
                    position = i;
                    break;
                }
            }

            if (position < 0) return this;
            list.splice(position, 1);

            if (list.length == 0)
                delete this._events[type];
            else if (list.length == 1)
                this._events[type] = this._events[type][0];

        } else {

            delete this._events[type];

        }

        return this;

    }

    removeAll(type) {

        // Errors
        if (typeof type === 'undefined' || type === '') {
            console.warn('wrong name');
            return false;
        }

        if (arguments.length === 0) {
            this._events = {};
            return this;
        }

        // does not use listeners(), so no side effect of creating _events[type]
        if (type && this._events && this._events[type]) this._events[type] = null;
        return this;

    }

    emit(type) {

        // Errors
        if (typeof type === 'undefined' || type === '') {
            console.warn('wrong name');
            return false;
        }

        let handler = this._events[type];
        if (!handler) return false;

        if (typeof handler == 'function') {

            switch (arguments.length) {
                // fast cases
                case 1:
                    handler.call(this);
                    break;
                case 2:
                    handler.call(this, arguments[1]);
                    break;
                case 3:
                    handler.call(this, arguments[1], arguments[2]);
                    break;
                // slower
                default:
                    let l = arguments.length;
                    let args = new Array(l - 1);
                    for (let i = 1; i < l; i++) args[i - 1] = arguments[i];

                    // let args = arguments.slice();
                    // args.shift();

                    handler.apply(this, args);
            }

            return true;

        } else if (Array.isArray(handler)) {
            
            let l = arguments.length;
            let args = new Array(l - 1);
            for (let i = 1; i < l; i++) args[i - 1] = arguments[i];

            // let args = arguments.slice();
            // args.shift();

            let callbacks = handler.slice();
            callbacks.forEach(callback => {
                callback.apply(this, args);
            });

            return true;

        } else {

            return false;

        }



    }

}

