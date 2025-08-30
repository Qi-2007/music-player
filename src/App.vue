<template>
  <div id="app">
    <div class="playback-container">
      <div class="blurred-background" :style="{ backgroundImage: 'url(' + currentSong.coverUrl + ')' }"></div>

      <!-- 新增：歌词/信息切换按钮 -->
      <button @click="toggleLyricsPanel" class="toggle-button">
        {{ isLyricsPanelVisible ? '显示歌曲信息' : '显示歌词' }}
      </button>

      <!-- 左侧面板，在移动端根据状态显示或隐藏 -->
      <div 
        class="left-panel" 
        :class="{ 'center-content': !shouldShowRightPanel }"
        v-show="shouldShowLeftPanel"
      >
        <SongInfo :song="currentSong" />
        <PlaybackControls
          :isPlaying="isPlaying"
          :currentTime="currentTime"
          :duration="duration"
          :volume="volume"
          @togglePlayPause="togglePlayPause"
          @seek="handleSeek"
          @playNext="playNext"
          @playPrevious="playPrevious"
          @setVolume="handleVolumeChange"
          ref="playbackControls"
        />
      </div>

      <!-- 右侧面板，在移动端根据状态显示或隐藏 -->
      <div class="right-panel" v-show="shouldShowRightPanel">
        <LyricsDisplay
          :lyrics="currentLyrics"
          :currentTime="currentTime"
          :isUserSeeking="isUserSeekingFromControls"
          @lyric-clicked="handleLyricClicked"
        />
      </div>

      <button class="close-button">X</button>

      <audio
        ref="audioPlayer"
        :src="currentSong.audioUrl"
        @play="handlePlay"
        @pause="handlePause"
        @timeupdate="handleTimeUpdate"
        @loadedmetadata="handleLoadedMetadata"
        @ended="handleEnded"
        :volume="volume"
      ></audio>

    </div>
  </div>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import LyricsDisplay from './components/LyricsDisplay.vue';
