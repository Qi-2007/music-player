// src/utils/playlistStorage.js
const PLAYLIST_KEY = 'music-player-playlist';

export function getPlaylist() {
  const storedPlaylist = localStorage.getItem(PLAYLIST_KEY);
  return storedPlaylist ? JSON.parse(storedPlaylist) : [];
}

export function setPlaylist(playlist) {
  localStorage.setItem(PLAYLIST_KEY, JSON.stringify(playlist));
}