export class DiagnosticsModeSelector {
    constructor() {
        this.container = null;
        this.diagnosticsManager = null;
        this.diagnosticsUI = null;
    }

    init(container, diagnosticsManager, diagnosticsUI) {
        this.container = container;
        this.diagnosticsManager = diagnosticsManager;
        this.diagnosticsUI = diagnosticsUI;
    }

    show() {
        if (!this.container) return;

        // Create mode selector screen HTML
        const selectorHTML = `
            <div id="diagnostics-selector-screen" class="screen">
                <div class="diagnostics-selector-panel">
                    <h2>🔧 Audio診断モード選択</h2>
                    <p class="selector-subtitle">📊 テストモードを選択してください</p>

                    <!-- Mode Options -->
                    <div class="mode-options">
                        <!-- 2D Stereo Mode -->
                        <div class="mode-card" id="mode-2d-card">
                            <div class="mode-icon">◀▶</div>
                            <h3 class="mode-title">2方位テスト</h3>
                            <p class="mode-subtitle">(左右ステレオ)</p>
                            <ul class="mode-features">
                                <li>✓ StereoPannerNode使用</li>
                                <li>✓ 基本的な左右確認</li>
                                <li>✓ 明確な音の違い</li>
                                <li>✓ 初心者向け</li>
                            </ul>
                            <button id="select-2d-btn" class="mode-btn mode-btn-2d">2方位テストを開始</button>
                        </div>

                        <!-- 4D Spatial Mode -->
                        <div class="mode-card" id="mode-4d-card">
                            <div class="mode-icon">⬆⬇◀▶</div>
                            <h3 class="mode-title">4方位テスト</h3>
                            <p class="mode-subtitle">(3D音響: 前後左右)</p>
                            <ul class="mode-features">
                                <li>✓ PannerNode + HRTF使用</li>
                                <li>✓ 空間オーディオ確認</li>
                                <li>✓ 前後左右の識別</li>
                                <li>✓ 上級者向け</li>
                            </ul>
                            <button id="select-4d-btn" class="mode-btn mode-btn-4d">4方位テストを開始</button>
                        </div>

                        <!-- Front/Back Test Mode -->
                        <div class="mode-card" id="mode-fbtest-card">
                            <div class="mode-icon">🧪</div>
                            <h3 class="mode-title">前後検証テスト</h3>
                            <p class="mode-subtitle">(/fb-test-v2)</p>
                            <ul class="mode-features">
                                <li>✓ 補聴器ユーザー向け</li>
                                <li>✓ 3条件で検証</li>
                                <li>✓ 混同行列表示</li>
                                <li>✓ 研究目的</li>
                            </ul>
                            <button id="select-fbtest-btn" class="mode-btn mode-btn-fbtest">前後検証テストを開始</button>
                        </div>
                    </div>

                    <!-- Info Section -->
                    <div class="selector-info">
                        <h4>💡 選択のヒント</h4>
                        <p><strong>初めての方:</strong> まず<strong>2方位テスト</strong>で左右の音が正しく聞こえるか確認してください。</p>
                        <p><strong>3Dゲーム前:</strong> <strong>4方位テスト</strong>で前後左右の空間音響が機能するか確認できます。</p>
                    </div>

                    <!-- Technical Note -->
                    <div class="selector-note">
                        <h4>⚠ 注意事項</h4>
                        <ul>
                            <li>🎧 <strong>ヘッドフォン必須</strong>（特に4方位テストでは必須）</li>
                            <li>📱 前後の識別は個人差があります（HRTFの限界）</li>
                            <li>🔊 静かな環境でテストしてください</li>
                        </ul>
                    </div>

                    <!-- Back Button -->
                    <div class="selector-buttons">
                        <button id="selector-back-btn" class="diag-btn diag-btn-secondary">← スタートへ戻る</button>
                    </div>
                </div>
            </div>
        `;

        // Insert selector screen (if not already exists)
        const existingScreen = document.getElementById('diagnostics-selector-screen');
        if (existingScreen) {
            existingScreen.remove();
        }

        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) {
            uiLayer.insertAdjacentHTML('beforeend', selectorHTML);
        }

