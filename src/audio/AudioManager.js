export class AudioManager {
    constructor() {
        this.ctx = null;
        this.panner = null;
        this.oscillator = null;
        this.gainNode = null;
        this.isInitialized = false;
        this.filterMode = 'hrtf'; // 'hrtf' or 'filter'
        this.frontFilter = null;
        this.backFilter = null;
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

        // Create filters for front/back distinction
        this.createFilters();

        // Connect panner to destination (speakers)
        this.panner.connect(this.ctx.destination);

        this.isInitialized = true;
        console.log("AudioManager initialized");
    }

    /**
     * 前後弁別用フィルターを作成
     */
    createFilters() {
        // Front filter (High Shelf) - 高域強調で明るい音
        this.frontFilter = this.ctx.createBiquadFilter();
        this.frontFilter.type = 'highshelf';
        this.frontFilter.frequency.value = 4000;
        this.frontFilter.gain.value = 6; // +6dB

        // Back filter (Low Pass) - 高域カットでこもった音
        this.backFilter = this.ctx.createBiquadFilter();
        this.backFilter.type = 'lowpass';
        this.backFilter.frequency.value = 3500;
        this.backFilter.Q.value = 0.7;
    }

    /**
     * フィルターモードを設定
     * @param {string} mode - 'hrtf' or 'filter'
     */
    setFilterMode(mode) {
        this.filterMode = mode;
        console.log(`Filter mode set to: ${mode}`);
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
        this.playSoundWithDirection(duration, null);
    }

    /**
     * 方向を指定して音を再生（フィルターモードの場合フィルタを適用）
     * @param {number} duration - 再生時間（秒）
     * @param {string|null} direction - 方向 ('Front', 'Back', etc.) 
     */
    playSoundWithDirection(duration = 0.5, direction = null) {
        if (!this.ctx) return;

        // Create oscillator for sound
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime); // A4

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gainNode);

        // Apply filter based on direction if filter mode is enabled
        if (this.filterMode === 'filter' && direction) {
            const isFront = direction === 'Front' || direction === 'Front-Right' || direction === 'Front-Left';
            const isBack = direction === 'Back' || direction === 'Back-Right' || direction === 'Back-Left';

            if (isFront && this.frontFilter) {
                gainNode.connect(this.frontFilter);
                this.frontFilter.connect(this.panner);
            } else if (isBack && this.backFilter) {
                gainNode.connect(this.backFilter);
                this.backFilter.connect(this.panner);
            } else {
                gainNode.connect(this.panner);
            }
        } else {
            gainNode.connect(this.panner);
        }

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
