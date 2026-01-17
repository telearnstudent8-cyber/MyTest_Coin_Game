class ResourceManager {
    constructor() {
        this.assets = {};
        this.total = 0;
        this.loaded = 0;
        this.onProgress = null;
        this.onComplete = null;
    }

    async load(manifest) {
        this.total = manifest.length;
        const promises = manifest.map(item => this.loadImage(item.name, item.path));
        await Promise.all(promises);
        if (this.onComplete) this.onComplete();
    }

    loadImage(name, path) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.assets[name] = img;
                this.loaded++;
                if (this.onProgress) this.onProgress(this.loaded / this.total);
                resolve();
            };
            img.onerror = () => {
                console.warn(`Failed to load: ${path}`);
                this.loaded++;
                resolve();
            };
            img.src = path;
        });
    }

    get(name) {
        return this.assets[name];
    }
}
