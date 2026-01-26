import * as THREE from 'three';

export class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sourceMesh = null;
        this.gridHelper = null;

        // Camera rotation control
        this.rotationEnabled = false;
        this.deviceOrientationSupported = false;
        this.initialAlpha = null;
        this.permissionGranted = false;
        this.onDeviceOrientation = null;
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

        // Check Device Orientation API support
        this.deviceOrientationSupported = 'DeviceOrientationEvent' in window;
        if (this.deviceOrientationSupported) {
            console.log('Device Orientation API supported');
        } else {
            console.warn('Device Orientation API not supported');
        }

        // Bind device orientation handler
        this.onDeviceOrientation = this.handleDeviceOrientation.bind(this);
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

    /**
     * Enable or disable camera rotation via device orientation
     * @param {boolean} enabled 
     */
    async enableCameraRotation(enabled) {
        this.rotationEnabled = enabled;
        console.log(`Camera rotation ${enabled ? 'enabled' : 'disabled'}`);

        if (!this.deviceOrientationSupported) {
            console.warn('Device Orientation not supported, rotation will not work');
            return;
        }

        if (enabled) {
            // Request permission for iOS 13+
            if (typeof DeviceOrientationEvent !== 'undefined' &&
                typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    const permission = await DeviceOrientationEvent.requestPermission();
                    if (permission === 'granted') {
                        this.permissionGranted = true;
                        console.log('Device Orientation permission granted');
                    } else {
                        console.warn('Device Orientation permission denied');
                        return;
                    }
                } catch (error) {
                    console.error('Error requesting device orientation permission:', error);
                    return;
                }
            } else {
                // Non-iOS or older iOS, assume permission granted
                this.permissionGranted = true;
            }

            // Add event listener
            window.addEventListener('deviceorientation', this.onDeviceOrientation, true);
            console.log('Device orientation listener added');
        } else {
            // Remove event listener
            window.removeEventListener('deviceorientation', this.onDeviceOrientation, true);
            this.initialAlpha = null;
            console.log('Device orientation listener removed');
        }
    }

    /**
     * Get camera yaw (rotation around Y axis)
     * @returns {number} Yaw in radians
     */
    getCameraYaw() {
        if (!this.camera) return 0;
        return this.camera.rotation.y;
    }

    /**
     * Get camera forward direction vector
     * @returns {THREE.Vector3}
     */
    getCameraForward() {
        if (!this.camera) return new THREE.Vector3(0, 0, -1);
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        return direction;
    }

    /**
     * Get camera up direction vector
     * @returns {THREE.Vector3}
     */
    getCameraUp() {
        if (!this.camera) return new THREE.Vector3(0, 1, 0);
        return this.camera.up.clone();
    }

    /**
     * Handle device orientation event
     * @param {DeviceOrientationEvent} event 
     */
    handleDeviceOrientation(event) {
        if (!this.rotationEnabled || !this.camera) return;

        const alpha = event.alpha; // Z軸周りの回転（コンパス方向、0-360度）
        const beta = event.beta;   // X軸周りの回転（前後傾斜、-180~180度）
        const gamma = event.gamma;  // Y軸周りの回転（左右傾斜、-90~90度）

        // alphaがnullの場合は何もしない（センサーが利用できない）
        if (alpha === null) return;

        // 初回のみ初期方向を設定（較正）
        if (this.initialAlpha === null) {
            this.initialAlpha = alpha;
            console.log(`Initial orientation calibrated: alpha=${alpha.toFixed(2)}°`);
            return;
        }

        // alphaの変化量を計算（相対的な回転）
        let deltaAlpha = alpha - this.initialAlpha;

        // 360度の境界を考慮
        if (deltaAlpha > 180) {
            deltaAlpha -= 360;
        } else if (deltaAlpha < -180) {
            deltaAlpha += 360;
        }

        // 度からラジアンに変換してカメラのYawを更新
        // マイナスをつけるのは、デバイスの回転とカメラの回転が逆方向のため
        const yawRad = -(deltaAlpha * Math.PI / 180);
        this.camera.rotation.y = yawRad;
    }

    /**
     * Recalibrate the initial orientation
     */
    calibrateOrientation() {
        this.initialAlpha = null;
        console.log('Orientation calibration reset');
    }
}
