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
        <LyricsDisplay :lyrics="currentLyrics" :currentTime="currentTime" />
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
  import { ref, computed, onMounted, watch } from 'vue'; // 导入 watch
  import SongInfo from './components/SongInfo.vue';
  import PlaybackControls from './components/PlaybackControls.vue';
  import LyricsDisplay from './components/LyricsDisplay.vue';
  import { parseLrc } from './utils/lrcParser';

  // ---- 响应式状态 ----
  const audioPlayer = ref(null);
  const isPlaying = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const volume = ref(0.5); // <-- 添加音量状态，初始值 0.5

  // ... playlist 和 computed 属性 currentSong, currentLyrics 保持不变 ...
  const playlist = ref([
    {
      id: 1,
      title: 'Da Capo',
      artist: 'HOYO-MiX',
      album: '崩坏3 印象曲',
      coverUrl: '/cover.jpg', // 替换为你实际的封面图片路径
      audioUrl: 'https://ipv4.home.445533.xyz:3116/api/download/2026565329?source=netease&br=128kmp3', // **你需要把音频文件放到 public 文件夹里，并修改这里的路径**
      lrcString: `[00:00.000] 作词 : TetraCalyx\n[00:00.048] 作曲 : 蔡近翰Zoe(HOYO-MiX)\n[00:00.096] 编曲 : 宫奇Gon(HOYO-MiX)/苑迪萌Dimeng Yuan(HOYO-MiX)/崔瀚普TSAR(HOYO-MiX)/车子玉Ziyu Che(HOYO-MiX)\n[00:00.144] 制作人 : 蔡近翰Zoe(HOYO-MiX)\n[00:00.195]When good old friends are going away\n[00:06.838]Will you wish them to remember your name?\n[00:13.480]When good old days are passing away\n[00:19.851]Will you promise your heart remains the same\n[00:27.289]Never can we suspend the time\n[00:33.943]Having to leave the tracks behind\n[00:40.316]there is a longer way ahead, After all.\n[00:54.403]There used to be a story teller\n[01:00.242]who always painted the sunshine and the rain\n[01:07.428]One has to eventually grow up\n[01:13.258]Spending a lifetime to taste the love and pain\n[01:20.705]Never can we suspend the time\n[01:27.345]Having to leave the tracks behind\n[01:33.718]there is a longer way ahead, After all.\n[01:47.005]If it’s too hard to say goodbye\n[01:53.372]Give us a try to sing a rhyme\n[01:59.768]“May you, the beauty of this world, always shine.”\n[02:13.309]\n[02:14.309] 演唱 Vocal Artist：车子玉Ziyu Che(HOYO-MiX)\n[02:14.356] 弦乐 Strings：龙之艺交响乐团Art of Loong Orchestra\n[02:14.403] 弦乐录音棚 Strings Recording Studio：上海音像公司录音棚YX STUDIO\n[02:14.450] 混音 Mixing Engineer：宫奇Gon(HOYO-MiX)\n[02:14.497] 母带 Mastering Engineer：宫奇Gon(HOYO-MiX)\n[02:14.544] 出品 Produced by：HOYO-MiX\n`,
    },    {
      id: 2,
      title: 'Rubia',
      artist: '周深、HOYO-MiX',
      album: '崩坏3 印象曲',
      coverUrl: 'https://imge.kugou.com/stdmusic/240/20240129/20240129181003171581.jpg', // 替换为你实际的封面图片路径
      audioUrl: 'https://ipv4.home.445533.xyz:3116/api/download/034A79E54C345156E34176E771632210%7C5D2B778D428486A17D0129AC3E3CC5A4%7CBCABBF76900C9220EC7023352D38B888?source=kugou&br=128kmp3', // **你需要把音频文件放到 public 文件夹里，并修改这里的路径**
      lrcString: `?[id:$00000000]\r\n[ar:周深]\r\n[ti:Rubia (崩坏3《渡尘》动画短片印象曲)]\r\n[by:]\r\n[hash:034a79e54c345156e34176e771632210]\r\n[al:Rubia]\r\n[sign:]\r\n[qq:]\r\n[total:0]\r\n[offset:0]\r\n[00:00.00]周深、HOYO-MiX - Rubia (崩坏3《渡尘》动画短片印象曲)\r\n[00:01.50]作词：TetraCalyx\r\n[00:02.48]作曲：蔡近翰Zoe(HOYO-MiX)\r\n[00:02.49]编曲：宫奇Gon(HOYO-MiX)、杨启翔Frex(HOYO-MiX)\r\n[00:03.72]Life blooms like a flower\r\n[00:07.01]Far away or by the road\r\n[00:10.57]Waiting for the one\r\n[00:13.86]To find the way back home\r\n[00:17.53]Rain falls a thousand times\r\n[00:21.09]No footprints of come-and-go\r\n[00:24.68]You who once went by\r\n[00:28.29]Where will you belong\r\n[00:30.67]I feel your sigh and breath\r\n[00:33.99]In the last blow of wind\r\n[00:38.43]Not yet for the story on the last page\r\n[00:42.67]It's not the end\r\n[00:46.02]Life blooms like a flower\r\n[00:49.29]Far away or by the road\r\n[00:52.86]Waiting for the one\r\n[00:56.17]To find the way back home\r\n[00:59.96]Time flows across the world\r\n[01:03.44]There is always a longer way to go\r\n[01:08.03]Till I reach your arms\r\n[01:10.37]A Madder there for you\r\n[01:14.39]Up against the stream\r\n[01:17.65]Waterways will join as one\r\n[01:21.17]Tracing to the source\r\n[01:24.67]No more strayed or lost\r\n[01:27.07]You will see petals fly\r\n[01:30.42]When lament becomes carol\r\n[01:34.89]Could you please hear my voice\r\n[01:37.46]That hungers for a duo\r\n[01:42.37]Life blooms like a flower\r\n[01:45.74]Far away or by the road\r\n[01:49.27]Waiting for the one\r\n[01:52.67]To find the way back home\r\n[01:56.38]Time flows across the world\r\n[01:59.85]There is always a longer way to go\r\n[02:04.34]Till I reach your arms\r\n[02:06.77]A Madder there for you\r\n[02:37.12]Life blooms like a flower\r\n[02:40.52]Far away or by the road\r\n[02:44.01]Waiting for the one\r\n[02:47.42]To find the way back home\r\n[02:51.11]Time flows across the world\r\n[02:54.63]There is always a longer way to go\r\n[02:59.12]Till I reach your arms\r\n[03:01.48]A Madder there for you\r\n[03:05.98]人声录音 Recording：徐威Aaron Xu\r\n[03:06.76]混音/母带 Mixing&Mastering Engineer：宫奇Gon(HOYO-MiX)\r\n[03:07.15]制作人 Producer：蔡近翰Zoe(HOYO-MiX)\r\n[03:07.49]特别鸣谢 Special Thanks：周深工作室\r\n[03:07.85]出品 Produced by：HOYO-MiX\r\n`,
    },
    // 可以添加更多歌曲对象
  ]);
  const currentSongIndex = ref(0);
  const currentSong = computed(() => playlist.value[currentSongIndex.value]);
  const currentLyrics = computed(() => {
    const song = currentSong.value;
    if (song && song.lrcString) {
      return parseLrc(song.lrcString);
    }
    return [];
  });


  // ---- 生命周期钩子 ----
  onMounted(() => {
    console.log('Audio player mounted:', audioPlayer.value);
     // 在挂载后设置一次初始音量
     if (audioPlayer.value) {
         audioPlayer.value.volume = volume.value;
     }
  });

  // ---- 监听音量状态变化并更新音频元素音量 ----
  watch(volume, (newVolume) => {
      if(audioPlayer.value) {
          audioPlayer.value.volume = newVolume;
      }
  });


  // ---- 音频事件处理函数 ----
  const handlePlay = () => { isPlaying.value = true; console.log('Playback started'); };
  const handlePause = () => { isPlaying.value = false; console.log('Playback paused'); };
  const handleTimeUpdate = () => { if (audioPlayer.value) { currentTime.value = audioPlayer.value.currentTime; } };
  const handleLoadedMetadata = () => { if (audioPlayer.value) { duration.value = audioPlayer.value.duration; console.log('Metadata loaded, duration:', duration.value); } };
  const handleEnded = () => { console.log('Playback ended'); isPlaying.value = false; playNext(); };


  // ---- 播放控制方法 ----
  const play = () => { if (audioPlayer.value) { audioPlayer.value.play().catch(e => console.error("Error playing audio:", e)); } };
  const pause = () => { if (audioPlayer.value) { audioPlayer.value.pause(); } };
  const togglePlayPause = () => { if (isPlaying.value) { pause(); } else { play(); } };
  const handleSeek = (time) => { if (audioPlayer.value) { audioPlayer.value.currentTime = time; console.log('Seeking to:', time); } };

  const playNext = () => {
     currentSongIndex.value = (currentSongIndex.value + 1) % playlist.value.length;
     // currentSong 变化会更新 audioUrl，浏览器会自动 load
     // 确保加载完成后再尝试播放，或者在loadedmetadata中自动播放
      if(audioPlayer.value) {
           // 简单的延迟播放，确保 src 更新和加载开始
           setTimeout(() => {
               play();
           }, 50); // 延迟一小段时间
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
        volume.value = newVolume; // 更新音量状态
        console.log('Volume changed to:', newVolume);
        // 音量状态的变化会被 watch 监听，从而更新音频元素的实际音量
   };


</script><style>
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