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
        />
      </div>

      <div class="right-panel">
        <LyricsDisplay :lyrics="currentLyrics" :currentTime="currentTime" @lyric-clicked="handleLyricClicked" />
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
  import { onMounted, ref } from 'vue';
import { getPlaylist, setPlaylist } from './utils/playlistStorage';

  const playlist = ref(getPlaylist());

  const updatePlaylist = (newPlaylist) => {
    playlist.value = newPlaylist;
    setPlaylist(newPlaylist);
    console.log('Playlist updated:', newPlaylist);
  };

  const addSongToPlaylist = (song) => {
    updatePlaylist([...playlist.value, song]);
  };

  const removeSongFromPlaylist = (songId) => {
    const newPlaylist = playlist.value.filter(s => s.id !== songId);
    updatePlaylist(newPlaylist);
  };

  const setCurrentSongIndex = (index) => {
    if (index >= 0 && index < playlist.value.length) {
      currentSongIndex.value = index;
      // 触发音频源更新等操作，例如：
      // if (audioPlayer.value) {
      //   audioPlayer.value.src = playlist.value[currentSongIndex.value].audioUrl;
      //   audioPlayer.value.play().catch(e => console.error("Error playing audio:", e));
      // }
    }
  };

  // ---- 播放列表和当前歌曲状态 ----
  const currentSongIndex = ref(0);
  const currentSong = computed(() => playlist.value[currentSongIndex.value] || {});
  const currentLyrics = computed(() => {
    const song = currentSong.value;
    if (song && song.lrcString) {
      return parseLrc(song.lrcString);
    }
    return [];
  });

  // ---- Broadcast Channel for cross-tab communication ----
  const playlistChannel = new BroadcastChannel('music-player-playlist-updates');
  const handleLyricClicked = (time) => {
    currentTime.value = time;
    if (audioPlayer.value) {
      audioPlayer.value.currentTime = time;
      if (!isPlaying.value) {
        play(); // 可选：点击歌词后自动播放
      }
    }
    console.log('歌词被点击，跳转到时间:', time);
  };
  onMounted(() => {
    // 监听来自其他标签页/窗口的 Local Storage 更新
    window.onstorage = (event) => {
      if (event.key === 'music-player-playlist') {
        console.log('Local Storage playlist updated by another tab/window');
        playlist.value = getPlaylist();
        // 你的播放列表显示组件会自动更新，因为 playlist 是一个 ref
      }
    };

    playlistChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'playlistUpdated') {
        console.log('Playlist updated via Broadcast Channel');
        playlist.value = getPlaylist();
      }
    };

    // 初始化加载时可能需要做一些事情，例如设置初始歌曲
    if (playlist.value.length > 0 && currentSong.value === undefined) {
      // 设置第一首歌为初始歌曲
      // 注意：这里只是一个示例，你需要根据你的具体逻辑来决定
      currentSongIndex.value = 0;
    }
  });

  // ---- 记得导入你可能用到的其他 ref 和 computed 属性 ----
  import { computed, watch } from 'vue';
import LyricsDisplay from './components/LyricsDisplay.vue';
import PlaybackControls from './components/PlaybackControls.vue';
import SongInfo from './components/SongInfo.vue';
import { parseLrc } from './utils/lrcParser';

  // ---- 你的其他 ref 和 computed 属性 (从你之前的 App.vue 中复制过来) ----
  const audioPlayer = ref(null);
  const isPlaying = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const volume = ref(0.5);

  // ---- 监听音量变化 ----
  watch(volume, (newVolume) => {
    if(audioPlayer.value) {
      audioPlayer.value.volume = newVolume;
    }
  });

  // ---- 音频事件处理函数 (从你之前的 App.vue 中复制过来) ----
  const handlePlay = () => { isPlaying.value = true; console.log('Playback started'); };
  const handlePause = () => { isPlaying.value = false; console.log('Playback paused'); };
  const handleTimeUpdate = () => { if (audioPlayer.value) { currentTime.value = audioPlayer.value.currentTime; } };
  const handleLoadedMetadata = () => { if (audioPlayer.value) { duration.value = audioPlayer.value.duration; console.log('Metadata loaded, duration:', duration.value); } };
  const handleEnded = () => { console.log('Playback ended'); isPlaying.value = false; playNext(); };

  // ---- 播放控制方法 (从你之前的 App.vue 中复制过来) ----
  const play = () => { if (audioPlayer.value) { audioPlayer.value.play().catch(e => console.error("Error playing audio:", e)); } };
  const pause = () => { if (audioPlayer.value) { audioPlayer.value.pause(); } };
  const togglePlayPause = () => { if (isPlaying.value) { pause(); } else { play(); } };
  const handleSeek = (time) => { if (audioPlayer.value) { audioPlayer.value.currentTime = time; console.log('Seeking to:', time); } };

  const playNext = () => {
    currentSongIndex.value = (currentSongIndex.value + 1) % playlist.value.length;
    if(audioPlayer.value) {
      setTimeout(() => {
        play();
      }, 50);
    }
    console.log('Playing next song:', currentSong.value.title);
  };

  const playPrevious = () => {
    currentSongIndex.value = (currentSongIndex.value - 1 + playlist.value.length) % playlist.value.length;
    if(audioPlayer.value) {
      setTimeout(() => {
        play();
      }, 50);
    }
    console.log('Playing previous song:', currentSong.value.title);
  };

  const handleVolumeChange = (newVolume) => {
    volume.value = newVolume;
    console.log('Volume changed to:', newVolume);
  };
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