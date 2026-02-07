export class UIManager {
    constructor() {
        this.container = null;
        this.gameManager = null;
        this.currentMode = '8';
    }

    init(container, gameManager) {
        this.container = container;
        this.gameManager = gameManager;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div id="ui-layer">
                
                <!-- Start Screen -->
                <div id="start-screen" class="screen">
                    <div class="panel">
                        <h1 class="title">🎯 Sound Direction Trainer</h1>
                        <p class="subtitle">音源方向当てゲーム</p>
                        <p class="headphones">🎧 ヘッドフォン必須 🎧</p>
                        <button id="start-btn" class="btn-primary">START GAME</button>
                        <button id="diagnostics-btn" class="btn-secondary">🔧 Audio診断</button>
                        <button id="history-btn" class="btn-secondary">📊 履歴を見る</button>
                    </div>
                </div>

                <!-- Mode Select Screen -->
                <div id="mode-select-screen" class="screen" style="display: none;">
                    <div class="panel">
                        <h2 class="title">モード選択</h2>
                        <p class="subtitle">方位数を選んでください</p>
                        <div class="mode-buttons">
                            <button id="mode-4-btn" class="btn-mode">
                                <span class="mode-label">四方位</span>
                                <span class="mode-desc">前・右・後・左</span>
                            </button>
                            <button id="mode-8-btn" class="btn-mode">
                                <span class="mode-label">八方位</span>
                                <span class="mode-desc">8方向すべて</span>
                            </button>
                        </div>
                        <button id="back-from-mode-btn" class="btn-secondary">戻る</button>
                    </div>
                </div>

                <!-- Filter Mode Select Screen -->
                <div id="filter-select-screen" class="screen" style="display: none;">
                    <div class="panel">
                        <h2 class="title">音響モード選択</h2>
                        <p class="subtitle">前後の音の聞こえ方を選んでください</p>
                        <div class="mode-buttons">
                            <button id="filter-hrtf-btn" class="btn-mode">
                                <span class="mode-label">HRTFのみ</span>
                                <span class="mode-desc">標準（フィルターなし）</span>
                            </button>
                            <button id="filter-on-btn" class="btn-mode">
                                <span class="mode-label">フィルター有り</span>
                                <span class="mode-desc">前後の区別を強調</span>
                            </button>
                        </div>
                        <button id="back-from-filter-btn" class="btn-secondary">戻る</button>
                    </div>
                </div>

                <!-- Game Screen -->
                <div id="game-screen" class="screen" style="display: none;">
                    <div class="game-header">
                        <div class="progress">第 <span id="current-round">1</span> / <span id="max-rounds">10</span> 問</div>
                        <div class="score-display">スコア: <span id="score">0</span>点</div>
                        <div class="play-count">再生: <span id="play-count">0</span>/<span id="max-play-count">2</span>回</div>
                        <div class="yaw-display">Yaw: <span id="yaw-value">0.00</span>°</div>
                    </div>
                    
                    <!-- Compass UI -->
                    <div id="compass-container">
                        <div id="compass">
                            <div class="compass-center">🎧</div>
                            <button class="compass-btn" data-dir="Front" style="top: 5%; left: 50%; transform: translateX(-50%);">前</button>
                            <button class="compass-btn" data-dir="Front-Right" style="top: 15%; right: 15%;">右前</button>
                            <button class="compass-btn" data-dir="Right" style="top: 50%; right: 5%; transform: translateY(-50%);">右</button>
                            <button class="compass-btn" data-dir="Back-Right" style="bottom: 15%; right: 15%;">右後</button>
                            <button class="compass-btn" data-dir="Back" style="bottom: 5%; left: 50%; transform: translateX(-50%);">後</button>
                            <button class="compass-btn" data-dir="Back-Left" style="bottom: 15%; left: 15%;">左後</button>
                            <button class="compass-btn" data-dir="Left" style="top: 50%; left: 5%; transform: translateY(-50%);">左</button>
                            <button class="compass-btn" data-dir="Front-Left" style="top: 15%; left: 15%;">左前</button>
                        </div>
                    </div>

                    <div id="feedback" class="feedback"></div>
                    
                    <div class="controls">
                        <button id="replay-btn" class="btn-replay">🔊 もう一度再生</button>
                    </div>
                </div>

                <!-- Result Screen -->
                <div id="result-screen" class="screen" style="display: none;">
                    <div class="panel result-panel">
                        <h2>🎉 ゲーム終了！</h2>
                        <div class="result-score">
                            <span id="final-score">0</span>点
                        </div>
                        <div class="result-details">
                            <div>正解数: <span id="correct-count">0</span> / <span id="total-count">10</span></div>
                            <div>所要時間: <span id="duration">0秒</span></div>
                            <div>音響モード: <span id="filter-mode-display">HRTFのみ</span></div>
                        </div>
                        <div id="result-breakdown" class="result-breakdown"></div>
                        <div class="result-buttons">
                            <button id="restart-btn" class="btn-primary">もう一度プレイ</button>
                            <button id="back-to-start-btn" class="btn-secondary">スタートへ戻る</button>
                        </div>
                    </div>
                </div>

                <!-- History Screen -->
                <div id="history-screen" class="screen" style="display: none;">
                    <div class="panel history-panel">
                        <h2>📊 プレイ履歴</h2>
                        <div id="history-list" class="history-list"></div>
                        <div class="history-buttons">
                            <button id="clear-history-btn" class="btn-danger">履歴をクリア</button>
                            <button id="back-from-history-btn" class="btn-secondary">戻る</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.addStyles();
        this.bindEvents();
    }

    addStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            #ui-layer {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                user-select: none;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }

            .screen {
                pointer-events: auto;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .panel {
                background: linear-gradient(135deg, rgba(20, 20, 40, 0.95), rgba(40, 20, 60, 0.95));
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                border: 1px solid rgba(100, 200, 255, 0.3);
                box-shadow: 0 0 40px rgba(100, 200, 255, 0.2);
                max-width: 90vw;
            }

            .title {
                font-size: 2rem;
                margin-bottom: 10px;
                background: linear-gradient(90deg, #00ffff, #ff00ff);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .subtitle {
                font-size: 1.2rem;
                color: #aaa;
                margin-bottom: 20px;
            }

            .headphones {
                font-size: 1.1rem;
                color: #ffcc00;
                margin-bottom: 30px;
            }

            .btn-primary {
                padding: 15px 40px;
                font-size: 1.2rem;
                cursor: pointer;
                background: linear-gradient(135deg, #00ccff, #0066ff);
                border: none;
                border-radius: 10px;
                color: white;
                margin: 10px;
                transition: all 0.3s;
                font-weight: bold;
            }

            .btn-primary:hover {
                transform: scale(1.05);
                box-shadow: 0 0 20px rgba(0, 200, 255, 0.5);
            }

            .btn-secondary {
                padding: 12px 30px;
                font-size: 1rem;
                cursor: pointer;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 10px;
                color: white;
                margin: 10px;
                transition: all 0.3s;
            }

            .btn-secondary:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .btn-danger {
                padding: 12px 30px;
                font-size: 1rem;
                cursor: pointer;
                background: rgba(255, 50, 50, 0.3);
                border: 1px solid rgba(255, 100, 100, 0.5);
                border-radius: 10px;
                color: #ff8888;
                margin: 10px;
                transition: all 0.3s;
            }

            .btn-danger:hover {
                background: rgba(255, 50, 50, 0.5);
            }

            .mode-buttons {
                display: flex;
                gap: 20px;
                justify-content: center;
                margin: 20px 0;
            }

            .btn-mode {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 25px 35px;
                cursor: pointer;
                background: rgba(255, 255, 255, 0.08);
                border: 2px solid rgba(100, 200, 255, 0.3);
                border-radius: 15px;
                color: white;
                transition: all 0.3s;
            }

            .btn-mode:hover {
                background: rgba(0, 200, 255, 0.15);
                border-color: #00ccff;
                transform: scale(1.05);
                box-shadow: 0 0 20px rgba(0, 200, 255, 0.3);
            }

            .mode-label {
                font-size: 1.4rem;
                font-weight: bold;
                margin-bottom: 6px;
            }

            .mode-desc {
                font-size: 0.9rem;
                color: #aaa;
            }

            .btn-replay {
                padding: 15px 30px;
                font-size: 1.1rem;
                cursor: pointer;
                background: rgba(100, 100, 100, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 10px;
                color: white;
                transition: all 0.3s;
            }

            .btn-replay:hover {
                background: rgba(100, 100, 100, 0.7);
            }

            .btn-replay:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            /* Game Screen */
            #game-screen {
                flex-direction: column;
                padding: 20px;
            }

            .game-header {
                display: flex;
                justify-content: center;
                gap: 40px;
                margin-bottom: 20px;
                font-size: 1.2rem;
            }

            .progress {
                color: #00ffff;
                font-weight: bold;
            }

            .score-display {
                color: #ffcc00;
                font-weight: bold;
            }

            .play-count {
                color: #aaa;
            }

            .yaw-display {
                color: #00ff88;
                font-family: 'Courier New', monospace;
                font-weight: bold;
            }

            /* Compass */
            #compass-container {
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 20px 0;
            }

            #compass {
                position: relative;
                width: 300px;
                height: 300px;
                background: radial-gradient(circle, rgba(30, 30, 50, 0.9), rgba(20, 20, 30, 0.95));
                border-radius: 50%;
                border: 3px solid rgba(100, 200, 255, 0.4);
                box-shadow: 0 0 30px rgba(100, 200, 255, 0.2);
            }

            .compass-center {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 2rem;
            }

            .compass-btn {
                position: absolute;
                width: 60px;
                height: 60px;
                font-size: 14px;
                cursor: pointer;
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid rgba(255, 255, 255, 0.3);
                color: white;
                border-radius: 50%;
                transition: all 0.2s;
                font-weight: bold;
            }

            .compass-btn:hover {
                background: rgba(0, 200, 255, 0.3);
                border-color: #00ccff;
                transform: scale(1.1);
            }

            .compass-btn:active {
                background: rgba(0, 200, 255, 0.5);
            }

            .compass-btn.highlight-correct {
                background: rgba(0, 255, 100, 0.6) !important;
                border-color: #00ff66 !important;
                box-shadow: 0 0 20px rgba(0, 255, 100, 0.5);
                animation: pulse-correct 0.5s ease-in-out;
            }

            .compass-btn.highlight-wrong {
                background: rgba(255, 100, 100, 0.6) !important;
                border-color: #ff4444 !important;
                box-shadow: 0 0 20px rgba(255, 100, 100, 0.5);
            }

            .compass-btn.highlight-answer {
                border-color: #4488ff !important;
                box-shadow: 0 0 15px rgba(100, 150, 255, 0.5);
            }

            @keyframes pulse-correct {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.15); }
            }

            .feedback {
                min-height: 60px;
                font-size: 1.2rem;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
                white-space: pre-line;
            }

            .controls {
                margin-top: 20px;
            }

            /* Result Screen */
            .result-panel {
                min-width: 350px;
            }

            .result-score {
                font-size: 4rem;
                font-weight: bold;
                background: linear-gradient(90deg, #ffcc00, #ff6600);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin: 20px 0;
            }

            .result-details {
                font-size: 1.2rem;
                color: #ccc;
                margin-bottom: 20px;
            }

            .result-details div {
                margin: 5px 0;
            }

            .result-breakdown {
                max-height: 150px;
                overflow-y: auto;
                margin: 15px 0;
                padding: 10px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
                font-size: 0.9rem;
            }

            .result-breakdown-item {
                display: flex;
                justify-content: space-between;
                padding: 5px 10px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .result-breakdown-item:last-child {
                border-bottom: none;
            }

            .result-buttons {
                margin-top: 20px;
            }

            /* History Screen */
            .history-panel {
                max-width: 500px;
                width: 100%;
            }

            .history-list {
                max-height: 400px;
                overflow-y: auto;
                margin: 20px 0;
            }

            .history-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                margin: 10px 0;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .history-date {
                color: #888;
                font-size: 0.9rem;
            }

            .history-score {
                font-size: 1.5rem;
                font-weight: bold;
                color: #ffcc00;
            }

            .history-correct {
                color: #00ff66;
            }

            .history-empty {
                color: #666;
                padding: 40px;
            }

            .history-buttons {
                margin-top: 20px;
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.showModeSelectScreen();
        });

        // 方位選択 → フィルター選択画面へ
        document.getElementById('mode-4-btn').addEventListener('click', () => {
            this.currentMode = '4';
            this.showFilterSelectScreen();
        });

        document.getElementById('mode-8-btn').addEventListener('click', () => {
            this.currentMode = '8';
            this.showFilterSelectScreen();
        });

        document.getElementById('back-from-mode-btn').addEventListener('click', () => {
            this.showStartScreen();
        });

        // フィルター選択 → ゲーム開始
        document.getElementById('filter-hrtf-btn').addEventListener('click', () => {
            this.currentFilterMode = 'hrtf';
            this.gameManager.start(this.currentMode, 'hrtf');
        });

        document.getElementById('filter-on-btn').addEventListener('click', () => {
            this.currentFilterMode = 'filter';
            this.gameManager.start(this.currentMode, 'filter');
        });

        document.getElementById('back-from-filter-btn').addEventListener('click', () => {
            this.showModeSelectScreen();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.gameManager.start(this.currentMode, this.currentFilterMode || 'hrtf');
        });

        document.getElementById('back-to-start-btn').addEventListener('click', () => {
            this.showStartScreen();
        });

        document.getElementById('diagnostics-btn').addEventListener('click', () => {
            this.showDiagnosticsScreen();
        });

        document.getElementById('history-btn').addEventListener('click', () => {
            this.showHistoryScreen(this.gameManager.historyManager);
        });

        document.getElementById('back-from-history-btn').addEventListener('click', () => {
            this.showStartScreen();
        });

        document.getElementById('clear-history-btn').addEventListener('click', () => {
            if (confirm('履歴をすべて削除しますか？')) {
                if (this.gameManager.historyManager) {
                    this.gameManager.historyManager.clearHistory();
                    this.showHistoryScreen(this.gameManager.historyManager);
                }
            }
        });

        document.querySelectorAll('.compass-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dir = e.target.getAttribute('data-dir');
                this.gameManager.handleInput(dir);
            });
        });

        document.getElementById('replay-btn').addEventListener('click', () => {
            this.gameManager.replaySound();
        });
    }

    /**
     * すべての画面を非表示にするヘルパーメソッド
     */
    hideAllScreens() {
        const screens = ['start-screen', 'mode-select-screen', 'filter-select-screen', 'game-screen', 'result-screen', 'history-screen'];
        screens.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }

    /**
     * エラーメッセージを表示する
     * @param {string} message - エラーメッセージ
     */
    showError(message) {
        this.hideAllScreens();
        document.getElementById('start-screen').style.display = 'flex';
        alert(message);
    }

    showStartScreen() {
        this.hideAllScreens();
        document.getElementById('start-screen').style.display = 'flex';
    }

    showModeSelectScreen() {
        this.hideAllScreens();
        document.getElementById('mode-select-screen').style.display = 'flex';
    }

    showFilterSelectScreen() {
        this.hideAllScreens();
        document.getElementById('filter-select-screen').style.display = 'flex';
    }

    showGameScreen(mode = '8') {
        this.hideAllScreens();
        document.getElementById('game-screen').style.display = 'flex';

        // 四方位モード時は斜め方向ボタンを非表示
        const diagonalDirs = ['Front-Right', 'Back-Right', 'Back-Left', 'Front-Left'];
        document.querySelectorAll('.compass-btn').forEach(btn => {
            const dir = btn.getAttribute('data-dir');
            if (diagonalDirs.includes(dir)) {
                btn.style.display = mode === '4' ? 'none' : '';
            }
        });
    }

    showResultScreen(score, correctCount, total, duration, details, historyManager, filterMode = 'hrtf') {
        this.hideAllScreens();
        document.getElementById('result-screen').style.display = 'flex';

        document.getElementById('final-score').textContent = score;
        document.getElementById('correct-count').textContent = correctCount;
        document.getElementById('total-count').textContent = total;

        // 所要時間フォーマット
        if (historyManager) {
            document.getElementById('duration').textContent = historyManager.formatDuration(duration);
        } else {
            const seconds = Math.floor(duration / 1000);
            document.getElementById('duration').textContent = `${seconds}秒`;
        }

        // フィルターモード表示
        const filterModeText = filterMode === 'filter' ? 'フィルター有り' : 'HRTFのみ';
        document.getElementById('filter-mode-display').textContent = filterModeText;

        // 詳細表示
        const breakdownEl = document.getElementById('result-breakdown');
        if (details && details.length > 0) {
            const dirLabelsJP = {
                'Front': '前', 'Front-Right': '右前', 'Right': '右',
                'Back-Right': '右後', 'Back': '後', 'Back-Left': '左後',
                'Left': '左', 'Front-Left': '左前'
            };
            breakdownEl.innerHTML = details.map((d, i) => `
                <div class="result-breakdown-item">
                    <span>第${i + 1}問</span>
                    <span>${d.isCorrect ? '○' : '×'} ${dirLabelsJP[d.answer]} → ${dirLabelsJP[d.correct]}</span>
                </div>
            `).join('');
        } else {
            breakdownEl.innerHTML = '';
        }
    }

    showHistoryScreen(historyManager) {
        this.hideAllScreens();
        document.getElementById('history-screen').style.display = 'flex';

        const listEl = document.getElementById('history-list');

        if (!historyManager) {
            listEl.innerHTML = '<div class="history-empty">履歴機能を初期化中...</div>';
            return;
        }

        const history = historyManager.getHistory();

        if (history.length === 0) {
            listEl.innerHTML = '<div class="history-empty">まだ履歴がありません</div>';
            return;
        }

        listEl.innerHTML = history.map(item => {
            const modeLabel = item.mode === '4' ? '四方位' : '八方位';
            const filterLabel = item.filterMode === 'filter' ? 'フィルター' : 'HRTF';
            return `
            <div class="history-item">
                <div>
                    <div class="history-date">${historyManager.formatDate(item.playedAt)}</div>
                    <div class="history-correct">${item.correct}/${item.total} 正解</div>
                    <div class="history-mode">${modeLabel} / ${filterLabel}</div>
                </div>
                <div class="history-score">${item.score}点</div>
            </div>
        `;
        }).join('');
    }

    updateScore(score, round, max) {
        document.getElementById('score').textContent = score;
        document.getElementById('current-round').textContent = round;
        document.getElementById('max-rounds').textContent = max;
    }

    updatePlayCount(current, max) {
        document.getElementById('play-count').textContent = current;
        document.getElementById('max-play-count').textContent = max;

        const replayBtn = document.getElementById('replay-btn');
        if (current >= max) {
            replayBtn.disabled = true;
            replayBtn.textContent = '🔊 再生回数上限';
        } else {
            replayBtn.disabled = false;
            replayBtn.textContent = '🔊 もう一度再生';
        }
    }

    setFeedback(text, color = 'white') {
        const el = document.getElementById('feedback');
        el.textContent = text;
        el.style.color = color;
    }

    highlightDirections(userAnswer, correctAnswer, isCorrect) {
        // まず全てクリア
        this.clearHighlights();

        const buttons = document.querySelectorAll('.compass-btn');
        buttons.forEach(btn => {
            const dir = btn.getAttribute('data-dir');

            if (dir === correctAnswer) {
                btn.classList.add('highlight-correct');
            }

            if (dir === userAnswer && !isCorrect) {
                btn.classList.add('highlight-wrong');
            }
        });
    }

    clearHighlights() {
        const buttons = document.querySelectorAll('.compass-btn');
        buttons.forEach(btn => {
            btn.classList.remove('highlight-correct', 'highlight-wrong', 'highlight-answer');
        });

        // 再生ボタンをリセット
        const replayBtn = document.getElementById('replay-btn');
        if (replayBtn) {
            replayBtn.disabled = false;
            replayBtn.textContent = '🔊 もう一度再生';
        }
    }

    showDiagnosticsScreen() {
        // This method will be called from diagnostics button
        // Show the mode selector screen
        if (window.app && window.app.diagnosticsModeSelector) {
            window.app.diagnosticsModeSelector.show();
        }
    }

    /**
     * Yaw値を更新する
     * @param {number} yawRadians - Yaw値（ラジアン）
     */
    updateYaw(yawRadians) {
        const el = document.getElementById('yaw-value');
        if (el) {
            const yawDegrees = (yawRadians * 180 / Math.PI).toFixed(2);
            el.textContent = yawDegrees;
        }
    }
}
