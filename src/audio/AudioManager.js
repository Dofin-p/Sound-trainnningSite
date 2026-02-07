export class AudioManager {
    constructor() {
        this.ctx = null;
        this.panner = null;
        this.oscillator = null;
        this.gainNode = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;

        // Create AudioContext
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // Create PannerNode for spatial audio
        this.panner = this.ctx.createPanner();
        this.panner.panningModel = 'HRTF'; // Best for headphones
        this.panner.distanceModel = 'inverse';
        this.panner.refDistance = 1;
        this.panner.maxDistance = 10000;
        this.panner.rolloffFactor = 1;
        this.panner.coneInnerAngle = 360;
        this.panner.coneOuterAngle = 0;
        this.panner.coneOuterGain = 0;

        // Connect panner to destination (speakers)
        this.panner.connect(this.ctx.destination);

        this.isInitialized = true;
        console.log("AudioManager initialized");
    }

    // Set the position of the sound source
    setSourcePosition(x, y, z) {
        if (!this.panner) return;
        // PannerNode.positionX/Y/Z are AudioParams
        if (this.panner.positionX.setValueAtTime) {
            this.panner.positionX.setValueAtTime(x, this.ctx.currentTime);
            this.panner.positionY.setValueAtTime(y, this.ctx.currentTime);
            this.panner.positionZ.setValueAtTime(z, this.ctx.currentTime);
        } else {
            // Fallback for older browsers
            this.panner.setPosition(x, y, z);
        }
    }

    // Set listener orientation (usually fixed for this game, looking -Z)
    setListenerOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ) {
        if (!this.ctx) return;
        const listener = this.ctx.listener;
        if (listener.forwardX) {
            listener.forwardX.setValueAtTime(forwardX, this.ctx.currentTime);
            listener.forwardY.setValueAtTime(forwardY, this.ctx.currentTime);
            listener.forwardZ.setValueAtTime(forwardZ, this.ctx.currentTime);
            listener.upX.setValueAtTime(upX, this.ctx.currentTime);
            listener.upY.setValueAtTime(upY, this.ctx.currentTime);
            listener.upZ.setValueAtTime(upZ, this.ctx.currentTime);
        } else {
            listener.setOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ);
        }
    }

    playSound(duration = 0.5) {
        if (!this.ctx) return;

        // Create oscillator for sound
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime); // A4

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.panner);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    /**
     * SceneManagerのカメラ向きを基にAudioListenerを更新する
     * @param {SceneManager} sceneManager
     */
    updateListenerOrientation(sceneManager) {
        if (!this.ctx || !sceneManager) return;

        const listener = this.ctx.listener;
        const forward = sceneManager.getCameraForward();
        const up = sceneManager.getCameraUp();

        if (!forward || !up) return;

        // Update listener orientation
        if (listener.forwardX) {
            listener.forwardX.setValueAtTime(forward.x, this.ctx.currentTime);
            listener.forwardY.setValueAtTime(forward.y, this.ctx.currentTime);
            listener.forwardZ.setValueAtTime(forward.z, this.ctx.currentTime);
            listener.upX.setValueAtTime(up.x, this.ctx.currentTime);
            listener.upY.setValueAtTime(up.y, this.ctx.currentTime);
            listener.upZ.setValueAtTime(up.z, this.ctx.currentTime);
        } else {
            listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
        }
    }
}
