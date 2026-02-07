import * as THREE from 'three';

export class GameManager {
    constructor(audioManager, sceneManager, uiManager, historyManager) {
        this.audioManager = audioManager;
        this.sceneManager = sceneManager;
        this.uiManager = uiManager;
        this.historyManager = historyManager;

        this.state = 'IDLE'; // IDLE, READY, PLAYING, WAITING, FEEDBACK, END
        this.score = 0;
        this.currentRound = 0;
        this.maxRounds = 10; // 10問制
        this.currentPosition = new THREE.Vector3();
        this.currentDirectionLabel = ''; // e.g. "Front"

        // モード ('4' or '8')
        this.mode = '8';

        // フィルターモード ('hrtf' or 'filter')
        this.filterMode = 'hrtf';

        // 再生回数制限
        this.playCount = 0;
        this.maxPlayCount = 2;

        // 時間計測
        this.startTime = null;
        this.endTime = null;

        // 各問の詳細記録
        this.roundDetails = [];

        // 出題リスト
        this.questionQueue = [];

        // 8 Directions (XZ plane) - 座標系: 前=0°, 右=90°
        // x = R * sin(theta), z = -R * cos(theta)
        this.directions = [
            { label: 'Front', angle: 0 },        // 前
            { label: 'Front-Right', angle: 45 }, // 右前
            { label: 'Right', angle: 90 },       // 右
            { label: 'Back-Right', angle: 135 }, // 右後
            { label: 'Back', angle: 180 },       // 後
            { label: 'Back-Left', angle: 225 },  // 左後
            { label: 'Left', angle: 270 },       // 左
            { label: 'Front-Left', angle: 315 }  // 左前
        ];

        // 4方位 (前・右・後・左)
        this.directions4 = [
            { label: 'Front', angle: 0 },   // 前
            { label: 'Right', angle: 90 },  // 右
            { label: 'Back', angle: 180 },  // 後
            { label: 'Left', angle: 270 }   // 左
        ];

        // 日本語ラベルマッピング
        this.directionLabelsJP = {
            'Front': '前',
            'Front-Right': '右前',
            'Right': '右',
            'Back-Right': '右後',
            'Back': '後',
            'Back-Left': '左後',
            'Left': '左',
            'Front-Left': '左前'
        };
    }

    async init() {
        // Any async init
    }

    /**
     * 問題キューを生成
     * 各方向を最低1回ずつ出題 + ランダムで残り問数を追加
     */
    generateQuestionQueue() {
        const dirs = this.mode === '4' ? this.directions4 : this.directions;

        // 全方向をシャッフル
        const shuffled = [...dirs].sort(() => Math.random() - 0.5);

        // 追加でランダム選択して合計10問にする
        const extraCount = this.maxRounds - dirs.length;
        const extra = [];
        for (let i = 0; i < extraCount; i++) {
            const randomDir = dirs[Math.floor(Math.random() * dirs.length)];
            extra.push(randomDir);
        }

        // 合計10問をシャッフル
        this.questionQueue = [...shuffled, ...extra].sort(() => Math.random() - 0.5);
    }

    /**
     * 角度から座標を計算
     * @param {number} angleDeg - 角度（度）
     * @param {number} radius - 距離
     * @returns {THREE.Vector3} 座標
     */
    angleToPosition(angleDeg, radius = 2) {
        const angleRad = (angleDeg * Math.PI) / 180;
        const x = radius * Math.sin(angleRad);
        const z = -radius * Math.cos(angleRad);
        return new THREE.Vector3(x, 0, z);
    }

    async start(mode = '8', filterMode = 'hrtf') {
        try {
            if (!this.audioManager.isInitialized) {
                await this.audioManager.init();
            }

            // デバイスの向き検知を有効化
            if (this.sceneManager) {
                await this.sceneManager.enableCameraRotation(true);
            }

            this.mode = mode;
            this.filterMode = filterMode;

            // AudioManagerにフィルターモードを設定
            this.audioManager.setFilterMode(filterMode);

            this.score = 0;
            this.currentRound = 0;
            this.roundDetails = [];
            this.startTime = Date.now();
            this.endTime = null;

            this.generateQuestionQueue();

            this.uiManager.showGameScreen(this.mode);
            this.uiManager.updateScore(this.score, this.currentRound, this.maxRounds);

            this.nextRound();
        } catch (error) {
            console.error('Failed to start game:', error);
            this.uiManager.showError('ゲームの開始に失敗しました。ページを再読み込みしてください。');
        }
    }

