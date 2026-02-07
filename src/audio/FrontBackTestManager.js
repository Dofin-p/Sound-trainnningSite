export class FrontBackTestManager {
    constructor() {
        this.ctx = null;
        this.oscillator = null;
        this.gainNode = null;
        this.envelopeGain = null;
        this.panner = null;
        this.frontFilter = null;
        this.backFilter = null;
        this.masterGain = null;

        this.condition = 'C0'; // 'C0' | 'C1' | 'C2'
        this.trialCount = 20;
        this.currentTrial = 0;
        this.trials = [];
        this.isPlaying = false;
        this.trialStartTime = 0;
        this.cameraYawStart = 0;

        this.sceneManager = null;
        this.isInitialized = false;
    }

    async init(sceneManager) {
        if (this.isInitialized) return;

        this.sceneManager = sceneManager;

        // Create AudioContext
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // Create master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);

        // Create PannerNode
        this.panner = this.ctx.createPanner();
        this.panner.panningModel = 'HRTF';
        this.panner.distanceModel = 'inverse';
        this.panner.refDistance = 1;
        this.panner.maxDistance = 10000;
        this.panner.rolloffFactor = 1;
        this.panner.coneInnerAngle = 360;
        this.panner.coneOuterAngle = 0;
        this.panner.coneOuterGain = 0;

        // Create filters for C2
        this.createFilters();

        this.isInitialized = true;
        console.log("FrontBackTestManager initialized");
    }

    createFilters() {
        // Front filter (High Shelf)
        this.frontFilter = this.ctx.createBiquadFilter();
        this.frontFilter.type = 'highshelf';
        this.frontFilter.frequency.value = 4000;
        this.frontFilter.gain.value = 6; // +6dB

        // Back filter (Low Pass)
        this.backFilter = this.ctx.createBiquadFilter();
        this.backFilter.type = 'lowpass';
        this.backFilter.frequency.value = 3500;
        this.backFilter.Q.value = 0.7;
    }

    async resume() {
        if (!this.ctx) {
            console.error("AudioContext not initialized");
            return;
        }
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
            console.log("AudioContext resumed");
        }
    }

    setCondition(condition) {
        this.condition = condition;
        console.log(`Condition set to: ${condition}`);
    }

    setTrialCount(count) {
        this.trialCount = count;
        console.log(`Trial count set to: ${count}`);
    }

    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    startTest() {
        // Generate trials
        this.trials = this.generateTrials();
        this.currentTrial = 0;

        // Enable/disable camera rotation based on condition
        if (this.condition === 'C0') {
            if (this.sceneManager) {
                this.sceneManager.enableCameraRotation(false);
            }
        } else {
            if (this.sceneManager) {
                this.sceneManager.enableCameraRotation(true);
            }
        }

        console.log(`Test started: ${this.condition}, ${this.trialCount} trials`);
    }

    generateTrials() {
        const trials = [];
        const halfCount = this.trialCount / 2;

        // Create equal number of front and back trials
        for (let i = 0; i < halfCount; i++) {
            trials.push({ correctLabel: 'front' });
            trials.push({ correctLabel: 'back' });
        }

        // Shuffle
        for (let i = trials.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [trials[i], trials[j]] = [trials[j], trials[i]];
        }

        return trials;
    }

    async playTrial(trialIndex) {
        // 毎回の試行開始時にキャリブレーション（ジャイロドリフト・持ち替え対策）
        if (this.sceneManager) {
            this.sceneManager.calibrateOrientation();
        }

        if (trialIndex >= this.trials.length) {
            console.log("All trials completed");
            return;
        }

        await this.resume();

        const trial = this.trials[trialIndex];
        this.currentTrial = trialIndex;
        this.isPlaying = true;

        // Record start time and camera yaw
        this.trialStartTime = Date.now();
        this.cameraYawStart = this.sceneManager ? this.sceneManager.getCameraYaw() : 0;

        // Set source position
        const distance = 5;
        const pos = trial.correctLabel === 'front'
            ? { x: 0, y: 0, z: -distance }
            : { x: 0, y: 0, z: distance };

        trial.sourcePos = pos;

        // Set panner position
        if (this.panner.positionX) {
            this.panner.positionX.setValueAtTime(pos.x, this.ctx.currentTime);
            this.panner.positionY.setValueAtTime(pos.y, this.ctx.currentTime);
            this.panner.positionZ.setValueAtTime(pos.z, this.ctx.currentTime);
        } else {
            this.panner.setPosition(pos.x, pos.y, pos.z);
        }

        // Create oscillator
        this.oscillator = this.ctx.createOscillator();
        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(440, this.ctx.currentTime);

        // Create envelope gain
        this.envelopeGain = this.ctx.createGain();
        this.envelopeGain.gain.setValueAtTime(0, this.ctx.currentTime);

        // Attack
        this.envelopeGain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.01);

        // Sustain (2 seconds total)
        const sustainEnd = this.ctx.currentTime + 2.0 - 0.05;

        // Release
        this.envelopeGain.gain.setValueAtTime(1, sustainEnd);
        this.envelopeGain.gain.linearRampToValueAtTime(0, sustainEnd + 0.05);

        // Connect audio graph based on condition
        this.oscillator.connect(this.envelopeGain);

        if (this.condition === 'C2') {
            // C2: Use filter
            const filter = trial.correctLabel === 'front' ? this.frontFilter : this.backFilter;
            this.envelopeGain.connect(filter);
            filter.connect(this.panner);
        } else {
            // C0, C1: Direct connection
            this.envelopeGain.connect(this.panner);
        }

        this.panner.connect(this.masterGain);

        // Start oscillator
        this.oscillator.start();
        this.oscillator.stop(sustainEnd + 0.05);

        // Cleanup after playback
        this.oscillator.onended = () => {
            this.isPlaying = false;
        };

        console.log(`Playing trial ${trialIndex + 1}/${this.trials.length}: ${trial.correctLabel}`);
    }

    submitAnswer(answer) {
        if (this.currentTrial >= this.trials.length) return;

        const trial = this.trials[this.currentTrial];
        const reactionTime = Date.now() - this.trialStartTime;
        const cameraYawEnd = this.sceneManager ? this.sceneManager.getCameraYaw() : 0;

        trial.userAnswer = answer;
        trial.isCorrect = (answer === trial.correctLabel);
        trial.reactionTimeMs = reactionTime;
        trial.cameraYawStart = this.cameraYawStart;
        trial.cameraYawEnd = cameraYawEnd;
        trial.trialIndex = this.currentTrial;
        trial.pannerModel = 'HRTF';

        console.log(`Answer: ${answer}, Correct: ${trial.correctLabel}, IsCorrect: ${trial.isCorrect}`);

        return trial.isCorrect;
    }

    getResults() {
        const correctCount = this.trials.filter(t => t.isCorrect).length;
        const correctRate = correctCount / this.trials.length;

        const confusionMatrix = this.calculateConfusionMatrix();
        const avgReactionMs = this.calculateAverageReaction();

        return {
            correctRate,
            confusionMatrix,
            avgReactionMs,
            correctCount,
            totalTrials: this.trials.length
        };
    }

    calculateConfusionMatrix() {
        const matrix = {
            frontCorrect: 0,   // 正解: Front, 回答: Front
            frontWrong: 0,     // 正解: Front, 回答: Back
            backCorrect: 0,    // 正解: Back, 回答: Back
            backWrong: 0       // 正解: Back, 回答: Front
        };

        this.trials.forEach(trial => {
            if (!trial.userAnswer) return; // Skip unanswered

            if (trial.correctLabel === 'front') {
                if (trial.userAnswer === 'front') matrix.frontCorrect++;
                else matrix.frontWrong++;
            } else {
                if (trial.userAnswer === 'back') matrix.backCorrect++;
                else matrix.backWrong++;
            }
        });

        return matrix;
    }

    calculateAverageReaction() {
        const answeredTrials = this.trials.filter(t => t.reactionTimeMs);
        if (answeredTrials.length === 0) return 0;

        const total = answeredTrials.reduce((sum, t) => sum + t.reactionTimeMs, 0);
        return Math.round(total / answeredTrials.length);
    }

    saveToLocalStorage() {
        const results = this.getResults();

        const sessionData = {
            playedAt: new Date().toISOString(),
            condition: this.condition,
            totalTrials: this.trialCount,
            results: {
                correctRate: results.correctRate,
                confusionMatrix: results.confusionMatrix,
                avgReactionMs: results.avgReactionMs
            },
            trials: this.trials.map(t => ({
                trialIndex: t.trialIndex,
                correctLabel: t.correctLabel,
                userAnswer: t.userAnswer,
                isCorrect: t.isCorrect,
                reactionTimeMs: t.reactionTimeMs,
                cameraYawStart: t.cameraYawStart,
                cameraYawEnd: t.cameraYawEnd,
                sourcePos: t.sourcePos,
                pannerModel: t.pannerModel
            }))
        };

        const history = this.getHistory();
        history.push(sessionData);

        // Keep last 50 sessions
        if (history.length > 50) {
            history.shift();
        }

        localStorage.setItem('soundDirection.fbtest.v2.history', JSON.stringify(history));
        console.log("Session saved to localStorage", sessionData);
    }

    getHistory() {
        const historyJson = localStorage.getItem('soundDirection.fbtest.v2.history');
        if (!historyJson) return [];

        try {
            return JSON.parse(historyJson);
        } catch (e) {
            console.error("Failed to parse history:", e);
            return [];
        }
    }

    clearHistory() {
        localStorage.removeItem('soundDirection.fbtest.v2.history');
        console.log("History cleared");
    }

    updateAudioListener() {
        if (!this.sceneManager || !this.ctx) return;

        const camera = this.sceneManager.camera;
        const listener = this.ctx.listener;

        if (!camera || !listener) return;

        // Position
        if (listener.positionX) {
            listener.positionX.setValueAtTime(camera.position.x, this.ctx.currentTime);
            listener.positionY.setValueAtTime(camera.position.y, this.ctx.currentTime);
            listener.positionZ.setValueAtTime(camera.position.z, this.ctx.currentTime);
        } else {
            listener.setPosition(camera.position.x, camera.position.y, camera.position.z);
        }

        // Forward direction
        const forward = this.sceneManager.getCameraForward();
        if (forward && listener.forwardX) {
            listener.forwardX.setValueAtTime(forward.x, this.ctx.currentTime);
            listener.forwardY.setValueAtTime(forward.y, this.ctx.currentTime);
            listener.forwardZ.setValueAtTime(forward.z, this.ctx.currentTime);
        } else if (forward) {
            const up = this.sceneManager.getCameraUp();
            listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
        }

        // Up direction
        const up = this.sceneManager.getCameraUp();
        if (up && listener.upX) {
            listener.upX.setValueAtTime(up.x, this.ctx.currentTime);
            listener.upY.setValueAtTime(up.y, this.ctx.currentTime);
            listener.upZ.setValueAtTime(up.z, this.ctx.currentTime);
        }
    }

    stopCurrentSound() {
        if (this.oscillator) {
            try {
                this.oscillator.stop();
                this.oscillator.disconnect();
            } catch (e) {
                // Already stopped
            }
            this.oscillator = null;
        }
        this.isPlaying = false;
    }

    dispose() {
        this.stopCurrentSound();

        if (this.ctx) {
            this.ctx.close();
            this.ctx = null;
        }

        this.isInitialized = false;
    }
}