        this.addStyles();
        this.bindEvents();
        this.showScreen();
    }

    hide() {
        const screen = document.getElementById('diagnostics-selector-screen');
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

        // Hide diagnostics screen if visible
        const diagScreen = document.getElementById('diagnostics-screen');
        if (diagScreen) {
            diagScreen.style.display = 'none';
        }

        // Show selector screen
        const selectorScreen = document.getElementById('diagnostics-selector-screen');
        if (selectorScreen) {
            selectorScreen.style.display = 'flex';
        }
    }

    addStyles() {
        // Check if styles already added
        if (document.getElementById('diagnostics-selector-styles')) return;

        const style = document.createElement('style');
        style.id = 'diagnostics-selector-styles';
        style.innerHTML = `
            .diagnostics-selector-panel {
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

            .diagnostics-selector-panel h2 {
                text-align: center;
                font-size: 1.8rem;
                margin-bottom: 10px;
                background: linear-gradient(90deg, #00ffff, #ff00ff);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .selector-subtitle {
                text-align: center;
                font-size: 1.1rem;
                color: #aaa;
                margin-bottom: 30px;
            }

            .mode-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .mode-card {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 15px;
                padding: 25px;
                border: 2px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s;
                cursor: pointer;
            }

            .mode-card:hover {
                border-color: rgba(0, 200, 255, 0.5);
                box-shadow: 0 0 20px rgba(0, 200, 255, 0.3);
                transform: translateY(-5px);
            }

            #mode-2d-card:hover {
                border-color: rgba(0, 255, 100, 0.5);
                box-shadow: 0 0 20px rgba(0, 255, 100, 0.3);
            }

            #mode-4d-card:hover {
                border-color: rgba(255, 100, 255, 0.5);
                box-shadow: 0 0 20px rgba(255, 100, 255, 0.3);
            }

            .mode-icon {
                text-align: center;
                font-size: 3rem;
                margin-bottom: 15px;
            }

            .mode-title {
                text-align: center;
                font-size: 1.5rem;
                color: #00ccff;
                margin-bottom: 5px;
            }

            .mode-subtitle {
                text-align: center;
                font-size: 0.95rem;
                color: #888;
                margin-bottom: 15px;
            }

            .mode-features {
                list-style: none;
                padding: 0;
                margin: 15px 0;
                color: #ccc;
            }

            .mode-features li {
                padding: 8px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }

            .mode-features li:last-child {
                border-bottom: none;
            }

            .mode-btn {
                width: 100%;
                padding: 15px;
                font-size: 1.1rem;
                font-weight: bold;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                margin-top: 15px;
                transition: all 0.3s;
                color: white;
            }

            .mode-btn-2d {
                background: linear-gradient(135deg, #00cc66, #00ff99);
            }

            .mode-btn-2d:hover {
                transform: scale(1.05);
                box-shadow: 0 0 25px rgba(0, 255, 100, 0.5);
            }

            .mode-btn-4d {
                background: linear-gradient(135deg, #cc00cc, #ff00ff);
            }

            .mode-btn-4d:hover {
                transform: scale(1.05);
                box-shadow: 0 0 25px rgba(255, 0, 255, 0.5);
            }

            .mode-btn-fbtest {
                background: linear-gradient(135deg, #ff6600, #ffaa00);
            }

            .mode-btn-fbtest:hover {
                transform: scale(1.05);
                box-shadow: 0 0 25px rgba(255, 170, 0, 0.5);
            }

            #mode-fbtest-card:hover {
                border-color: rgba(255, 170, 0, 0.5);
                box-shadow: 0 0 20px rgba(255, 170, 0, 0.3);
            }

            .selector-info {
                background: rgba(0, 200, 255, 0.1);
                border-left: 4px solid #00ccff;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
            }

            .selector-info h4 {
                color: #00ffff;
                margin-bottom: 10px;
            }

            .selector-info p {
                margin: 8px 0;
                color: #ccc;
                line-height: 1.6;
            }

            .selector-note {
                background: rgba(255, 200, 0, 0.1);
                border-left: 4px solid #ffcc00;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
            }

            .selector-note h4 {
                color: #ffcc00;
                margin-bottom: 10px;
            }

            .selector-note ul {
                margin: 10px 0;
                padding-left: 20px;
                color: #ffcc00;
            }

            .selector-note li {
                margin: 8px 0;
                line-height: 1.5;
            }

            .selector-buttons {
                text-align: center;
                margin-top: 20px;
            }

            @media (max-width: 768px) {
                .mode-options {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        // 2D mode button
        document.getElementById('select-2d-btn').addEventListener('click', () => {
            this.selectMode('2D');
        });

        // 4D mode button
        document.getElementById('select-4d-btn').addEventListener('click', () => {
            this.selectMode('4D');
        });

        // Back button
        document.getElementById('selector-back-btn').addEventListener('click', () => {
            this.hide();
            document.getElementById('start-screen').style.display = 'flex';
        });

        // Click on card to select
        document.getElementById('mode-2d-card').addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                document.getElementById('select-2d-btn').click();
            }
        });

        document.getElementById('mode-4d-card').addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                document.getElementById('select-4d-btn').click();
            }
        });

        // FB Test button
        document.getElementById('select-fbtest-btn').addEventListener('click', () => {
            this.selectFBTest();
        });

        document.getElementById('mode-fbtest-card').addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                document.getElementById('select-fbtest-btn').click();
            }
        });
    }

    selectMode(mode) {
        console.log(`Selected diagnostics mode: ${mode}`);

        // Set mode in diagnostics manager
        this.diagnosticsManager.setMode(mode);

        // Hide selector screen
        this.hide();

        // Show diagnostics UI
        this.diagnosticsUI.show(mode);
    }

    selectFBTest() {
        console.log('Selected Front/Back Test mode');

        // Hide selector screen
        this.hide();

        // Show front/back test UI
        if (window.app && window.app.frontBackTestUI) {
            window.app.frontBackTestUI.show();
        }
    }
}
