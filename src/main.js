import { AudioManager } from './audio/AudioManager.js';
import { SceneManager } from './3d/SceneManager.js';
import { GameManager } from './game/GameManager.js';
import { HistoryManager } from './game/HistoryManager.js';
import { UIManager } from './ui/UIManager.js';

class App {
  constructor() {
    this.audioManager = new AudioManager();
    this.sceneManager = new SceneManager();
    this.uiManager = new UIManager();
    this.historyManager = new HistoryManager();
    this.gameManager = new GameManager(
      this.audioManager,
      this.sceneManager,
      this.uiManager,
      this.historyManager
    );

    this.init();
  }

  async init() {
    console.log("App initializing...");
    this.sceneManager.init(document.querySelector('#app'));
    this.uiManager.init(document.querySelector('#app'), this.gameManager);

    // Game loop
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.sceneManager.update();
    this.gameManager.update();
  }
}

new App();
