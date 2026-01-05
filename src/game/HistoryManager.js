/**
 * HistoryManager - プレイ履歴の保存・読込・クリア機能
 */
export class HistoryManager {
    constructor() {
        this.storageKey = 'soundDirectionTraining.history';
    }

    /**
     * プレイ結果を保存
     * @param {Object} result - プレイ結果
     * @param {number} result.score - スコア（0-100）
     * @param {number} result.correct - 正解数（0-10）
     * @param {number} result.total - 問題数（10）
     * @param {number} result.duration - 所要時間（ミリ秒）
     * @param {Array} result.details - 各問の詳細
     */
    saveResult(result) {
        const history = this.getHistory();
        const entry = {
            playedAt: new Date().toISOString(),
            score: result.score,
            correct: result.correct,
            total: result.total,
            duration: result.duration || 0,
            details: result.details || []
        };
        history.unshift(entry); // 最新を先頭に追加

        // 最大100件保存
        if (history.length > 100) {
            history.pop();
        }

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(history));
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    }

    /**
     * 履歴一覧を取得（降順）
     * @returns {Array} 履歴配列
     */
    getHistory() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load history:', e);
            return [];
        }
    }

    /**
     * 履歴をクリア
     */
    clearHistory() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (e) {
            console.error('Failed to clear history:', e);
        }
    }

    /**
     * 日時を読みやすい形式にフォーマット
     * @param {string} isoString - ISO形式の日時文字列
     * @returns {string} フォーマットされた日時
     */
    formatDate(isoString) {
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    /**
     * 所要時間を読みやすい形式にフォーマット
     * @param {number} ms - ミリ秒
     * @returns {string} フォーマットされた時間
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes > 0) {
            return `${minutes}分${remainingSeconds}秒`;
        }
        return `${remainingSeconds}秒`;
    }
}
