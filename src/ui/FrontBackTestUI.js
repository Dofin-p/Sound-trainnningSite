export class FrontBackTestUI {
    constructor() {
        this.container = null;
        this.testManager = null;
        this.updateInterval = null;
        this.isVisible = false;
        this.isTestRunning = false;
    }

    init(container, testManager) {
        this.container = container;
        this.testManager = testManager;
    }

    show() {
        if (!this.container) return;

        this.isVisible = true;

        // Create test screen HTML
        const testHTML = `
            <div id="fbtest-screen" class="screen">
                <div id="fbtest-setup-panel" class="fbtest-panel">
                    <h2>🧪 前後検証テスト /fb-test-v2</h2>
                    <p class="fbtest-subtitle">補聴器ユーザー向け前後識別検証</p>

                    <!-- Condition Selection -->
                    <div class="fbtest-section">
                        <h3>条件を選択</h3>
                        <div class="condition-cards">
                            <div class="condition-card" data-condition="C0">
                                <input type="radio" name="condition" id="cond-c0" value="C0" checked />
                                <label for="cond-c0">
                                    <div class="condition-title">C0: Base</div>
                                    <div class="condition-desc">HRTFのみ</div>
                                    <div class="condition-details">回転: 無効</div>
                                </label>
                            </div>
                            <div class="condition-card" data-condition="C1">
                                <input type="radio" name="condition" id="cond-c1" value="C1" />
                                <label for="cond-c1">
                                    <div class="condition-title">C1: Dynamic</div>
                                    <div class="condition-desc">HRTF + 回転操作</div>
                                    <div class="condition-details">顔を振ってOK</div>
                                </label>
                            </div>
                            <div class="condition-card" data-condition="C2">
                                <input type="radio" name="condition" id="cond-c2" value="C2" />
                                <label for="cond-c2">
                                    <div class="condition-title">C2: Assisted</div>
                                    <div class="condition-desc">C1 + ピンナ補正</div>
                                    <div class="condition-details">フィルタON</div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Trial Count Selection -->
                    <div class="fbtest-section">
                        <h3>試行数を選択</h3>
                        <div class="trial-count-selector">
                            <label>
                                <input type="radio" name="trial-count" value="20" checked />
                                20試行
                            </label>
                            <label>
                                <input type="radio" name="trial-count" value="40" />
                                40試行
                            </label>
                        </div>
                    </div>

                    <!-- Volume Control -->
                    <div class="fbtest-section">
                        <h3>音量調整</h3>
                        <div class="volume-control">
                            <label for="fbtest-volume-slider">音量:</label>
                            <input type="range" id="fbtest-volume-slider" min="0" max="100" value="50" />
                            <span id="fbtest-volume-value">50%</span>
                        </div>
                    </div>

                    <!-- Start Button -->
                    <div class="fbtest-section">
                        <button id="fbtest-start-btn" class="fbtest-btn fbtest-btn-primary">テスト開始</button>
                    </div>

                    <!-- Back Button -->
                    <div class="fbtest-section">
                        <button id="fbtest-back-from-setup-btn" class="fbtest-btn fbtest-btn-secondary">← 戻る</button>
                    </div>
                </div>

                <!-- Test Running Panel -->
                <div id="fbtest-running-panel" class="fbtest-panel" style="display: none;">
                    <h2>🧪 前後検証テスト</h2>
                    
                    <!-- Progress -->
                    <div class="fbtest-progress">
                        <span id="fbtest-trial-number">1</span> / <span id="fbtest-trial-total">20</span>
                    </div>

                    <!-- Condition Display -->
                    <div class="fbtest-info">
                        条件: <span id="fbtest-current-condition">C0 (Base)</span>
                    </div>

                    <!-- Camera Yaw Debug -->
                    <div class="fbtest-debug">
                        カメラYaw: <span id="fbtest-camera-yaw">0.000</span> rad
                    </div>

                    <!-- Instructions -->
                    <div id="fbtest-instructions" class="fbtest-instructions">
                        🎧 音を聞いて方向を選択してください
                    </div>

                    <!-- Answer Buttons -->
                    <div class="fbtest-answer-buttons">
                        <button id="fbtest-answer-front" class="fbtest-btn fbtest-btn-answer">⬆ Front</button>
                        <button id="fbtest-answer-back" class="fbtest-btn fbtest-btn-answer">⬇ Back</button>
                    </div>

                    <!-- Feedback -->
                    <div id="fbtest-feedback" class="fbtest-feedback" style="display: none;"></div>
                </div>

                <!-- Results Panel -->
                <div id="fbtest-results-panel" class="fbtest-panel" style="display: none;">
                    <h2>📊 テスト結果</h2>

                    <!-- Summary -->
                    <div class="fbtest-section">
                        <div class="results-summary">
                            <div class="result-item">
                                <div class="result-label">条件</div>
                                <div class="result-value" id="fbtest-result-condition">C0 (Base)</div>
                            </div>
                            <div class="result-item">
                                <div class="result-label">試行数</div>
                                <div class="result-value" id="fbtest-result-trials">20</div>
                            </div>
                            <div class="result-item">
                                <div class="result-label">正答率</div>
                                <div class="result-value result-highlight" id="fbtest-result-accuracy">75.0%</div>
                            </div>
                            <div class="result-item">
                                <div class="result-label">平均反応時間</div>
                                <div class="result-value" id="fbtest-result-reaction">1,234 ms</div>
                            </div>
                        </div>
                    </div>

                    <!-- Confusion Matrix -->
                    <div class="fbtest-section">
                        <h3>混同行列</h3>
                        <table class="confusion-matrix">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>実際: Front</th>
                                    <th>実際: Back</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>回答: Front</strong></td>
                                    <td id="cm-front-front" class="cm-correct">0</td>
                                    <td id="cm-front-back" class="cm-wrong">0</td>
                                </tr>
                                <tr>
                                    <td><strong>回答: Back</strong></td>
                                    <td id="cm-back-front" class="cm-wrong">0</td>
                                    <td id="cm-back-back" class="cm-correct">0</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Action Buttons -->
                    <div class="fbtest-section">
                        <div class="button-group">
                            <button id="fbtest-retry-btn" class="fbtest-btn fbtest-btn-primary">もう一度</button>
                            <button id="fbtest-history-btn" class="fbtest-btn fbtest-btn-secondary">履歴を見る</button>
                            <button id="fbtest-back-from-results-btn" class="fbtest-btn fbtest-btn-secondary">← 戻る</button>
                        </div>
                    </div>
                </div>

                <!-- History Panel -->
                <div id="fbtest-history-panel" class="fbtest-panel" style="display: none;">
                    <h2>📜 履歴</h2>

                    <div id="fbtest-history-list" class="fbtest-history-list"></div>

                    <div class="fbtest-section">
                        <div class="button-group">
                            <button id="fbtest-clear-history-btn" class="fbtest-btn fbtest-btn-danger">🗑 履歴をクリア</button>
                            <button id="fbtest-back-from-history-btn" class="fbtest-btn fbtest-btn-secondary">← 戻る</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert test screen
        const existingScreen = document.getElementById('fbtest-screen');
        if (existingScreen) {
            existingScreen.remove();
        }

        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) {
            uiLayer.insertAdjacentHTML('beforeend', testHTML);
        }

        this.addStyles();
        this.bindEvents();
        this.showScreen();
    }

    hide() {
        this.isVisible = false;
        this.stopCameraYawUpdate();

        const screen = document.getElementById('fbtest-screen');
        if (screen) {
            screen.style.display = 'none';
        }
    }

    showScreen() {
        // Hide all other screens
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('result-screen').style.display = 'none';
        document.getElementById('history-screen').style.display = 'none';
        const diagScreen = document.getElementById('diagnostics-screen');
        if (diagScreen) diagScreen.style.display = 'none';
        const diagSelector = document.getElementById('diagnostics-selector-screen');
        if (diagSelector) diagSelector.style.display = 'none';

        // Show test screen
        const testScreen = document.getElementById('fbtest-screen');
        if (testScreen) {
            testScreen.style.display = 'flex';
        }
    }

    showPanel(panelId) {
        const panels = ['fbtest-setup-panel', 'fbtest-running-panel', 'fbtest-results-panel', 'fbtest-history-panel'];
        panels.forEach(id => {
            const panel = document.getElementById(id);
            if (panel) {
                panel.style.display = (id === panelId) ? 'block' : 'none';
            }
        });
    }

    addStyles() {
        if (document.getElementById('fbtest-styles')) return;

        const style = document.createElement('style');
        style.id = 'fbtest-styles';
        style.innerHTML = `
            .fbtest-panel {
                background: linear-gradient(135deg, rgba(20, 20, 40, 0.95), rgba(40, 20, 60, 0.95));
                padding: 30px;
                border-radius: 20px;
                border: 1px solid rgba(100, 200, 255, 0.3);
                box-shadow: 0 0 40px rgba(100, 200, 255, 0.2);
                max-width: 900px;
                width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                color: white;
            }

            .fbtest-panel h2 {
                text-align: center;
                font-size: 1.8rem;
                margin-bottom: 10px;
                background: linear-gradient(90deg, #00ffff, #ff00ff);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .fbtest-subtitle {
                text-align: center;
                color: #aaa;
                margin-bottom: 30px;
            }

            .fbtest-section {
                margin-bottom: 25px;
                padding: 15px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .fbtest-section h3 {
                font-size: 1.2rem;
                color: #00ccff;
                margin-bottom: 15px;
            }

            .condition-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }

            .condition-card {
                position: relative;
            }

            .condition-card input[type="radio"] {
                position: absolute;
                opacity: 0;
            }

            .condition-card label {
                display: block;
                padding: 20px;
                background: rgba(0, 0, 0, 0.3);
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s;
                text-align: center;
            }

            .condition-card input[type="radio"]:checked + label {
                background: rgba(0, 200, 255, 0.2);
                border-color: #00ccff;
                box-shadow: 0 0 15px rgba(0, 200, 255, 0.3);
            }

            .condition-card label:hover {
                border-color: rgba(0, 200, 255, 0.5);
            }

            .condition-title {
                font-size: 1.2rem;
                font-weight: bold;
                color: #00ffff;
                margin-bottom: 5px;
            }

            .condition-desc {
                color: #ccc;
                margin-bottom: 10px;
            }

            .condition-details {
                color: #888;
                font-size: 0.9rem;
            }

            .trial-count-selector {
                display: flex;
                gap: 20px;
                justify-content: center;
            }

            .trial-count-selector label {
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
                font-size: 1.1rem;
            }

            .trial-count-selector input[type="radio"] {
                width: 20px;
                height: 20px;
                cursor: pointer;
            }

            .fbtest-btn {
                padding: 15px 30px;
                font-size: 1.1rem;
                font-weight: bold;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s;
                color: white;
                width: 100%;
                max-width: 300px;
                margin: 0 auto;
                display: block;
            }

            .fbtest-btn-primary {
                background: linear-gradient(135deg, #00cc00, #00ff00);
            }

            .fbtest-btn-primary:hover {
                transform: scale(1.05);
                box-shadow: 0 0 25px rgba(0, 255, 0, 0.5);
            }

            .fbtest-btn-secondary {
                background: rgba(100, 100, 100, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.3);
            }

            .fbtest-btn-secondary:hover {
                background: rgba(100, 100, 100, 0.7);
            }

            .fbtest-btn-danger {
                background: linear-gradient(135deg, #cc0000, #ff3333);
            }

            .fbtest-btn-danger:hover {
                transform: scale(1.05);
                box-shadow: 0 0 25px rgba(255, 50, 50, 0.5);
            }

            .fbtest-btn-answer {
                background: linear-gradient(135deg, #0066ff, #00ccff);
                flex: 1;
                min-width: 150px;
                max-width: none;
            }

            .fbtest-btn-answer:hover {
                transform: scale(1.05);
                box-shadow: 0 0 25px rgba(0, 200, 255, 0.5);
            }

            .fbtest-progress {
                text-align: center;
                font-size: 1.5rem;
                font-weight: bold;
                color: #00ffff;
                margin-bottom: 15px;
            }

            .fbtest-info {
                text-align: center;
                font-size: 1.1rem;
                color: #ccc;
                margin-bottom: 10px;
            }

            .fbtest-debug {
                text-align: center;
                font-size: 0.9rem;
                color: #888;
                margin-bottom: 20px;
                font-family: monospace;
            }

            .fbtest-instructions {
                text-align: center;
                font-size: 1.3rem;
                padding: 20px;
                background: rgba(0, 200, 255, 0.1);
                border-radius: 10px;
                margin-bottom: 20px;
                color: #00ffff;
            }

            .fbtest-answer-buttons {
                display: flex;
                gap: 20px;
                justify-content: center;
                margin: 20px 0;
            }

            .fbtest-feedback {
                text-align: center;
                font-size: 1.2rem;
                padding: 15px;
                border-radius: 10px;
                margin-top: 20px;
                font-weight: bold;
            }

            .fbtest-feedback.correct {
                background: rgba(0, 255, 0, 0.2);
                color: #00ff00;
            }

            .fbtest-feedback.wrong {
                background: rgba(255, 0, 0, 0.2);
                color: #ff6666;
            }

            .results-summary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }

            .result-item {
                text-align: center;
                padding: 15px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
            }

            .result-label {
                color: #888;
                font-size: 0.9rem;
                margin-bottom: 5px;
            }

            .result-value {
                color: white;
                font-size: 1.3rem;
                font-weight: bold;
            }

            .result-highlight {
                color: #00ff00;
                font-size: 2rem;
            }

            .confusion-matrix {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }

            .confusion-matrix th,
            .confusion-matrix td {
                padding: 15px;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .confusion-matrix th {
                background: rgba(0, 200, 255, 0.2);
                color: #00ffff;
                font-weight: bold;
            }

            .cm-correct {
                background: rgba(0, 255, 0, 0.1);
                color: #00ff00;
                font-weight: bold;
                font-size: 1.3rem;
            }

            .cm-wrong {
                background: rgba(255, 0, 0, 0.1);
                color: #ff6666;
                font-size: 1.1rem;
            }

            .button-group {
                display: flex;
                gap: 15px;
                flex-wrap: wrap;
                justify-content: center;
            }

            .button-group .fbtest-btn {
                flex: 1;
                min-width: 150px;
            }

            .fbtest-history-list {
                max-height: 500px;
                overflow-y: auto;
            }

            .history-entry {
                background: rgba(0, 0, 0, 0.3);
                padding: 15px;
                margin: 10px 0;
                border-radius: 10px;
                border-left: 4px solid #00ccff;
            }

            .history-date {
                color: #888;
                font-size: 0.9rem;
                margin-bottom: 10px;
            }

            .history-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 10px;
                color: #ccc;
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        // Volume slider
        const volumeSlider = document.getElementById('fbtest-volume-slider');
        const volumeValue = document.getElementById('fbtest-volume-value');
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.testManager.setMasterVolume(volume);
            volumeValue.textContent = `${e.target.value}%`;
        });

        // Start button
        document.getElementById('fbtest-start-btn').addEventListener('click', async () => {
            await this.startTest();
        });

        // Answer buttons
        document.getElementById('fbtest-answer-front').addEventListener('click', () => {
            this.submitAnswer('front');
        });

        document.getElementById('fbtest-answer-back').addEventListener('click', () => {
            this.submitAnswer('back');
        });

        // Retry button
        document.getElementById('fbtest-retry-btn').addEventListener('click', () => {
            this.showPanel('fbtest-setup-panel');
        });

        // History button
        document.getElementById('fbtest-history-btn').addEventListener('click', () => {
            this.showHistoryPanel();
        });

        // Back buttons
        document.getElementById('fbtest-back-from-setup-btn').addEventListener('click', () => {
            this.hide();
            document.getElementById('start-screen').style.display = 'flex';
        });

        document.getElementById('fbtest-back-from-results-btn').addEventListener('click', () => {
            this.showPanel('fbtest-setup-panel');
        });

        document.getElementById('fbtest-back-from-history-btn').addEventListener('click', () => {
            this.showPanel('fbtest-results-panel');
        });

        // Clear history button
        document.getElementById('fbtest-clear-history-btn').addEventListener('click', () => {
            if (confirm('履歴をすべてクリアしますか？')) {
                this.testManager.clearHistory();
                this.showHistoryPanel();
            }
        });
    }

    async startTest() {
        // Get selected condition
        const conditionRadio = document.querySelector('input[name="condition"]:checked');
        const condition = conditionRadio ? conditionRadio.value : 'C0';
        this.testManager.setCondition(condition);

        // Get selected trial count
        const trialCountRadio = document.querySelector('input[name="trial-count"]:checked');
        const trialCount = trialCountRadio ? parseInt(trialCountRadio.value) : 20;
        this.testManager.setTrialCount(trialCount);

        // Start test
        this.testManager.startTest();
        this.isTestRunning = true;

        // Show running panel
        this.showPanel('fbtest-running-panel');

        // Update UI
        document.getElementById('fbtest-trial-total').textContent = trialCount;
        document.getElementById('fbtest-current-condition').textContent = this.getConditionLabel(condition);

        // Start camera yaw update
        this.startCameraYawUpdate();

        // Play first trial
        await this.playNextTrial();
    }

    async playNextTrial() {
        if (this.testManager.currentTrial >= this.testManager.trials.length) {
            this.completeTest();
            return;
        }

        // Update progress
        document.getElementById('fbtest-trial-number').textContent = this.testManager.currentTrial + 1;

        // Hide feedback
        const feedback = document.getElementById('fbtest-feedback');
        feedback.style.display = 'none';

        // Enable answer buttons
        document.getElementById('fbtest-answer-front').disabled = false;
        document.getElementById('fbtest-answer-back').disabled = false;

        // Update instructions based on condition
        const instructions = document.getElementById('fbtest-instructions');
        if (this.testManager.condition === 'C1' || this.testManager.condition === 'C2') {
            instructions.textContent = '🎧 音を聞いて方向を選択してください（顔を左右に振ってもOK）';
        } else {
            instructions.textContent = '🎧 音を聞いて方向を選択してください';
        }

        // Play trial
        await this.testManager.playTrial(this.testManager.currentTrial);
    }

    async submitAnswer(answer) {
        // Disable buttons
        document.getElementById('fbtest-answer-front').disabled = true;
        document.getElementById('fbtest-answer-back').disabled = true;

        // Submit answer
        const isCorrect = this.testManager.submitAnswer(answer);

        // Show feedback
        const feedback = document.getElementById('fbtest-feedback');
        feedback.style.display = 'block';
        feedback.className = 'fbtest-feedback ' + (isCorrect ? 'correct' : 'wrong');
        feedback.textContent = isCorrect ? '✓ 正解！' : '✗ 不正解';

        // Wait 600ms before next trial
        await new Promise(resolve => setTimeout(resolve, 600));

        // Move to next trial
        this.testManager.currentTrial++;
        await this.playNextTrial();
    }

    completeTest() {
        this.isTestRunning = false;
        this.stopCameraYawUpdate();

        // Save to localStorage
        this.testManager.saveToLocalStorage();

        // Show results
        this.showResultsPanel();
    }

    showResultsPanel() {
        const results = this.testManager.getResults();

        // Update summary
        document.getElementById('fbtest-result-condition').textContent = this.getConditionLabel(this.testManager.condition);
        document.getElementById('fbtest-result-trials').textContent = results.totalTrials;
        document.getElementById('fbtest-result-accuracy').textContent = `${(results.correctRate * 100).toFixed(1)}%`;
        document.getElementById('fbtest-result-reaction').textContent = results.avgReactionMs.toLocaleString() + ' ms';

        // Update confusion matrix
        const cm = results.confusionMatrix;
        document.getElementById('cm-front-front').textContent = cm.frontCorrect;
        document.getElementById('cm-front-back').textContent = cm.frontWrong;
        document.getElementById('cm-back-front').textContent = cm.backWrong;
        document.getElementById('cm-back-back').textContent = cm.backCorrect;

        // Show panel
        this.showPanel('fbtest-results-panel');
    }

    showHistoryPanel() {
        const history = this.testManager.getHistory();
        const historyList = document.getElementById('fbtest-history-list');

        if (history.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">履歴がありません</p>';
        } else {
            historyList.innerHTML = history.slice().reverse().map(session => `
                <div class="history-entry">
                    <div class="history-date">${new Date(session.playedAt).toLocaleString('ja-JP')}</div>
                    <div class="history-stats">
                        <div>条件: ${this.getConditionLabel(session.condition)}</div>
                        <div>試行数: ${session.totalTrials}</div>
                        <div>正答率: ${(session.results.correctRate * 100).toFixed(1)}%</div>
                        <div>平均反応: ${session.results.avgReactionMs}ms</div>
                    </div>
                </div>
            `).join('');
        }

        this.showPanel('fbtest-history-panel');
    }

    getConditionLabel(condition) {
        const labels = {
            'C0': 'C0 (Base)',
            'C1': 'C1 (Dynamic)',
            'C2': 'C2 (Assisted)'
        };
        return labels[condition] || condition;
    }

    startCameraYawUpdate() {
        this.stopCameraYawUpdate();

        const update = () => {
            if (!this.isTestRunning) return;

            const yaw = this.testManager.sceneManager ? this.testManager.sceneManager.getCameraYaw() : 0;
            const yawDisplay = document.getElementById('fbtest-camera-yaw');
            if (yawDisplay) {
                yawDisplay.textContent = yaw.toFixed(3);
            }

            // Update AudioListener
            this.testManager.updateAudioListener();

            this.updateInterval = requestAnimationFrame(update);
        };

        update();
    }

    stopCameraYawUpdate() {
        if (this.updateInterval) {
            cancelAnimationFrame(this.updateInterval);
            this.updateInterval = null;
        }
    }
}
