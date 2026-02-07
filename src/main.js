import { AudioManager } from './audio/AudioManager.js';
import { DiagnosticsManager } from './audio/DiagnosticsManager.js';
import { FrontBackTestManager } from './audio/FrontBackTestManager.js';
import { SceneManager } from './3d/SceneManager.js';
import { GameManager } from './game/GameManager.js';
import { HistoryManager } from './game/HistoryManager.js';
import { UIManager } from './ui/UIManager.js';
import { DiagnosticsUI } from './ui/DiagnosticsUI.js';
import { DiagnosticsModeSelector } from './ui/DiagnosticsModeSelector.js';
import { FrontBackTestUI } from './ui/FrontBackTestUI.js';

class App {
  constructor() {
    this.audioManager = new AudioManager();
    this.diagnosticsManager = new DiagnosticsManager();
    this.frontBackTestManager = new FrontBackTestManager();
    this.sceneManager = new SceneManager();
    this.uiManager = new UIManager();
    this.diagnosticsUI = new DiagnosticsUI();
    this.diagnosticsModeSelector = new DiagnosticsModeSelector();
    this.frontBackTestUI = new FrontBackTestUI();
    this.historyManager = new HistoryManager();
    this.gameManager = new GameManager(
      this.audioManager,
      this.sceneManager,
      this.uiManager,
      this.historyManager
    );

    // Make app globally accessible for diagnostics UI
    window.app = this;

    this.init();
  }

  async init() {
    console.log("App initializing...");
    this.sceneManager.init(document.querySelector('#app'));
    this.uiManager.init(document.querySelector('#app'), this.gameManager);
    this.diagnosticsUI.init(document.querySelector('#app'), this.diagnosticsManager);
    this.diagnosticsModeSelector.init(document.querySelector('#app'), this.diagnosticsManager, this.diagnosticsUI);
    await this.frontBackTestManager.init(this.sceneManager);
    this.frontBackTestUI.init(document.querySelector('#app'), this.frontBackTestManager);

    // Game loop
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.sceneManager.update();
    this.gameManager.update();

    // Update Yaw display and AudioListener during gameplay
    if (this.gameManager.state === 'PLAYING' || this.gameManager.state === 'WAITING') {
      const yaw = this.sceneManager.getCameraYaw();
      this.uiManager.updateYaw(yaw);

      // Update AudioListener orientation based on camera direction
      this.audioManager.updateListenerOrientation(this.sceneManager);
    }

    // Update AudioListener for front/back test
    if (this.frontBackTestManager && this.frontBackTestManager.isPlaying) {
      this.frontBackTestManager.updateAudioListener();
    }
  }
}

new App();
