/**
 * AudioFactory - AudioContext と PannerNode の初期化を共通化
 */
import { AUDIO } from './constants.js';

/**
 * AudioContext を作成・取得する
 * @returns {AudioContext}
 */
export function createAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    return new AudioContextClass();
}

/**
 * AudioContext を再開する（ユーザー操作後に呼び出し必須）
 * @param {AudioContext} ctx
 */
export async function resumeAudioContext(ctx) {
    if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
        console.log('AudioContext resumed');
    }
}

/**
 * HRTF対応のPannerNodeを作成・設定する
 * @param {AudioContext} ctx
 * @returns {PannerNode}
 */
export function createHRTFPanner(ctx) {
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = AUDIO.PANNER_REF_DISTANCE;
    panner.maxDistance = AUDIO.PANNER_MAX_DISTANCE;
    panner.rolloffFactor = AUDIO.PANNER_ROLLOFF_FACTOR;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 0;
    panner.coneOuterGain = 0;
    return panner;
}

/**
 * PannerNode の位置を設定する
 * @param {PannerNode} panner
 * @param {AudioContext} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
export function setPannerPosition(panner, ctx, x, y, z) {
    if (!panner) return;
    if (panner.positionX && panner.positionX.setValueAtTime) {
        panner.positionX.setValueAtTime(x, ctx.currentTime);
        panner.positionY.setValueAtTime(y, ctx.currentTime);
        panner.positionZ.setValueAtTime(z, ctx.currentTime);
    } else {
        panner.setPosition(x, y, z);
    }
}

/**
 * AudioListener の向きを設定する
 * @param {AudioContext} ctx
 * @param {number} forwardX
 * @param {number} forwardY
 * @param {number} forwardZ
 * @param {number} upX
 * @param {number} upY
 * @param {number} upZ
 */
export function setListenerOrientation(ctx, forwardX, forwardY, forwardZ, upX, upY, upZ) {
    if (!ctx) return;
    const listener = ctx.listener;
    if (listener.forwardX) {
        listener.forwardX.setValueAtTime(forwardX, ctx.currentTime);
        listener.forwardY.setValueAtTime(forwardY, ctx.currentTime);
        listener.forwardZ.setValueAtTime(forwardZ, ctx.currentTime);
        listener.upX.setValueAtTime(upX, ctx.currentTime);
        listener.upY.setValueAtTime(upY, ctx.currentTime);
        listener.upZ.setValueAtTime(upZ, ctx.currentTime);
    } else {
        listener.setOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ);
    }
}

/**
 * AudioListener の位置を設定する
 * @param {AudioContext} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
export function setListenerPosition(ctx, x, y, z) {
    if (!ctx) return;
    const listener = ctx.listener;
    if (listener.positionX) {
        listener.positionX.setValueAtTime(x, ctx.currentTime);
        listener.positionY.setValueAtTime(y, ctx.currentTime);
        listener.positionZ.setValueAtTime(z, ctx.currentTime);
    } else {
        listener.setPosition(x, y, z);
    }
}

/**
 * シンプルなオシレーターを作成する
 * @param {AudioContext} ctx
 * @param {string} type - 'sine', 'square', 'sawtooth', 'triangle'
 * @param {number} frequency
 * @returns {OscillatorNode}
 */
export function createOscillator(ctx, type = 'sine', frequency = AUDIO.DEFAULT_FREQUENCY) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    return osc;
}

/**
 * GainNode を作成する
 * @param {AudioContext} ctx
 * @param {number} initialGain
 * @returns {GainNode}
 */
export function createGainNode(ctx, initialGain = AUDIO.DEFAULT_VOLUME) {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(initialGain, ctx.currentTime);
    return gain;
}