import PlaybackControls from './components/PlaybackControls.vue';
import SongInfo from './components/SongInfo.vue';
import { parseLrc } from './utils/lrcParser';
import {
  findSongIndexById,
  getPlaylist,
  loadCurrentSongId,
  loadCurrentTime,
  saveCurrentSongId,
  saveCurrentTime,
  setPlaylist
} from './utils/playlistStorage';

  // 定义 localStorage 键
  const MUSIC_PLAYER_WINDOW_STATE_KEY = 'musicPlayerWindowState';
  const MUSIC_PLAYER_CURRENT_SONG_ID_KEY = 'music-player-current-song-id';

  // ---- 播放列表和当前歌曲状态 ----
  const playlist = ref([]);
  const currentSongIndex = ref(0);
  const isPlaying = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const volume = ref(0.5);
  const audioPlayer = ref(null);
  const playbackControls = ref(null);
  
  // 新增：用于判断是否为移动设备和控制面板显示
  const isMobile = ref(false);
  const isLyricsPanelVisible = ref(false); // 默认关闭歌词显示

  // 新增：计算属性来控制面板显示
  const shouldShowLeftPanel = computed(() => {
    // 桌面端：总是显示左侧面板
    // 移动端：当不显示歌词时显示左侧面板
    return !isMobile.value || !isLyricsPanelVisible.value;
  });

  const shouldShowRightPanel = computed(() => {
    // 桌面端：根据歌词显示状态决定
    // 移动端：只在显示歌词时显示右侧面板
    return isMobile.value ? isLyricsPanelVisible.value : isLyricsPanelVisible.value;
  });

  const isUserSeekingFromControls = computed(() =>
    playbackControls.value ? playbackControls.value.isUserSeeking : false
  );

  const currentSong = computed(() => playlist.value[currentSongIndex.value] || {});
  const currentLyrics = computed(() => {
    const song = currentSong.value;
    if (song && song.lrcString) {
      return parseLrc(song.lrcString);
    }
    return [];
  });

  // ---- 音频事件处理函数 ----
  const handlePlay = () => { isPlaying.value = true; console.log('Playback started'); };
  const handlePause = () => { isPlaying.value = false; console.log('Playback paused'); };
  const handleTimeUpdate = () => {
    if (audioPlayer.value) {
      if (!isUserSeekingFromControls.value) {
        currentTime.value = audioPlayer.value.currentTime;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioPlayer.value) {
      duration.value = audioPlayer.value.duration;
      console.log('Metadata loaded, duration:', duration.value);

      if (audioPlayer.value.currentTime !== currentTime.value) {
          audioPlayer.value.currentTime = currentTime.value;
          console.log('Metadata loaded: Audio element time synchronized with Vue ref:', currentTime.value);
      }

      if (isPlaying.value) {
          play();
      }
    }
  };

  const handleEnded = () => {
    console.log('Playback ended');
    currentTime.value = 0;
    saveCurrentTime(0, 'music-player-current-time');
    playNext(true);
  };

  // ---- 播放控制方法 ----
  const play = () => {
    if (audioPlayer.value && currentSong.value.audioUrl) {
      audioPlayer.value.play().catch(e => console.error("Error playing audio:", e));
    } else {
      console.warn("无法播放：音频播放器未准备好或无音频URL。");
    }
  };
  const pause = () => { if (audioPlayer.value) { audioPlayer.value.pause(); } };
  const togglePlayPause = () => { if (isPlaying.value) { pause(); } else { play(); } };
  const handleSeek = (time) => {
    if (audioPlayer.value) {
      audioPlayer.value.currentTime = time;
      currentTime.value = time;
      saveCurrentTime(time, 'music-player-current-time');
      console.log('Seeking to:', time);
      if (!isPlaying.value) {
        play();
      }
    }
  };
  const handleVolumeChange = (newVolume) => {
    volume.value = newVolume;
    console.log('Volume changed to:', newVolume);
  };

  const playNext = (autoPlay = false) => {
    if (playlist.value.length > 0) {
      currentTime.value = 0;
      saveCurrentTime(0, 'music-player-current-time');
      currentSongIndex.value = (currentSongIndex.value + 1) % playlist.value.length;
      console.log('Playing next song, new index:', currentSongIndex.value);
      if (autoPlay) {
        isPlaying.value = true;
      }
    } else {
      console.warn('播放列表为空，无法播放下一曲。');
    }
  };

  const playPrevious = (autoPlay = false) => {
    if (playlist.value.length > 0) {
      currentTime.value = 0;
      saveCurrentTime(0, 'music-player-current-time');
      currentSongIndex.value = (currentSongIndex.value - 1 + playlist.value.length) % playlist.value.length;
      console.log('Playing previous song, new index:', currentSongIndex.value);
      if (autoPlay) {
        isPlaying.value = true;
      }
    } else {
      console.warn('播放列表为空，无法播放上一曲。');
    }
  };

  const handleLyricClicked = (time) => {
    currentTime.value = time;
    if (audioPlayer.value) {
      audioPlayer.value.currentTime = time;
      saveCurrentTime(time, 'music-player-current-time');
      if (!isPlaying.value) {
        play();
      }
    }
    console.log('歌词被点击，跳转到时间:', time);
  };

  const initialLoadSong = () => {
    if (playlist.value.length > 0) {
      const initialSong = playlist.value[currentSongIndex.value];
      if (audioPlayer.value && initialSong && initialSong.audioUrl) {
        audioPlayer.value.src = initialSong.audioUrl;
        audioPlayer.value.currentTime = currentTime.value;
        console.log('Initial song loaded:', initialSong.audioUrl, 'at time:', currentTime.value);
        audioPlayer.value.load();
      } else {
        console.warn('播放列表为空或当前歌曲无URL，无法初始化加载。');
        if (audioPlayer.value) audioPlayer.value.src = '';
      }
    } else {
        console.warn('播放列表为空，无法初始化加载歌曲。');
        if (audioPlayer.value) audioPlayer.value.src = '';
    }
  };
  
  // 新增：处理窗口大小变化，更新 isMobile 状态
  const handleResize = () => {
    isMobile.value = window.innerWidth <= 768; // 修改为更常见的移动端断点
  };

  // 新增：切换面板显示状态
  const toggleLyricsPanel = () => {
    isLyricsPanelVisible.value = !isLyricsPanelVisible.value;
    // 保存状态到 localStorage
    localStorage.setItem('music-player-lyrics-visible', isLyricsPanelVisible.value);
  };


  // ---- 生命周期钩子和状态持久化 ----
  onMounted(() => {
    // 新增：在组件挂载时监听窗口大小
    handleResize();
    window.addEventListener('resize', handleResize);

    // 从 localStorage 恢复歌词显示状态
    const savedLyricsVisible = localStorage.getItem('music-player-lyrics-visible');
    if (savedLyricsVisible !== null) {
      isLyricsPanelVisible.value = savedLyricsVisible === 'true';
    }

    let loadedTime = loadCurrentTime('music-player-current-time');
    let loadedSongId = loadCurrentSongId(MUSIC_PLAYER_CURRENT_SONG_ID_KEY);

    const initialDownloaderPlaylistJson = localStorage.getItem('musicPlayer_playlist');
    const initialDownloaderActiveIndexStr = localStorage.getItem('musicPlayer_currentSongIndex');

    if (initialDownloaderPlaylistJson) {
      try {
        const initialDownloaderPlaylist = JSON.parse(initialDownloaderPlaylistJson);
        const initialDownloaderActiveId = initialDownloaderPlaylist[parseInt(initialDownloaderActiveIndexStr || '0', 10)]?.id;

        if (initialDownloaderPlaylist.length > 0) {
          playlist.value = initialDownloaderPlaylist;
          let foundIndex = -1;
          if (initialDownloaderActiveId) {
             foundIndex = findSongIndexById(playlist.value, initialDownloaderActiveId);
          }
          currentSongIndex.value = foundIndex !== -1 ? foundIndex : 0;

          currentTime.value = 0;
          console.log('播放器初始化：从下载器 localStorage 加载播放列表和活动项，进度已重置为 0。');

          localStorage.removeItem('musicPlayer_playlist');
          localStorage.removeItem('musicPlayer_currentSongIndex');
        }
      } catch (e) {
        console.error('初始化播放器时解析下载器 localStorage 数据失败:', e);
      }
    } else {
      console.log('没有检测到来自下载器的歌单，尝试加载播放器自身歌单。');
      playlist.value = getPlaylist('music-player-playlist');

      let foundIndex = -1;
      if (loadedSongId) {
        foundIndex = findSongIndexById(playlist.value, loadedSongId);
      }
      currentSongIndex.value = foundIndex !== -1 ? foundIndex : 0;

      currentTime.value = loadedTime;
      console.log('Initializing audio player time to:', currentTime.value);

      if (playlist.value.length > 0 && currentSongIndex.value >= playlist.value.length) {
          currentSongIndex.value = 0;
          if (playlist.value[0]) {
             saveCurrentSongId(playlist.value[0].id, MUSIC_PLAYER_CURRENT_SONG_ID_KEY);
          } else {
             saveCurrentSongId(null, MUSIC_PLAYER_CURRENT_SONG_ID_KEY);
          }
      } else if (playlist.value.length === 0) {
          saveCurrentSongId(null, MUSIC_PLAYER_CURRENT_SONG_ID_KEY);
      }
    }

    if (audioPlayer.value) {
      audioPlayer.value.volume = volume.value;
    }

    initialLoadSong();

    const savedWindowState = localStorage.getItem(MUSIC_PLAYER_WINDOW_STATE_KEY);
    if (savedWindowState === 'true') {
      console.log('检测到播放器窗口上次是打开状态，尝试重新激活或确保其状态正确。');
      const musicPlayerWin = window.open('javascript:;', 'musicPlayerWindow');
      if (musicPlayerWin) {
          musicPlayerWin.focus();
          console.log("尝试激活/打开名为 'musicPlayerWindow' 的窗口。");
      } else {
          console.warn("无法激活/打开播放器窗口，可能被浏览器阻止。");
      }
      localStorage.setItem(MUSIC_PLAYER_WINDOW_STATE_KEY, 'true');
      console.log('当前播放窗口状态设置为 true。');
    } else {
      localStorage.setItem(MUSIC_PLAYER_WINDOW_STATE_KEY, 'true');
      console.log('播放窗口首次打开或从关闭状态恢复，状态设置为 true。');
    }

    const handleBeforeUnload = () => {
      localStorage.setItem(MUSIC_PLAYER_WINDOW_STATE_KEY, 'false');
      console.log('Window is closing/unloading, player window state set to false.');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    onUnmounted(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // 新增：在组件卸载时移除窗口大小监听器
      window.removeEventListener('resize', handleResize);
      localStorage.setItem(MUSIC_PLAYER_WINDOW_STATE_KEY, 'false');
      console.log('播放器组件卸载，窗口状态设置为 false。');
    });
  });

  // ---- 监听 localStorage 变化 (来自其他标签页) ----
  window.addEventListener('storage', (event) => {
    console.log('localStorage storage event triggered:', event.key);

    if (event.key === 'musicPlayer_playlist') {
      const newPlaylistJson = event.newValue;
      if (newPlaylistJson) {
        try {
          const newPlaylist = JSON.parse(newPlaylistJson);
          const newActiveIndexStr = localStorage.getItem('musicPlayer_currentSongIndex');
          const newActiveIdFromDownloader = newPlaylist[parseInt(newActiveIndexStr || '0', 10)]?.id;

          console.log('检测到外部播放列表更新：', newPlaylist, '活动索引（来自下载器）：', newActiveIndexStr);

          const isPlaylistChanged = JSON.stringify(playlist.value) !== JSON.stringify(newPlaylist);
          const currentSongId = currentSong.value?.id;
          const isSongChangedById = newActiveIdFromDownloader && currentSongId !== newActiveIdFromDownloader;

          if (isPlaylistChanged) {
            playlist.value = newPlaylist;
            console.log('播放列表已更新！');
          }

          if (isPlaylistChanged || isSongChangedById) {
            let targetIndex = -1;
            if (newActiveIdFromDownloader) {
                targetIndex = findSongIndexById(playlist.value, newActiveIdFromDownloader);
            }
            currentSongIndex.value = targetIndex !== -1 ? targetIndex : 0;

            currentTime.value = 0;
            console.log('外部更新，新歌或新列表，从0开始播放。');
            if (audioPlayer.value) {
                audioPlayer.value.currentTime = 0;
            }
            isPlaying.value = true;

          } else {
              console.log('当前播放歌曲与活动项相同，无需切换。');
              if (!isPlaying.value) {
                  play();
              }
          }
        } catch (e) {
          console.error('解析音乐播放器数据时出错:', e);
        }
      } else {
        console.log('musicPlayer_playlist 被清除');
        playlist.value = [];
        currentSongIndex.value = 0;
        currentTime.value = 0;
        if (audioPlayer.value) audioPlayer.value.src = '';
        isPlaying.value = false;
        saveCurrentSongId(null, MUSIC_PLAYER_CURRENT_SONG_ID_KEY);
        saveCurrentTime(0, 'music-player-current-time');
      }
    }
    else if (event.key === 'musicPlayer_currentSongIndex') {
        console.log('检测到外部 currentSongIndex 更新 (作为提示)。');
        const newActiveIndexStr = event.newValue;
        if (newActiveIndexStr !== null) {
            const tempNewIndex = parseInt(newActiveIndexStr, 10);
            if (playlist.value.length > 0 && tempNewIndex >= 0 && tempNewIndex < playlist.value.length) {
                const newActiveSongId = playlist.value[tempNewIndex].id;
                const currentSongId = currentSong.value?.id;

                if (newActiveSongId && newActiveSongId !== currentSongId) {
                    console.log(`外部索引提示歌曲ID ${newActiveSongId} 与当前不同。`);
                    const targetIndex = findSongIndexById(playlist.value, newActiveSongId);
                    if (targetIndex !== -1) {
                        currentSongIndex.value = targetIndex;
                        currentTime.value = 0;
                        if (audioPlayer.value) audioPlayer.value.currentTime = 0;
                        isPlaying.value = true;
                        console.log(`已切换到索引 ${targetIndex} 的歌曲。`);
                    } else {
                        console.warn(`无法在当前播放列表中找到ID为 ${newActiveSongId} 的歌曲。`);
                    }
                } else if (newActiveSongId && newActiveSongId === currentSongId) {
                    console.log('外部索引更新，但歌曲ID与当前相同，无需切换。');
                    if (!isPlaying.value) {
                        play();
                    }
                }
            } else {
                console.warn('外部索引提示无效或播放列表为空。');
            }
        } else {
            console.log('musicPlayer_currentSongIndex 被清除。');
            if (playlist.value.length > 0) {
                currentSongIndex.value = 0;
                saveCurrentSongId(playlist.value[0].id, MUSIC_PLAYER_CURRENT_SONG_ID_KEY);
            } else {
                currentSongIndex.value = 0;
                saveCurrentSongId(null, MUSIC_PLAYER_CURRENT_SONG_ID_KEY);
            }
            currentTime.value = 0;
            if (audioPlayer.value) audioPlayer.value.currentTime = 0;
            isPlaying.value = false;
        }
    }
    else if (event.key === 'music-player-playlist' && event.storageArea === localStorage) {
      console.log('播放器自身的Local Storage播放列表更新：', event.newValue);
      const newLocalPlaylist = getPlaylist('music-player-playlist');
      if (JSON.stringify(playlist.value) !== JSON.stringify(newLocalPlaylist)) {
        playlist.value = newLocalPlaylist;
        const currentSongId = currentSong.value?.id;
        let newIndex = -1;
        if (currentSongId) {
            newIndex = findSongIndexById(playlist.value, currentSongId);
        }
        currentSongIndex.value = newIndex !== -1 ? newIndex : 0;
        if (playlist.value.length === 0) {
            currentSongIndex.value = 0;
            saveCurrentSongId(null, MUSIC_PLAYER_CURRENT_SONG_ID_KEY);
        } else if (newIndex === -1 && playlist.value.length > 0) {
            saveCurrentSongId(playlist.value[0].id, MUSIC_PLAYER_CURRENT_SONG_ID_KEY);
        }
        console.log('播放器自身的播放列表已更新，当前歌曲索引重新确认:', currentSongIndex.value);
      }
    }
  });


  // ---- 监听状态变化并持久化 ----
  watch(volume, (newVolume) => {
    if(audioPlayer.value) {
      audioPlayer.value.volume = newVolume;
    }
  });

  // 监听 currentSongIndex 变化，更新 audioPlayer.src 并保存当前歌曲ID
  watch(currentSongIndex, (newIndex, oldIndex) => {
    // 修复：确保在首次加载时（oldIndex为0）不执行歌曲切换逻辑
    const isInitialLoad = (oldIndex === 0 && newIndex !== 0);

    // 新增修改网站title和icon
    document.title = `${currentSong.value.title}-${currentSong.value.artist} qPlayer`;
    let link = document.querySelector("link[rel~='icon']");
    if (link && currentSong.value.coverUrl) {
      link.href = currentSong.value.coverUrl;
    }

    // 原有逻辑
    if (oldIndex !== undefined && newIndex !== oldIndex) {
        if (playlist.value.length > 0 && newIndex >= 0 && newIndex < playlist.value.length) {
            const newSong = playlist.value[newIndex];
            const newAudioUrl = newSong.audioUrl;
            const newSongId = newSong.id;

            // 核心修复: 添加对 oldIndex 的有效性判断，同时检查是否为初始加载
            const oldSongId = (oldIndex !== undefined && oldIndex >= 0 && oldIndex < playlist.value.length)
                ? playlist.value[oldIndex]?.id
                : null;
            
            // 如果新旧歌曲ID都存在且不同，并且不是初始加载，才执行重置进度的逻辑
            if (newSongId && oldSongId && newSongId !== oldSongId && !isInitialLoad) {
                currentTime.value = 0;
                if (audioPlayer.value) {
                    audioPlayer.value.currentTime = 0;
                }
                console.log(`歌曲切换 ( ${oldIndex}(${oldSongId}) to ${newIndex}(${newSongId}) )，从0开始播放。`);
            } else {
                // 否则，恢复上次播放进度 (例如，刷新页面或列表重排序)
                const savedTime = loadCurrentTime('music-player-current-time');
                currentTime.value = savedTime;
                if (audioPlayer.value) {
                    audioPlayer.value.currentTime = savedTime;
                }
                console.log(`歌曲ID相同或为初始加载，恢复到保存时间点: ${currentTime.value}`);
            }

            saveCurrentSongId(newSongId, MUSIC_PLAYER_CURRENT_SONG_ID_KEY);

            if (audioPlayer.value) {
                if (audioPlayer.value.src !== newAudioUrl) {
                    audioPlayer.value.src = newAudioUrl;
                    console.log('Audio source updated to:', newAudioUrl);
                    audioPlayer.value.load();
                } else {
                    audioPlayer.value.currentTime = currentTime.value;
                    console.log('src 相同，更新音频时间到当前 ref 值:', currentTime.value);
                }
            }
        } else if (audioPlayer.value) {
            audioPlayer.value.src = '';
            console.log('播放列表为空，清空音频源。');
            saveCurrentSongId(null, MUSIC_PLAYER_CURRENT_SONG_ID_KEY);
        }
    } else if (playlist.value.length === 0 && audioPlayer.value) {
        audioPlayer.value.src = '';
        saveCurrentSongId(null, MUSIC_PLAYER_CURRENT_SONG_ID_KEY);
    }

    // --- Media Session API ---
    if ('mediaSession' in navigator && currentSong.value) {
      console.log('Setting Media Session metadata...');
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.value.title || '未知歌曲',
        artist: currentSong.value.artist || '未知艺术家',
        album: currentSong.value.album || '未知专辑',
        artwork: [
          { src: currentSong.value.coverUrl || '', sizes: '512x512', type: 'image/jpeg' },
        ]
      });

      // 设置媒体操作处理程序
      navigator.mediaSession.setActionHandler('play', () => {
        console.log('Media Session: play action');
        play();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        console.log('Media Session: pause action');
        pause();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        console.log('Media Session: nexttrack action');
        playNext(true);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        console.log('Media Session: previoustrack action');
        playPrevious(true);
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (audioPlayer.value) {
          const seekTime = details.seekTime;
          if (seekTime !== undefined) {
            audioPlayer.value.currentTime = seekTime;
            currentTime.value = seekTime;
            console.log('Media Session: seekto action, seeking to', seekTime);
          }
        }
      });
    }
  });


  watch(currentTime, (newTime) => {
    if (!isUserSeekingFromControls.value && isPlaying.value) {
        saveCurrentTime(newTime, 'music-player-current-time');
    }
  });

  watch(playlist, (newPlaylist) => {
      setPlaylist(newPlaylist, 'music-player-playlist');
      console.log('播放器自身的播放列表已保存。');
      if (currentSong.value && currentSong.value.id) {
          saveCurrentSongId(currentSong.value.id, MUSIC_PLAYER_CURRENT_SONG_ID_KEY);
      } else {
          saveCurrentSongId(null, MUSIC_PLAYER_CURRENT_SONG_ID_KEY);
      }
  }, { deep: true });

