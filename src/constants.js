/**
 * 定数ファイル - マジックナンバーを一元管理
 */

// ゲーム設定
export const GAME = {
    MAX_ROUNDS: 10,
    MAX_PLAY_COUNT: 2,
    SCORE_PER_CORRECT: 10,
    FEEDBACK_DELAY_MS: 1500,
    SOUND_START_DELAY_MS: 500,
    SOUND_DURATION_SEC: 1.0,
};

// 音響設定
export const AUDIO = {
    DEFAULT_FREQUENCY: 440,
    DEFAULT_VOLUME: 0.5,
    SOUND_DISTANCE: 5,
    PANNER_REF_DISTANCE: 1,
    PANNER_MAX_DISTANCE: 10000,
    PANNER_ROLLOFF_FACTOR: 1,
    ATTACK_TIME_SEC: 0.01,
    RELEASE_TIME_SEC: 0.05,
    SUSTAIN_DURATION_SEC: 2.0,
};

// フロントバックテスト設定
export const FRONT_BACK_TEST = {
    DEFAULT_TRIAL_COUNT: 20,
    HISTORY_MAX_SESSIONS: 50,
    FRONT_FILTER_FREQUENCY: 4000,
    FRONT_FILTER_GAIN: 6,
    BACK_FILTER_FREQUENCY: 3500,
    BACK_FILTER_Q: 0.7,
};

// 診断設定
export const DIAGNOSTICS = {
    ALTERNATING_INTERVAL_2D_MS: 300,
    ALTERNATING_INTERVAL_4D_MS: 500,
    MAX_LOGS: 50,
    FFT_SIZE: 2048,
    SMOOTHING_TIME_CONSTANT: 0.8,
};

// 履歴設定
export const HISTORY = {
    MAX_ENTRIES: 100,
    STORAGE_KEY: 'soundDirectionTraining.history',
};

// 方向定義
export const DIRECTIONS_8 = [
    { label: 'Front', angle: 0 },
    { label: 'Front-Right', angle: 45 },
    { label: 'Right', angle: 90 },
    { label: 'Back-Right', angle: 135 },
    { label: 'Back', angle: 180 },
    { label: 'Back-Left', angle: 225 },
    { label: 'Left', angle: 270 },
    { label: 'Front-Left', angle: 315 },
];

export const DIRECTIONS_4 = [
    { label: 'Front', angle: 0 },
    { label: 'Right', angle: 90 },
    { label: 'Back', angle: 180 },
    { label: 'Left', angle: 270 },
];

export const DIRECTION_LABELS_JP = {
    'Front': '前',
    'Front-Right': '右前',
    'Right': '右',
    'Back-Right': '右後',
    'Back': '後',
    'Back-Left': '左後',
    'Left': '左',
    'Front-Left': '左前',
};