    nextRound() {
        // 毎回の問題開始時にキャリブレーション（ジャイロドリフト・持ち替え対策）
        if (this.sceneManager) {
            this.sceneManager.calibrateOrientation();
        }

        if (this.currentRound >= this.maxRounds) {
            this.endGame();
            return;
        }

        this.currentRound++;
        this.playCount = 0; // 再生回数リセット
        this.state = 'READY';
        this.uiManager.updateScore(this.score, this.currentRound, this.maxRounds);
        this.uiManager.setFeedback(''); // Clear feedback
        this.uiManager.clearHighlights(); // ハイライトクリア

        // 問題キューから取得
        const dir = this.questionQueue[this.currentRound - 1];
        this.currentDirectionLabel = dir.label;

        // 座標計算
        this.currentPosition = this.angleToPosition(dir.angle);

        // Update Audio & Visuals
        this.audioManager.setSourcePosition(this.currentPosition.x, this.currentPosition.y, this.currentPosition.z);

        // Visuals: Hide cues during test
        this.sceneManager.setSourcePosition(this.currentPosition);
        this.sceneManager.setSourceVisible(false);

        // 少し待ってから音を再生
        this.state = 'PLAYING';
        setTimeout(() => {
            if (this.state !== 'PLAYING') return;
            this.playSound();
            this.state = 'WAITING';
        }, 500);
    }

    playSound() {
        if (this.playCount >= this.maxPlayCount) return;
        this.playCount++;
        // 方向付きで音を再生（フィルターモードの場合にフィルタ適用）
        this.audioManager.playSoundWithDirection(1.0, this.currentDirectionLabel);
        this.uiManager.updatePlayCount(this.playCount, this.maxPlayCount);
    }

    replaySound() {
        if (this.state === 'WAITING') {
            if (this.playCount < this.maxPlayCount) {
                this.playSound();
            }
        }
    }

    handleInput(inputDirection) {
        if (this.state !== 'WAITING') return;

        this.sceneManager.setSourceVisible(true); // Reveal position

        // 正解判定
        const correct = inputDirection === this.currentDirectionLabel;

        // 詳細記録
        this.roundDetails.push({
            question: this.currentRound,
            answer: inputDirection,
            correct: this.currentDirectionLabel,
            isCorrect: correct
        });

        if (correct) {
            this.score += 10; // 10点加算
            this.uiManager.setFeedback(
                `○ 正解！`,
                '#00ff00'
            );
        } else {
            this.uiManager.setFeedback(
                `× 不正解\nあなたの回答: ${this.directionLabelsJP[inputDirection]}\n正解: ${this.directionLabelsJP[this.currentDirectionLabel]}`,
                '#ff4444'
            );
        }

        // コンパスUIでハイライト
        this.uiManager.highlightDirections(inputDirection, this.currentDirectionLabel, correct);

        this.state = 'FEEDBACK';

        // 次の問題へ
        setTimeout(() => {
            this.nextRound();
        }, 1500);
    }

    endGame() {
        this.state = 'END';
        this.endTime = Date.now();
        const duration = this.endTime - this.startTime;

        // 履歴保存
        if (this.historyManager) {
            this.historyManager.saveResult({
                score: this.score,
                correct: this.roundDetails.filter(d => d.isCorrect).length,
                total: this.maxRounds,
                duration: duration,
                details: this.roundDetails,
                mode: this.mode,
                filterMode: this.filterMode
            });
        }

        // 結果画面表示
        this.uiManager.showResultScreen(
            this.score,
            this.roundDetails.filter(d => d.isCorrect).length,
            this.maxRounds,
            duration,
            this.roundDetails,
            this.historyManager,
            this.filterMode
        );

        // デバイスの向き検知を無効化
        if (this.sceneManager) {
            this.sceneManager.enableCameraRotation(false);
        }
    }

    update() {
        // Frame logic
    }
}
