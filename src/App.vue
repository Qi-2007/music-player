<template>
  <div id="app">
    <div class="playback-container">
      <div class="blurred-background" :style="{ backgroundImage: 'url(' + currentSong.coverUrl + ')' }"></div>
      <div class="left-panel">
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

      <div class="right-panel">
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

  // ---- 音频事件处理函数 (保持不变) ----
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

  // ---- 播放控制方法 (保持不变) ----
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
        audioPlayer.value.currentTime = currentTime.value; // 使用加载的进度时间
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


  // ---- 生命周期钩子和状态持久化 ----
  onMounted(() => {
    let loadedSongId = loadCurrentSongId(MUSIC_PLAYER_CURRENT_SONG_ID_KEY);
    let loadedTime = loadCurrentTime('music-player-current-time'); // 先加载，但可能被覆盖
    // 1. 优先加载来自下载器（或其他标签页）的临时播放列表
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

          // **核心修改：如果来自下载器的新列表，则强制重置播放时间**
          currentTime.value = 0; // **强制从 0 开始播放新列表**
          console.log('播放器初始化：从下载器 localStorage 加载播放列表和活动项，进度已重置为 0。');

          localStorage.removeItem('musicPlayer_playlist');
          localStorage.removeItem('musicPlayer_currentSongIndex');
        }
      } catch (e) {
        console.error('初始化播放器时解析下载器 localStorage 数据失败:', e);
      }
    } else {
      // 2. 如果没有来自下载器的歌单，则从播放器自身的持久化存储中加载
      console.log('没有检测到来自下载器的歌单，尝试加载播放器自身歌单。');
      playlist.value = getPlaylist('music-player-playlist');

      let foundIndex = -1;
      if (loadedSongId) {
        foundIndex = findSongIndexById(playlist.value, loadedSongId);
      }
      currentSongIndex.value = foundIndex !== -1 ? foundIndex : 0;

      // 只有在加载自身歌单时才恢复保存的进度
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

    // 3. 初始设置音频播放器音量
    if (audioPlayer.value) {
      audioPlayer.value.volume = volume.value;
    }

    initialLoadSong();


    // **处理播放器窗口状态 (保持不变)**
    const savedWindowState = localStorage.getItem(MUSIC_PLAYER_WINDOW_STATE_KEY);
    if (savedWindowState === 'true') {
      console.log('播放窗口被重复打开？');
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

            currentTime.value = 0; // 外部切换，强制从0开始
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
//监听歌曲切换
  watch(currentSongIndex, (newIndex, oldIndex) => {
    //新增修改网站title和icon
    document.title = `${currentSong.value.title}-${currentSong.value.artist} qPlayer`;
    let link = document.querySelector("link[rel~='icon']");
    link.href = currentSong.value.coverUrl;
    //原有逻辑不变
    if (oldIndex !== undefined && newIndex !== oldIndex) {
        if (playlist.value.length > 0 && newIndex >= 0 && newIndex < playlist.value.length) {
            const newSong = playlist.value[newIndex];
            const newAudioUrl = newSong.audioUrl;
            const newSongId = newSong.id;

            saveCurrentSongId(newSongId, MUSIC_PLAYER_CURRENT_SONG_ID_KEY);

            if (audioPlayer.value) {
                if (audioPlayer.value.src !== newAudioUrl) {
                    audioPlayer.value.src = newAudioUrl;
                    console.log('Audio source updated to:', newAudioUrl);

                    audioPlayer.value.load();

                    const oldSongId = playlist.value[oldIndex]?.id;

                    if (newSongId !== oldSongId) {//here maybe have bug
                        currentTime.value = 0;
                        audioPlayer.value.currentTime = 0;
                        console.log(`歌曲切换 ( ${oldIndex}(${oldSongId}) to ${newIndex}(${newSongId}) )，从0开始播放。`);
                    } else {
                        const savedTime = loadCurrentTime('music-player-current-time');
                        currentTime.value = savedTime;
                        audioPlayer.value.currentTime = savedTime;
                        console.log('歌曲ID相同但索引变了，恢复到保存时间点:', currentTime.value);
                    }
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
  overflow: hidden; /* 防止出现全局滚动条 */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: #ffffff;
  background-color: #121212; /* 全局背景色 */
}

/* #app 保持定位 */
#app {
   position: relative; /* 确保子元素的绝对定位是相对于 #app */
   /* 移除 display: flex; justify-content: center; align-items: center; */
}

@keyframes rotate {
  from {
    transform: translate(-50%, -50%) rotate(0deg); /* 居中 + 初始旋转 */
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg); /* 居中 + 最终旋转 */
  }
}

/* 模糊背景元素样式：位于底层 */
 .blurred-background {
  position: absolute; /* 使用绝对定位 */
  top: 50%; /* 顶部边缘放在容器的垂直中心 */
  left: 50%; /* 左侧边缘放在容器的水平中心 */
  /* 使用 vmax 单位确保尺寸总是基于屏幕的最大边 */
  width: 150vmax; /* 设置宽度为视口最大维度的 150% */
  height: 150vmax; /* 设置高度为视口最大维度的 150% */
  /* 150% 是一个经验值，确保旋转时不会露边，可以根据需要微调，但通常 142% (sqrt(2)*100%) 就足够覆盖一个正方形旋转，150% 更安全 */
  background-size: cover; /* 确保背景图像覆盖整个元素 */
  transform: translate(-50%, -50%); /* 将元素自身向左和向上移动自身宽高的一半，实现精确居中 */
   /* background-image 通过 :style 动态绑定在 template 里 */
   filter: blur(100px); /* 模糊效果 */
   opacity: 0.8; /* 透明度 */
   z-index: -1; /* 确保它在内容之下 */
  /* 添加旋转动画 */
  animation: rotate 120s linear infinite; /* 动画名称 时长 速度曲线 重复次数 */
 }


/* playback-container：作为内容容器，填充屏幕，Flex 布局左右分栏 */
.playback-container {
   display: flex; /* 保持 Flexbox 布局实现左右分栏 */
   width: 100%; /* 宽度占满整个视口宽度 */
   height: 100%; /* 高度占满整个视口高度 */
   overflow: hidden; /* 隐藏超出容器的内容 */
   position: relative; /* 保持 relative 定位 */
   background-color: transparent; /* 确保背景是透明的 */
   z-index: 1; /* 确保它在模糊背景之上 */
   align-items: stretch; /* 让 Flex 子项（左右面板）沿交叉轴（垂直）拉伸填充容器高度 */
}

/* 移除伪元素样式 */
.playback-container::before {
   content: none;
}


/* left-panel：Flex Item，内容垂直排列 */
.left-panel {
   flex: 0.2; /* 占据一半宽度 */
   display: flex;
   flex-direction: column;
   align-items: center;
   justify-content: center; /* 内容从顶部开始排列 */
   padding: 8vw; /* 内边距 */
   box-sizing: border-box;
   position: relative;
   z-index: 1;
   min-height: 0; 
}

/* right-panel：Flex Item，自身也是一个 Flex 容器来管理歌词滚动 */
.right-panel {
   flex: 1.8; /* 占据一半宽度 */
   padding: 4vw; /* 内边距 */
   box-sizing: border-box;
   position: relative;
   z-index: 1;
   /* overflow-y: auto; */ /* 滚动由 LyricsDisplay 自身负责 */

   /* 将 right-panel 自身设置为 Flex 容器 */
   display: flex;
   flex-direction: column; /* 歌词等内容垂直排列 */

   height: 100vh; /* 高度占满整个视口高度 */
   /* 歌词区域将是 right-panel 的 Flex 子项，需要 flex-grow: 1 */
}

/* 调整 LyricsDisplay 组件内部的样式，使其在 right-panel Flex 容器中正确布局和滚动 */
/* 在 src/components/LyricsDisplay.vue 的 style 中添加/修改以下样式 */
/* 关闭按钮样式保持不变 */
 .close-button {
   position: absolute;
   top: 20px;
   left: 20px;
   background: rgba(255, 255, 255, 0.1);
   border: none;
   border-radius: 50%;
   width: 30px;
   height: 30px;
   display: flex;
   justify-content: center;
   align-items: center;
   color: white;
   font-size: 16px;
   cursor: pointer;
   z-index: 10;
   backdrop-filter: blur(5px);
   -webkit-backdrop-filter: blur(5px);
 }

 .close-button:hover {
     background: rgba(255, 255, 255, 0.2);
 }

</style>