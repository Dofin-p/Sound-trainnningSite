export class DiagnosticsUI {
    constructor() {
        this.container = null;
        this.diagnosticsManager = null;
        this.updateInterval = null;
        this.isVisible = false;
    }

    init(container, diagnosticsManager) {
        this.container = container;
        this.diagnosticsManager = diagnosticsManager;
    }

    show(mode = '2D') {
        if (!this.container) return;

        this.isVisible = true;

        // Store current mode
        const currentMode = mode;

        // Generate test buttons based on mode
        let testButtonsHTML = '';
        if (mode === '4D') {
            testButtonsHTML = `
                <button id="diag-test-front" class="diag-btn diag-btn-test">⬆ 前のみテスト</button>
                <button id="diag-test-back" class="diag-btn diag-btn-test">⬇ 後のみテスト</button>
            </div>
            <div class="button-group">
                <button id="diag-test-left" class="diag-btn diag-btn-test">◀ 左のみテスト</button>
                <button id="diag-test-right" class="diag-btn diag-btn-test">▶ 右のみテスト</button>
            </div>
            <div class="button-group">
                <button id="diag-test-alternating-4d" class="diag-btn diag-btn-test">🔄 4方位交互テスト</button>
            `;
        } else {
            // 2D mode
            testButtonsHTML = `
                <button id="diag-test-left" class="diag-btn diag-btn-test">◀ 左のみテスト</button>
                <button id="diag-test-right" class="diag-btn diag-btn-test">▶ 右のみテスト</button>
                <button id="diag-test-alternating" class="diag-btn diag-btn-test">↔ 左右交互テスト</button>
            `;
        }

        // Create diagnostics screen HTML
        const diagnosticsHTML = `
            <div id="diagnostics-screen" class="screen">
                <div class="diagnostics-panel">
                    <h2>🔧 Audio診断モード (${mode === '4D' ? '4方位・3D音響' : '2方位・ステレオ'})</h2>
                    
                    <!-- Audio Context Status -->
                    <div class="diagnostics-section">
                        <h3>システム状態</h3>
                        <div class="status-row">
                            <span>AudioContext:</span>
                            <span id="audio-state" class="status-value">未初期化</span>
                        </div>
                        <div class="status-row">
                            <span>モード:</span>
                            <span id="mode-display" class="status-value">${mode === '4D' ? 'HRTF 3D音響' : 'ステレオ 2D'}</span>
                        </div>
                    </div>

                    <!-- RMS Display -->
                    <div class="diagnostics-section">
                        <h3>チャンネル出力レベル (RMS)</h3>
                        <div class="rms-container">
                            <div class="rms-channel">
                                <div class="rms-label">Left (左)</div>
                                <div class="rms-bar-container">
                                    <div id="left-rms-bar" class="rms-bar" style="width: 0%;"></div>
                                </div>
                                <div id="left-rms-value" class="rms-value">0.000</div>
                            </div>
                            <div class="rms-channel">
                                <div class="rms-label">Right (右)</div>
                                <div class="rms-bar-container">
                                    <div id="right-rms-bar" class="rms-bar" style="width: 0%;"></div>
                                </div>
                                <div id="right-rms-value" class="rms-value">0.000</div>
                            </div>
                        </div>
                    </div>

                    <!-- Volume Control -->
                    <div class="diagnostics-section">
                        <h3>音量調整</h3>
                        <div class="volume-control">
                            <label for="volume-slider">音量:</label>
                            <input type="range" id="volume-slider" min="0" max="100" value="50" />
                            <span id="volume-value">50%</span>
                        </div>
                    </div>

                    <!-- Test Controls -->
                    <div class="diagnostics-section">
                        <h3>テストコントロール</h3>
                        <div id="test-status" class="test-status">テスト待機中...</div>
                        <div class="button-group">
                            <button id="diag-resume-btn" class="diag-btn diag-btn-primary">🔊 Audioを有効化</button>
                        </div>
                        <div class="button-group">
                            ${testButtonsHTML}
                        </div>
                        <div class="button-group">
                            <button id="diag-stop-btn" class="diag-btn diag-btn-danger">⏹ 停止</button>
                        </div>
                    </div>

                    <!-- User Feedback -->
                    <div class="diagnostics-section">
                        <h3>あなたの聴覚判定</h3>
                        <p class="feedback-instruction">音が聞こえた方向を選択してください：</p>
                        <div class="button-group">
                            ${mode === '4D' ? `
                                <button id="diag-heard-front" class="diag-btn diag-btn-feedback">👂 前が聞こえた</button>
                                <button id="diag-heard-back" class="diag-btn diag-btn-feedback">👂 後が聞こえた</button>
                            </div>
                            <div class="button-group">
                            ` : ''}
                            <button id="diag-heard-left" class="diag-btn diag-btn-feedback">👂 左が聞こえた</button>
                            <button id="diag-heard-right" class="diag-btn diag-btn-feedback">👂 右が聞こえた</button>
                            ${mode === '2D' ? '<button id="diag-heard-both" class="diag-btn diag-btn-feedback">👂 両方聞こえた</button>' : ''}
                        </div>
                    </div>

                    <!-- Warnings -->
                    <div class="diagnostics-section diagnostics-warnings">
                        <h3>⚠ 注意事項</h3>
                        <ul>
                            <li>🎧 <strong>ヘッドフォン必須</strong>（${mode === '4D' ? '特に4方位テストでは必須' : '有線推奨、Bluetoothは遅延や処理で左右感が崩れる場合があります'}）</li>
                            ${mode === '4D' ? '<li>📐 <strong>前後の識別は個人差があります</strong>（HRTFの限界による）</li>' : ''}
                            <li>📱 スマートフォンのモノラル設定やOSのアクセシビリティ設定で左右が潰れることがあります</li>
                            <li>🔇 ブラウザがミュートされていないか、システム音量が0でないか確認してください</li>
                            <li>🌐 推奨ブラウザ: Chrome, Edge（Web Audio APIのサポートが最も安定）</li>
                        </ul>
                    </div>

                    <!-- Diagnostic Logs -->
                    <div class="diagnostics-section">
                        <h3>診断ログ履歴</h3>
                        <div id="diagnostics-logs" class="diagnostics-logs"></div>
                        <div class="button-group">
                            <button id="diag-clear-logs" class="diag-btn diag-btn-secondary">🗑 ログをクリア</button>
                        </div>
                    </div>

                    <!-- Back Button -->
                    <div class="button-group">
                        <button id="diag-back-btn" class="diag-btn diag-btn-secondary">← スタートへ戻る</button>
                    </div>
                </div>
            </div>
        `;

        // Insert diagnostics screen (if not already exists)
        const existingScreen = document.getElementById('diagnostics-screen');
        if (existingScreen) {
            existingScreen.remove();
        }

        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) {
            uiLayer.insertAdjacentHTML('beforeend', diagnosticsHTML);
        }

        this.addStyles();
        this.bindEvents(mode);
        this.updateDisplay();
        this.startRMSUpdate();

        // Show diagnostics screen
        this.showScreen();
    }

    hide() {
        this.isVisible = false;
        this.stopRMSUpdate();

        const screen = document.getElementById('diagnostics-screen');
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

        // Show diagnostics screen
        const diagScreen = document.getElementById('diagnostics-screen');
        if (diagScreen) {
            diagScreen.style.display = 'flex';
        }
    }

    addStyles() {
        // Check if styles already added
        if (document.getElementById('diagnostics-styles')) return;

        const style = document.createElement('style');
        style.id = 'diagnostics-styles';
        style.innerHTML = `
            .diagnostics-panel {
                background: linear-gradient(135deg, rgba(20, 20, 40, 0.95), rgba(40, 20, 60, 0.95));
                padding: 30px;
                border-radius: 20px;
                border: 1px solid rgba(100, 200, 255, 0.3);
                box-shadow: 0 0 40px rgba(100, 200, 255, 0.2);
                max-width: 800px;
                width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                color: white;
            }

            .diagnostics-panel h2 {
                text-align: center;
                font-size: 1.8rem;
                margin-bottom: 20px;
                background: linear-gradient(90deg, #00ffff, #ff00ff);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .diagnostics-panel h3 {
                font-size: 1.2rem;
                margin-bottom: 10px;
                color: #00ccff;
            }

            .diagnostics-section {
                margin-bottom: 25px;
                padding: 15px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .diagnostics-warnings {
                background: rgba(255, 200, 0, 0.1);
                border-color: rgba(255, 200, 0, 0.3);
            }

            .diagnostics-warnings ul {
                margin: 10px 0;
                padding-left: 20px;
                color: #ffcc00;
            }

            .diagnostics-warnings li {
                margin: 8px 0;
                line-height: 1.5;
            }

            .status-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 5px;
                margin: 5px 0;
            }

            .status-value {
                font-weight: bold;
                padding: 5px 15px;
                border-radius: 5px;
                background: rgba(0, 200, 255, 0.2);
                color: #00ffff;
            }

            .rms-container {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .rms-channel {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .rms-label {
                min-width: 80px;
                font-weight: bold;
                color: #aaa;
            }

            .rms-bar-container {
                flex: 1;
                height: 30px;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 5px;
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .rms-bar {
                height: 100%;
                background: linear-gradient(90deg, #00ff00, #ffff00, #ff0000);
                transition: width 0.1s ease-out;
            }

            .rms-value {
                min-width: 60px;
                text-align: right;
                font-family: monospace;
                font-size: 1.1rem;
                color: #00ff00;
            }

            .volume-control {
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .volume-control label {
                min-width: 60px;
                color: #aaa;
            }

            .volume-control input[type="range"] {
                flex: 1;
                height: 8px;
                border-radius: 5px;
                background: rgba(255, 255, 255, 0.2);
                outline: none;
                -webkit-appearance: none;
            }

            .volume-control input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #00ccff;
                cursor: pointer;
            }

            .volume-control input[type="range"]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #00ccff;
                cursor: pointer;
                border: none;
            }

            #volume-value {
                min-width: 50px;
                text-align: right;
                font-weight: bold;
                color: #00ccff;
            }

            .test-status {
                text-align: center;
                padding: 15px;
                margin-bottom: 15px;
                background: rgba(0, 200, 255, 0.1);
                border-radius: 8px;
                font-size: 1.1rem;
                font-weight: bold;
                color: #00ffff;
            }

            .button-group {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                justify-content: center;
                margin: 10px 0;
            }

            .diag-btn {
                padding: 12px 24px;
                font-size: 1rem;
                cursor: pointer;
                border: none;
                border-radius: 8px;
                color: white;
                font-weight: bold;
                transition: all 0.3s;
                flex: 1;
                min-width: 150px;
            }

            .diag-btn-primary {
                background: linear-gradient(135deg, #00cc00, #00ff00);
            }

            .diag-btn-primary:hover {
                transform: scale(1.05);
                box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
            }

            .diag-btn-test {
                background: linear-gradient(135deg, #0066ff, #00ccff);
            }

            .diag-btn-test:hover {
                transform: scale(1.05);
                box-shadow: 0 0 20px rgba(0, 200, 255, 0.5);
            }

            .diag-btn-danger {
                background: linear-gradient(135deg, #cc0000, #ff3333);
            }

            .diag-btn-danger:hover {
                transform: scale(1.05);
                box-shadow: 0 0 20px rgba(255, 50, 50, 0.5);
            }

            .diag-btn-feedback {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
            }

            .diag-btn-feedback:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .diag-btn-secondary {
                background: rgba(100, 100, 100, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.3);
            }

            .diag-btn-secondary:hover {
                background: rgba(100, 100, 100, 0.7);
            }

            .feedback-instruction {
                color: #ccc;
                margin-bottom: 10px;
                text-align: center;
            }

            .diagnostics-logs {
                max-height: 200px;
                overflow-y: auto;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                padding: 10px;
                margin-bottom: 10px;
            }

            .log-entry {
                padding: 8px;
                margin: 5px 0;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 5px;
                font-size: 0.9rem;
                border-left: 3px solid #00ccff;
            }

            .log-empty {
                text-align: center;
                color: #666;
                padding: 20px;
            }

            .log-timestamp {
                color: #888;
                font-size: 0.85rem;
            }

            .log-details {
                margin-top: 5px;
                color: #ccc;
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents(mode = '2D') {
        // Resume button
        document.getElementById('diag-resume-btn').addEventListener('click', async () => {
            await this.diagnosticsManager.resume();
            this.updateDisplay();
        });

        // Test buttons based on mode
        if (mode === '4D') {
            // 4D test buttons
            const frontBtn = document.getElementById('diag-test-front');
            if (frontBtn) {
                frontBtn.addEventListener('click', () => {
                    this.diagnosticsManager.startTest('front');
                    this.updateTestStatus('front');
                });
            }

            const backBtn = document.getElementById('diag-test-back');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    this.diagnosticsManager.startTest('back');
                    this.updateTestStatus('back');
                });
            }

            const alternating4DBtn = document.getElementById('diag-test-alternating-4d');
            if (alternating4DBtn) {
                alternating4DBtn.addEventListener('click', () => {
                    this.diagnosticsManager.startTest('alternating-4d');
                    this.updateTestStatus('alternating-4d');
                });
            }
        } else {
            // 2D test alternating button
            const alternatingBtn = document.getElementById('diag-test-alternating');
            if (alternatingBtn) {
                alternatingBtn.addEventListener('click', () => {
                    this.diagnosticsManager.startTest('alternating');
                    this.updateTestStatus('alternating');
                });
            }
        }

        // Common test buttons (left/right exist in both modes)
        const leftBtn = document.getElementById('diag-test-left');
        if (leftBtn) {
            leftBtn.addEventListener('click', () => {
                this.diagnosticsManager.startTest('left');
                this.updateTestStatus('left');
            });
        }

        const rightBtn = document.getElementById('diag-test-right');
        if (rightBtn) {
            rightBtn.addEventListener('click', () => {
                this.diagnosticsManager.startTest('right');
                this.updateTestStatus('right');
            });
        }

        // Stop button
        document.getElementById('diag-stop-btn').addEventListener('click', () => {
            this.diagnosticsManager.stopTest();
            this.updateTestStatus(null);
        });

        // Volume slider
        const volumeSlider = document.getElementById('volume-slider');
        const volumeValue = document.getElementById('volume-value');

        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.diagnosticsManager.setVolume(volume);
            volumeValue.textContent = `${e.target.value}%`;
        });

        // User feedback buttons
        if (mode === '4D') {
            const frontHeardBtn = document.getElementById('diag-heard-front');
            if (frontHeardBtn) {
                frontHeardBtn.addEventListener('click', () => {
                    this.recordUserFeedback(false, false, true, false);
                });
            }

            const backHeardBtn = document.getElementById('diag-heard-back');
            if (backHeardBtn) {
                backHeardBtn.addEventListener('click', () => {
                    this.recordUserFeedback(false, false, false, true);
                });
            }
        }

        // Left/Right feedback (common)
        document.getElementById('diag-heard-left').addEventListener('click', () => {
            this.recordUserFeedback(true, false);
        });

        document.getElementById('diag-heard-right').addEventListener('click', () => {
            this.recordUserFeedback(false, true);
        });

        if (mode === '2D') {
            const bothBtn = document.getElementById('diag-heard-both');
            if (bothBtn) {
                bothBtn.addEventListener('click', () => {
                    this.recordUserFeedback(true, true);
                });
            }
        }

        // Clear logs button
        document.getElementById('diag-clear-logs').addEventListener('click', () => {
            if (confirm('診断ログをすべてクリアしますか？')) {
                this.diagnosticsManager.clearLogs();
                this.updateLogsDisplay();
            }
        });

        // Back button
        document.getElementById('diag-back-btn').addEventListener('click', () => {
            this.diagnosticsManager.stopTest();
            this.hide();
            document.getElementById('start-screen').style.display = 'flex';
        });
    }

    startRMSUpdate() {
        this.stopRMSUpdate();

        const updateRMS = () => {
            if (!this.isVisible) return;

            const leftRMS = this.diagnosticsManager.getLeftRMS();
            const rightRMS = this.diagnosticsManager.getRightRMS();

            this.updateRMS(leftRMS, rightRMS);
            this.updateAudioState();

            this.updateInterval = requestAnimationFrame(updateRMS);
        };

        updateRMS();
    }

    stopRMSUpdate() {
        if (this.updateInterval) {
            cancelAnimationFrame(this.updateInterval);
            this.updateInterval = null;
        }
    }

    updateRMS(leftRMS, rightRMS) {
        // Update left channel
        const leftBar = document.getElementById('left-rms-bar');
        const leftValue = document.getElementById('left-rms-value');

        if (leftBar && leftValue) {
            const leftPercent = Math.min(100, leftRMS * 100);
            leftBar.style.width = `${leftPercent}%`;
            leftValue.textContent = leftRMS.toFixed(3);
        }

        // Update right channel
        const rightBar = document.getElementById('right-rms-bar');
        const rightValue = document.getElementById('right-rms-value');

        if (rightBar && rightValue) {
            const rightPercent = Math.min(100, rightRMS * 100);
            rightBar.style.width = `${rightPercent}%`;
            rightValue.textContent = rightRMS.toFixed(3);
        }
    }

    updateAudioState() {
        const stateEl = document.getElementById('audio-state');
        if (!stateEl) return;

        const state = this.diagnosticsManager.getAudioContextState();

        let displayText = '';
        let color = '';

        switch (state) {
            case 'running':
                displayText = '✅ Running';
                color = '#00ff00';
                break;
            case 'suspended':
                displayText = '⏸ Suspended';
                color = '#ffcc00';
                break;
            case 'closed':
                displayText = '❌ Closed';
                color = '#ff4444';
                break;
            default:
                displayText = '⚠ 未初期化';
                color = '#888';
        }

        stateEl.textContent = displayText;
        stateEl.style.color = color;
    }

    updateTestStatus(mode) {
        const statusEl = document.getElementById('test-status');
        if (!statusEl) return;

        let statusText = '';

        switch (mode) {
            case 'front':
                statusText = '⬆ 前のみ再生中...';
                break;
            case 'back':
                statusText = '⬇ 後のみ再生中...';
                break;
            case 'left':
                statusText = '◀ 左のみ再生中...';
                break;
            case 'right':
                statusText = '▶ 右のみ再生中...';
                break;
            case 'alternating':
                statusText = '↔ 左右交互再生中...';
                break;
            case 'alternating-4d':
                statusText = '🔄 4方位交互再生中...';
                break;
            default:
                statusText = 'テスト待機中...';
        }

        statusEl.textContent = statusText;
    }

    updateDisplay() {
        this.updateAudioState();
        this.updateLogsDisplay();
    }

    updateLogsDisplay() {
        const logsEl = document.getElementById('diagnostics-logs');
        if (!logsEl) return;

        const logs = this.diagnosticsManager.getLogs();

        if (logs.length === 0) {
            logsEl.innerHTML = '<div class="log-empty">診断ログがありません</div>';
            return;
        }

        // Show last 10 logs (newest first)
        const recentLogs = logs.slice(-10).reverse();

        logsEl.innerHTML = recentLogs.map(log => `
            <div class="log-entry">
                <div class="log-timestamp">${this.diagnosticsManager.formatTimestamp(log.timestamp)}</div>
                <div class="log-details">
                    <strong>モード:</strong> ${this.getModeLabel(log.mode)} | 
                    <strong>L:</strong> ${log.leftRMS.toFixed(3)} | 
                    <strong>R:</strong> ${log.rightRMS.toFixed(3)} | 
                    <strong>音量:</strong> ${(log.volume * 100).toFixed(0)}%
                    ${log.userHeardLeft || log.userHeardRight ?
                `<br/><strong>判定:</strong> ${log.userHeardLeft ? '左' : ''}${log.userHeardLeft && log.userHeardRight ? '・' : ''}${log.userHeardRight ? '右' : ''}`
                : ''}
                </div>
            </div>
        `).join('');
    }

    getModeLabel(mode) {
        const labels = {
            'front': '前のみ',
            'back': '後のみ',
            'left': '左のみ',
            'right': '右のみ',
            'alternating': '左右交互',
            'alternating-4d': '4方位交互'
        };
        return labels[mode] || mode;
    }

    recordUserFeedback(heardLeft, heardRight) {
        const logEntry = {
            mode: this.diagnosticsManager.currentMode || 'unknown',
            leftRMS: this.diagnosticsManager.getLeftRMS(),
            rightRMS: this.diagnosticsManager.getRightRMS(),
            volume: this.diagnosticsManager.gainNode ? this.diagnosticsManager.gainNode.gain.value : 0,
            userHeardLeft: heardLeft,
            userHeardRight: heardRight
        };

        this.diagnosticsManager.saveLog(logEntry);
        this.updateLogsDisplay();

        // Show confirmation
        const statusEl = document.getElementById('test-status');
        if (statusEl) {
            const originalText = statusEl.textContent;
            statusEl.textContent = '✅ フィードバックを記録しました！';
            statusEl.style.color = '#00ff00';

            setTimeout(() => {
                this.updateTestStatus(this.diagnosticsManager.currentMode);
                statusEl.style.color = '#00ffff';
            }, 2000);
        }
    }
}
