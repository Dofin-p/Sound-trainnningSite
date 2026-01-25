export class DiagnosticsManager {
    constructor() {
        this.ctx = null;
        this.oscillator = null;
        this.gainNode = null;
        this.panner = null;
        this.panner3D = null; // PannerNode for 3D audio
        this.leftAnalyser = null;
        this.rightAnalyser = null;
        this.splitter = null;
        this.merger = null;
        this.isInitialized = false;
        this.isPlaying = false;
        this.currentMode = null; // 'left' | 'right' | 'alternating' | 'front' | 'back' | 'alternating-4d'
        this.alternatingInterval = null;
        this.currentPan = -1;
        this.animationFrameId = null;
        this.mode = '2D'; // '2D' or '4D'
        this.current4DDirection = 0; // For alternating 4D test
    }

    async init() {
        if (this.isInitialized) return;

        // Create AudioContext
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // Create gain node for volume control
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.value = 0.5; // Default 50% volume

        // Create StereoPanner for left/right control
        this.panner = this.ctx.createStereoPanner();
        this.panner.pan.value = 0; // Center by default

        // Create ChannelSplitter for separate L/R analysis
        this.splitter = this.ctx.createChannelSplitter(2);
        this.merger = this.ctx.createChannelMerger(2);

        // Create AnalyserNodes for L/R RMS measurement
        this.leftAnalyser = this.ctx.createAnalyser();
        this.leftAnalyser.fftSize = 2048;
        this.leftAnalyser.smoothingTimeConstant = 0.8;

        this.rightAnalyser = this.ctx.createAnalyser();
        this.rightAnalyser.fftSize = 2048;
        this.rightAnalyser.smoothingTimeConstant = 0.8;

        // Audio graph: gain -> panner -> splitter -> analysers
        //                              -> merger -> destination (for monitoring)
        this.gainNode.connect(this.panner);
        this.panner.connect(this.splitter);

        // Connect to analysers
        this.splitter.connect(this.leftAnalyser, 0);
        this.splitter.connect(this.rightAnalyser, 1);

        // Connect to merger for audio output
        this.splitter.connect(this.merger, 0, 0);
        this.splitter.connect(this.merger, 1, 1);
        this.merger.connect(this.ctx.destination);

        this.isInitialized = true;
        console.log("DiagnosticsManager initialized");
    }

    /**
     * Set mode for diagnostics (2D stereo or 4D spatial)
     * @param {string} mode - '2D' or '4D'
     */
    setMode(mode) {
        this.mode = mode;
        console.log(`Diagnostics mode set to: ${mode}`);

        if (mode === '4D' && !this.panner3D) {
            this.setup3DAudio();
        }
    }

    /**
     * Setup 3D audio for 4-direction test
     */
    async setup3DAudio() {
        if (!this.ctx) {
            await this.init();
        }

        // Create PannerNode for 3D audio
        this.panner3D = this.ctx.createPanner();
        this.panner3D.panningModel = 'HRTF'; // Best for headphones
        this.panner3D.distanceModel = 'inverse';
        this.panner3D.refDistance = 1;
        this.panner3D.maxDistance = 10000;
        this.panner3D.rolloffFactor = 1;
        this.panner3D.coneInnerAngle = 360;
        this.panner3D.coneOuterAngle = 0;
        this.panner3D.coneOuterGain = 0;

        // Set default position
        this.set3DPosition(0, 0, -2);

        // Setup AudioListener orientation (looking forward, -Z direction)
        const listener = this.ctx.listener;
        if (listener.forwardX) {
            listener.forwardX.setValueAtTime(0, this.ctx.currentTime);
            listener.forwardY.setValueAtTime(0, this.ctx.currentTime);
            listener.forwardZ.setValueAtTime(-1, this.ctx.currentTime);
            listener.upX.setValueAtTime(0, this.ctx.currentTime);
            listener.upY.setValueAtTime(1, this.ctx.currentTime);
            listener.upZ.setValueAtTime(0, this.ctx.currentTime);
        } else {
            // Fallback for older browsers
            listener.setOrientation(0, 0, -1, 0, 1, 0);
        }

        console.log("3D audio setup complete");
    }

    /**
     * Get 4-direction coordinates
     * @returns {object} Direction coordinates
     */
    get directions4D() {
        const distance = 2; // 2 meters
        return {
            'front': { x: 0, y: 0, z: -distance },   // Front
            'back': { x: 0, y: 0, z: distance },     // Back
            'left': { x: -distance, y: 0, z: 0 },    // Left
            'right': { x: distance, y: 0, z: 0 }     // Right
        };
    }

    /**
     * Set 3D position for panner
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     */
    set3DPosition(x, y, z) {
        if (!this.panner3D) return;

        if (this.panner3D.positionX) {
            this.panner3D.positionX.setValueAtTime(x, this.ctx.currentTime);
            this.panner3D.positionY.setValueAtTime(y, this.ctx.currentTime);
            this.panner3D.positionZ.setValueAtTime(z, this.ctx.currentTime);
        } else {
            // Fallback for older browsers
            this.panner3D.setPosition(x, y, z);
        }
    }

    /**
     * Set source position for 4D test
     * @param {string} direction - 'front' | 'back' | 'left' | 'right'
     */
    setSourcePosition4D(direction) {
        const pos = this.directions4D[direction];
        if (pos) {
            this.set3DPosition(pos.x, pos.y, pos.z);
            console.log(`4D position set: ${direction} (${pos.x}, ${pos.y}, ${pos.z})`);
        }
    }

    /**
     * Resume AudioContext (must be called after user interaction)
     */
    async resume() {
        if (!this.ctx) {
            await this.init();
        }
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
            console.log("AudioContext resumed");
        }
    }

    /**
     * Get current AudioContext state
     * @returns {string} 'running' | 'suspended' | 'closed' | 'not-initialized'
     */
    getAudioContextState() {
        if (!this.ctx) return 'not-initialized';
        return this.ctx.state;
    }

    /**
     * Start diagnostic test
     * @param {string} mode - '2D': 'left' | 'right' | 'alternating' | '4D': 'front' | 'back' | 'left' | 'right' | 'alternating-4d'
     */
    async startTest(mode) {
        if (!this.isInitialized) {
            await this.init();
        }

        // Resume if suspended
        await this.resume();

        // Stop any existing test
        this.stopTest();

        this.currentMode = mode;
        this.isPlaying = true;

        // Create oscillator for test tone
        this.oscillator = this.ctx.createOscillator();
        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(440, this.ctx.currentTime); // A4 (440Hz)

        // Connect oscillator to gain
        this.oscillator.connect(this.gainNode);

        // Handle mode based on 2D or 4D
        if (this.mode === '4D') {
            // Disconnect from StereoPanner, connect to PannerNode
            if (this.oscillator.numberOfOutputs > 0) {
                this.oscillator.disconnect();
                this.oscillator.connect(this.gainNode);
            }

            // Ensure 3D audio is set up
            if (!this.panner3D) {
                await this.setup3DAudio();
            }

            // Reconnect audio graph for 3D
            this.gainNode.disconnect();
            this.gainNode.connect(this.panner3D);
            this.panner3D.connect(this.splitter);

            // Set position based on mode
            switch (mode) {
                case 'front':
                    this.setSourcePosition4D('front');
                    break;
                case 'back':
                    this.setSourcePosition4D('back');
                    break;
                case 'left':
                    this.setSourcePosition4D('left');
                    break;
                case 'right':
                    this.setSourcePosition4D('right');
                    break;
                case 'alternating-4d':
                    this.startAlternating4D();
                    break;
            }
        } else {
            // 2D mode - use StereoPanner
            // Reconnect audio graph for 2D
            this.gainNode.disconnect();
            this.gainNode.connect(this.panner);
            this.panner.connect(this.splitter);

            // Set initial pan based on mode
            switch (mode) {
                case 'left':
                    this.panner.pan.setValueAtTime(-1, this.ctx.currentTime);
                    break;
                case 'right':
                    this.panner.pan.setValueAtTime(1, this.ctx.currentTime);
                    break;
                case 'alternating':
                    this.startAlternating();
                    break;
            }
        }

        // Start oscillator
        this.oscillator.start();
        console.log(`Diagnostics test started: ${mode} (${this.mode} mode)`);
    }

    /**
     * Start alternating left/right test (2D)
     */
    startAlternating() {
        this.currentPan = -1;
        this.panner.pan.setValueAtTime(this.currentPan, this.ctx.currentTime);

        // Alternate every 300ms
        this.alternatingInterval = setInterval(() => {
            if (!this.isPlaying) {
                clearInterval(this.alternatingInterval);
                return;
            }

            this.currentPan = this.currentPan === -1 ? 1 : -1;

            // Smooth transition to avoid clicks
            this.panner.pan.setValueAtTime(this.currentPan, this.ctx.currentTime);

            console.log(`2D Pan switched to: ${this.currentPan === -1 ? 'LEFT' : 'RIGHT'}`);
        }, 300);
    }

    /**
     * Start alternating 4-direction test (4D)
     */
    startAlternating4D() {
        const directions = ['front', 'back', 'left', 'right'];
        this.current4DDirection = 0;

        // Set initial position
        this.setSourcePosition4D(directions[this.current4DDirection]);

        // Alternate every 500ms (slower for 4 directions)
        this.alternatingInterval = setInterval(() => {
            if (!this.isPlaying) {
                clearInterval(this.alternatingInterval);
                return;
            }

            this.current4DDirection = (this.current4DDirection + 1) % directions.length;
            this.setSourcePosition4D(directions[this.current4DDirection]);

            console.log(`4D position switched to: ${directions[this.current4DDirection].toUpperCase()}`);
        }, 500);
    }

    /**
     * Stop current test
     */
    stopTest() {
        this.isPlaying = false;
        this.currentMode = null;

        // Stop alternating interval
        if (this.alternatingInterval) {
            clearInterval(this.alternatingInterval);
            this.alternatingInterval = null;
        }

        // Stop oscillator
        if (this.oscillator) {
            try {
                this.oscillator.stop();
                this.oscillator.disconnect();
            } catch (e) {
                // Oscillator already stopped
            }
            this.oscillator = null;
        }

        console.log("Diagnostics test stopped");
    }

    /**
     * Set master volume
     * @param {number} gain - 0.0 to 1.0
     */
    setVolume(gain) {
        if (!this.gainNode) return;

        // Clamp between 0 and 1
        gain = Math.max(0, Math.min(1, gain));

        this.gainNode.gain.setValueAtTime(gain, this.ctx.currentTime);
        console.log(`Volume set to: ${gain}`);
    }

    /**
     * Get RMS (Root Mean Square) for left channel
     * @returns {number} RMS value (0.0 to 1.0)
     */
    getLeftRMS() {
        if (!this.leftAnalyser) return 0;
        return this.getRMS(this.leftAnalyser);
    }

    /**
     * Get RMS for right channel
     * @returns {number} RMS value (0.0 to 1.0)
     */
    getRightRMS() {
        if (!this.rightAnalyser) return 0;
        return this.getRMS(this.rightAnalyser);
    }

    /**
     * Calculate RMS from AnalyserNode
     * @param {AnalyserNode} analyser 
     * @returns {number} RMS value (0.0 to 1.0)
     */
    getRMS(analyser) {
        const dataArray = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(dataArray);

        // Calculate RMS: sqrt(mean(x^2))
        const sumSquares = dataArray.reduce((sum, val) => sum + val * val, 0);
        const rms = Math.sqrt(sumSquares / dataArray.length);

        return rms;
    }

    /**
     * Save diagnostic log to localStorage
     * @param {object} logEntry - Log entry object
     */
    saveLog(logEntry) {
        const logs = this.getLogs();

        const newLog = {
            timestamp: Date.now(),
            mode: logEntry.mode,
            leftRMS: logEntry.leftRMS,
            rightRMS: logEntry.rightRMS,
            volume: logEntry.volume,
            userHeardLeft: logEntry.userHeardLeft,
            userHeardRight: logEntry.userHeardRight,
            audioContextState: this.getAudioContextState()
        };

        logs.push(newLog);

        // Keep only last 50 logs
        if (logs.length > 50) {
            logs.shift();
        }

        localStorage.setItem('diagnostics_logs', JSON.stringify(logs));
        console.log("Diagnostic log saved:", newLog);
    }

    /**
     * Get all diagnostic logs
     * @returns {Array} Array of log entries
     */
    getLogs() {
        const logsJson = localStorage.getItem('diagnostics_logs');
        if (!logsJson) return [];

        try {
            return JSON.parse(logsJson);
        } catch (e) {
            console.error("Failed to parse diagnostic logs:", e);
            return [];
        }
    }

    /**
     * Clear all diagnostic logs
     */
    clearLogs() {
        localStorage.removeItem('diagnostics_logs');
        console.log("Diagnostic logs cleared");
    }

    /**
     * Format timestamp for display
     * @param {number} timestamp 
     * @returns {string}
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('ja-JP');
    }

    /**
     * Cleanup resources
     */
    dispose() {
        this.stopTest();

        if (this.ctx) {
            this.ctx.close();
            this.ctx = null;
        }

        this.isInitialized = false;
        console.log("DiagnosticsManager disposed");
    }
}
