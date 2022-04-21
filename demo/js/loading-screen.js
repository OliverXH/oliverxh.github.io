
export class LoadingScreen {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'loader';
        this.element.id = 'loading-screen';
        this.element.innerText = 'Loading...';
        document.body.appendChild(this.element);
    }

    end() {
        this.element.style.display = 'none';
    }
}