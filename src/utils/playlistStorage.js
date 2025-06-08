// utils/playlistStorage.js

export function getPlaylist(key = 'music-player-playlist') {
    const playlistJson = localStorage.getItem(key);
    return playlistJson ? JSON.parse(playlistJson) : [];
}

export function setPlaylist(playlist, key = 'music-player-playlist') {
    localStorage.setItem(key, JSON.stringify(playlist));
}

// **修改：替换原有的 saveCurrentSongIndex**
/**
 * 保存当前播放歌曲的唯一ID。
 * @param {string|null} songId - 当前歌曲的唯一ID，如果为null则移除存储。
 * @param {string} key - localStorage 的键名。
 */
export function saveCurrentSongId(songId, key = 'music-player-current-song-id') {
    if (songId) {
        localStorage.setItem(key, String(songId)); // 确保保存为字符串
    } else {
        localStorage.removeItem(key); // 如果没有歌曲ID，则移除
    }
}

// **修改：替换原有的 loadCurrentSongIndex**
/**
 * 加载当前播放歌曲的唯一ID。
 * @param {string} key - localStorage 的键名。
 * @returns {string|null} - 返回保存的歌曲ID，如果没有则返回 null。
 */
export function loadCurrentSongId(key = 'music-player-current-song-id') {
    return localStorage.getItem(key);
}

// 辅助函数：根据歌曲ID在播放列表中查找其索引
/**
 * 根据歌曲ID在播放列表中查找其索引。
 * @param {Array<Object>} playlist - 播放列表数组。
 * @param {string} songId - 要查找的歌曲ID。
 * @returns {number} - 歌曲在播放列表中的索引，如果未找到则返回 -1。
 */
export function findSongIndexById(playlist, songId) {
    if (!playlist || !Array.isArray(playlist) || !songId) {
        return -1;
    }
    return playlist.findIndex(song => String(song.id) === String(songId)); // 确保ID类型匹配
}

// 新增：保存当前播放时间 (保持不变)
export function saveCurrentTime(time, key = 'music-player-current-time') {
    localStorage.setItem(key, String(time));
}

// 新增：读取当前播放时间 (保持不变)
export function loadCurrentTime(key = 'music-player-current-time') {
    const timeStr = localStorage.getItem(key);
    return timeStr ? parseFloat(timeStr) : 0; // 默认返回 0
}