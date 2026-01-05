import * as THREE from 'three';

export class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sourceMesh = null;
        this.gridHelper = null;
    }

    init(container) {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a); // Dark background
        this.scene.fog = new THREE.FogExp2(0x1a1a1a, 0.02);

        // Camera (User's head)
        // PerspectiveCamera(fov, aspect, near, far)
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.7, 0); // Human height, looking at (0, 1.7, -z) default

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(5, 10, 5);
        this.scene.add(pointLight);

        // Floor / Grid
        this.gridHelper = new THREE.GridHelper(20, 20, 0x00ffff, 0x444444); // Neon cyan center
        this.scene.add(this.gridHelper);

        // Source Marker (Visual representation of sound)
        const geometry = new THREE.SphereGeometry(0.3, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5
        });
        this.sourceMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.sourceMesh);

        // Hide source initially (game logic controls visibility)
        this.sourceMesh.visible = false;

        // Handle Resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * Updates the position of the visual sound source
     * @param {THREE.Vector3} position 
     */
    setSourcePosition(position) {
        if (this.sourceMesh) {
            this.sourceMesh.position.copy(position);
        }
    }

    setSourceVisible(visible) {
        if (this.sourceMesh) {
            this.sourceMesh.visible = visible;
        }
    }
}