</script>
<style>
/* 让 html, body, #app 占满整个视口 */
html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: #ffffff;
  background-color: #121212;
}

/* #app 保持定位 */
#app {
   position: relative;
}

@keyframes rotate {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* 模糊背景元素样式：位于底层 */
.blurred-background {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 150vmax;
  height: 150vmax;
  background-size: cover;
  transform: translate(-50%, -50%);
  filter: blur(100px);
  opacity: 0.8;
  z-index: -1;
  animation: rotate 120s linear infinite;
}

/* playback-container：作为内容容器，填充屏幕，Flex 布局左右分栏 */
.playback-container {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    background-color: transparent;
    z-index: 1;
    align-items: stretch;
}

/* 移除伪元素样式 */
.playback-container::before {
    content: none;
}

/* left-panel：Flex Item，内容垂直排列 */
.left-panel {
    flex: 0.2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8vw;
    box-sizing: border-box;
    position: relative;
    z-index: 1;
    min-height: 0;
    width: 100%;
}

/* 新增：当只显示左侧面板时，内容居中并添加适当的内边距 */
.left-panel.center-content {
    flex: 1;
    justify-content: center;
    padding: 4vw;
}

/* right-panel：Flex Item，自身也是一个 Flex 容器来管理歌词滚动 */
.right-panel {
    flex: 1.8;
    padding: 4vw;
    box-sizing: border-box;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-height: 100vh; /* 限制最大高度 */
}

/* 确保内容不会超出容器 */
.song-info-container {
    width: 80%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.playback-controls-container {
    width: 80%;
    display: flex;
    flex-direction: column;
    align-items: center;
    max-height: 30vh; /* 限制播放控制容器最大高度 */
    overflow: hidden;
    margin-top: 2rem;
}

/* 歌曲信息文本样式 */
.song-info .text-info {
    max-width: 100%;
    word-wrap: break-word;
    word-break: break-word;
    text-align: center;
    padding: 0 20px;
    box-sizing: border-box;
    max-height: 30vh; /* 限制文本信息最大高度 */
    overflow: hidden;
}

.song-info .text-info .title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.song-info .text-info .artist,
.song-info .text-info .album {
    font-size: 1.1rem;
    opacity: 0.8;
    margin-bottom: 0.3rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 专辑封面样式优化 (修正为 album-art) */
.song-info .album-art {
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    max-width: 80%;
    height: auto;
    margin-bottom: 1.5rem;
    max-height: 40vh; /* 限制专辑封面最大高度 */
    object-fit: contain;
}

/* 按钮样式 */
.close-button,
.toggle-button {
    position: absolute;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    cursor: pointer;
    z-index: 10;
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    font-weight: bold;
    transition: all 0.3s ease;
    display: flex;
    justify-content: center;
    align-items: center;
}

.close-button {
    top: 20px;
    left: 20px;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    font-size: 16px;
}

.close-button:hover {
    background: rgba(255, 255, 255, 0.2);
}

.toggle-button {
    top: 20px;
    right: 20px;
    padding: 0.5rem 1rem;
    border-radius: 20px;
}

.toggle-button:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
}

/* 响应式媒体查询 - 合并优化版本 */
/* 移动端特殊样式 (≤768px) */
@media (max-width: 768px) {
    .left-panel {
        padding: 20px;
    }
    
    .left-panel.center-content {
        padding: 50px; /* 移动端更大的内边距 */
    }
    
    .right-panel {
        padding: 20px;
        max-height: 100vh;
    }
    
    .song-info-container,
    .playback-controls-container {
        width: 100%;
    }
    
    .song-info .text-info {
        padding: 0 15px;
        max-height: 25vh;
    }
    
    .song-info .text-info .title {
        font-size: 1.3rem;
        -webkit-line-clamp: 3;
    }
    
    .song-info .text-info .artist,
    .song-info .text-info .album {
        font-size: 1rem;
    }
    
    .song-info .album-art {
        max-width: 80%;
        margin-left: auto;
        margin-right: auto;
    }
}

/* 桌面端特殊样式 (≥769px) */
@media (min-width: 769px) {
    .left-panel.center-content {
        flex: 1;
        padding: 2vw;
    }
    
    .left-panel.center-content .song-info-container {
        max-width: 600px;
        margin: 0 auto;
        width: 80%;
    }
    
    .left-panel.center-content .playback-controls-container {
        max-width: 600px;
        margin: 2rem auto 0;
        width: 80%;
    }
    
    .song-info .text-info {
        max-width: 500px;
        margin: 0 auto;
    }
    
    .song-info .text-info .title {
        font-size: 2rem;
    }
    
    .song-info .text-info .artist {
        font-size: 1.3rem;
    }
    
    .song-info .text-info .album {
        font-size: 1.2rem;
    }
}

/* 小屏幕设备特殊优化 (≤480px) */
@media (max-width: 480px) {
    .close-button {
        left: 15px;
        top: 15px;
        width: 25px;
        height: 25px;
        font-size: 14px;
    }
    
    .toggle-button {
        padding: 0.4rem 0.8rem;
        font-size: 0.9rem;
        right: 15px;
        top: 15px;
    }
    
    .left-panel.center-content {
        padding: 30px;
    }
    
    .song-info .text-info {
        padding: 0 10px;
        max-height: 20vh;
    }
    
    .song-info .text-info .title {
        font-size: 1.2rem;
        margin-bottom: 0.3rem;
        -webkit-line-clamp: 2;
    }
    
    .song-info .text-info .artist,
    .song-info .text-info .album {
        font-size: 0.9rem;
        margin-bottom: 0.2rem;
    }
    
    .song-info .album-art {
        max-width: 90%;
    }
    
    .playback-controls-container {
        margin-top: 1.5rem;
        max-height: 25vh;
    }
}

/* 超小屏幕设备优化 (≤360px) */
@media (max-width: 360px) {
    .song-info .text-info .title {
        font-size: 1.1rem;
        -webkit-line-clamp: 2;
    }
    
    .song-info .text-info .artist,
    .song-info .text-info .album {
        font-size: 0.85rem;
    }
    
    .song-info .album-art {
        max-height: 25vh;
    }
}

/* 纵向空间不足的特殊处理 */
@media (max-height: 600px) {
    .left-panel.center-content {
        padding: 20px;
    }
    
    .song-info .album-art {
        max-height: 25vh;
        margin-bottom: 1rem;
    }
    
    .song-info .text-info .title {
        font-size: 1.2rem;
        margin-bottom: 0.2rem;
        -webkit-line-clamp: 1;
    }
    
    .song-info .text-info .artist,
    .song-info .text-info .album {
        font-size: 0.9rem;
        margin-bottom: 0.1rem;
    }
    
    .playback-controls-container {
        margin-top: 1rem;
        max-height: 20vh;
    }
}

/* 极小高度设备优化 */
@media (max-height: 400px) {
    .left-panel.center-content {
        padding: 15px;
    }
    
    .song-info .album-art {
        max-height: 20vh;
        margin-bottom: 0.5rem;
    }
    
    .song-info .text-info {
        max-height: 15vh;
    }
    
    .song-info .text-info .title {
        font-size: 1rem;
        -webkit-line-clamp: 1;
    }
    
    .song-info .text-info .artist,
    .song-info .text-info .album {
        font-size: 0.8rem;
    }
    
    .playback-controls-container {
        max-height: 15vh;
        margin-top: 0.5rem;
    }
}
</style>