<template>
    <div class="playback-controls">
      <div class="progress-bar-container">
        <input
          type="range"
          min="0"
          :max="duration"
          :value="currentTime"
          step="0.1"
          class="progress-slider"
          @input="handleSliderInput"
          @change="handleSliderChange"
          ref="progressBar" >
        <div class="time-labels">
             <span class="current-time">{{ formatTime(currentTime) }}</span> <span class="duration">-{{ formatTime(duration > 0 ? duration - currentTime : 0) }}</span>
        </div>
      </div>

      <div class="main-button-row"> <div class="shuffle-button-wrapper">
              <button class="control-button small">
                   <svg viewBox="0 0 32 28" fill="currentColor" preserveAspectRatio="xMidYMid meet">
                       <path d="M20.767 20.44a.81.81 0 00.49-.183l2.58-2.174c.316-.266.316-.681 0-.955l-2.58-2.183a.81.81 0 00-.49-.183c-.415 0-.673.258-.673.673v1.245h-1.162c-.739 0-1.195-.233-1.718-.847l-1.527-1.801 1.527-1.81c.54-.63.946-.847 1.677-.847h1.203v1.279c0 .407.258.664.673.664a.801.801 0 00.49-.174l2.58-2.175c.316-.266.316-.69 0-.955l-2.58-2.183a.761.761 0 00-.49-.183c-.415 0-.673.258-.673.665v1.386h-1.212c-1.228 0-1.992.34-2.863 1.386l-1.412 1.668-1.469-1.751c-.805-.946-1.569-1.303-2.747-1.303H8.896c-.53 0-.896.348-.896.838s.365.838.896.838h1.437c.697 0 1.162.225 1.685.847l1.519 1.801-1.52 1.81c-.53.623-.954.847-1.643.847H8.896c-.53 0-.896.348-.896.838s.365.838.896.838h1.536c1.179 0 1.901-.356 2.706-1.303l1.478-1.751 1.444 1.718c.822.98 1.627 1.336 2.822 1.336h1.212v1.412c0 .415.258.672.673.672z"></path>
                   </svg>
              </button>
          </div>

          <div class="music-controls__main">
            <button class="control-button large" @click="emit('playPrevious')">
               <svg viewBox="0 0 32 28" fill="currentColor" preserveAspectRatio="xMidYMid meet" style="transform: rotate(180deg);">
                  <path d="M18.14 20.68c.365 0 .672-.107 1.038-.323l8.508-4.997c.623-.365.938-.814.938-1.37 0-.564-.307-.988-.938-1.361l-8.508-4.997c-.366-.216-.68-.324-1.046-.324-.73 0-1.337.556-1.337 1.569v4.773c-.108-.399-.406-.73-.904-1.021L7.382 7.632c-.357-.216-.672-.324-1.037-.324-.73 0-1.345.556-1.345 1.569v10.235c0 1.013.614 1.569 1.345 1.569.365 0 .68-.108 1.037-.324l8.509-4.997c.49-.29.796-.631.904-1.038v4.79c0 1.013.615 1.569 1.345 1.569z" fill-rule="nonzero"></path>
               </svg>
            </button>

            <button class="control-button huge playback-controls-play" @click="emit('togglePlayPause')">
              <svg v-if="isPlaying" viewBox="0 0 32 28" fill="currentColor" preserveAspectRatio="xMidYMid meet">
                  <path d="M13.293 22.772c.955 0 1.436-.481 1.436-1.436V6.677c0-.98-.481-1.427-1.436-1.427h-2.457c-.954 0-1.436.473-1.436 1.427v14.66c-.008.954.473 1.435 1.436 1.435h2.457zm7.87 0c.954 0 1.427-.481 1.427-1.436V6.677c0-.98-.473-1.427-1.428-1.427h-2.465c-.955 0-1.428.473-1.428 1.427v14.66c0 .954.473 1.435 1.428 1.435h2.465z" fill-rule="nonzero"></path> </svg>
              <svg v-else viewBox="0 0 32 28" fill="currentColor" preserveAspectRatio="xMidYMid meet">
                  <path d="M10.345 23.287c.415 0 .763-.15 1.22-.407l12.742-7.404c.838-.481 1.178-.855 1.178-1.46 0-.599-.34-.972-1.178-1.462L11.565 5.158c-.457-.265-.805-.407-1.22-.407-.789 0-1.345.606-1.345 1.57V21.71c0 .971.556 1.577 1.345 1.577z" fill-rule="nonzero"></path> </svg>
            </button>

            <button class="control-button large" @click="emit('playNext')">
                <svg viewBox="0 0 32 28" fill="currentColor" preserveAspectRatio="xMidYMid meet">
                  <path d="M18.14 20.68c.365 0 .672-.107 1.038-.323l8.508-4.997c.623-.365.938-.814.938-1.37 0-.564-.307-.988-.938-1.361l-8.508-4.997c-.366-.216-.68-.324-1.046-.324-.73 0-1.337.556-1.337 1.569v4.773c-.108-.399-.406-.73-.904-1.021L7.382 7.632c-.357-.216-.672-.324-1.037-.324-.73 0-1.345.556-1.345 1.569v10.235c0 1.013.614 1.569 1.345 1.569.365 0 .68-.108 1.037-.324l8.509-4.997c.49-.29.796-.631.904-1.038v4.79c0 1.013.615 1.569 1.345 1.569z" fill-rule="nonzero"></path>
               </svg>
            </button>
          </div>

           <div class="repeat-button-wrapper">
                <button class="control-button small">
                   <svg viewBox="0 0 32 28" fill="currentColor" preserveAspectRatio="xMidYMid meet"> <path d="M9.545 14.272a.856.856 0 00.863-.855v-.448c0-1.004.706-1.677 1.785-1.677h5.005v1.362c0 .407.258.664.673.664a.745.745 0 00.49-.183l2.581-2.166c.316-.266.316-.69 0-.955l-2.581-2.183a.745.745 0 00-.49-.183c-.415 0-.672.258-.672.665v1.294h-4.881c-2.217 0-3.628 1.254-3.628 3.213v.597c0 .474.382.855.855.855zm4.864 5.952c.407 0 .664-.257.664-.664v-1.303h4.881c2.225 0 3.628-1.254 3.628-3.213v-.597a.854.854 0 10-1.71 0v.448c0 1.004-.714 1.677-1.793 1.677h-5.006v-1.353c0-.407-.257-.664-.664-.664a.767.767 0 00-.498.182l-2.573 2.175c-.324.257-.315.68 0 .946l2.573 2.192a.807.807 0 00.498.174z" fill-rule="nonzero"></path>
                   </svg>
              </button>
          </div>
      </div>

      <div class="volume-control-row"> <div class="volume-control">
               <button class="control-button small"> <svg class="chrome-volume__icon" role="presentation" version="1.1" viewBox="0 0 64 64" fill="currentColor" preserveAspectRatio="xMidYMid meet" ><path transform="translate(2,11.149)" d="m23.477 39.911c1.4129 0 2.431-1.0389 2.431-2.431v-33.141c0-1.3921-1.0181-2.5349-2.4726-2.5349-1.0181 0-1.7038 0.43634-2.805 1.4752l-9.2046 8.6644c-0.14545 0.12464-0.31166 0.18698-0.51945 0.18698h-6.2126c-2.9297 0-4.5088 1.5999-4.5088 4.7374v8.0411c0 3.1167 1.5791 4.7166 4.5088 4.7166h6.2126c0.20779 0 0.374 0.06234 0.51945 0.18698l9.2046 8.7475c0.99732 0.93501 1.8285 1.3506 2.8466 1.3506z"></path><path class="chrome-volume__wave chrome-volume__wave-1" transform="translate(2,11.149)" d="m34.864 29.959c0.70647 0.49868 1.7246 0.35323 2.3271-0.47787 1.6205-2.1817 2.5971-5.3815 2.5971-8.6436 0-3.2621-0.9766-6.4411-2.5971-8.6436-0.60255-0.83111-1.5999-0.97655-2.3271-0.49868-0.89345 0.62336-1.0181 1.683-0.35319 2.5765 1.2051 1.6207 1.9323 4.0932 1.9323 6.5658 0 2.4726-0.76881 4.9451-1.9531 6.5866-0.62332 0.89345-0.51945 1.9116 0.374 2.5349z"></path><path class="chrome-volume__wave chrome-volume__wave-2" transform="translate(2,11.149)" d="m43.154 35.569c0.81021 0.54023 1.8077 0.33245 2.3894-0.49867 2.7426-3.8231 4.3426-8.9137 4.3426-14.233 0-5.3399-1.5583-10.451-4.3426-14.254-0.60255-0.81034-1.5791-1.0181-2.3894-0.47787-0.78979 0.54021-0.91447 1.5583-0.29106 2.4518 2.2647 3.3245 3.6779 7.6878 3.6779 12.28s-1.3923 8.9969-3.6779 12.28c-0.60255 0.89345-0.49872 1.9116 0.29106 2.4518z"></path><path class="chrome-volume__wave chrome-volume__wave-3" transform="translate(2,11.149)" d="m51.527 41.241c0.76894 0.51945 1.7872 0.31166 2.3898-0.54021 3.8438-5.423 6.0255-12.446 6.0255-19.864s-2.2443-14.42-6.0255-19.864c-0.60255-0.87268-1.6209-1.0805-2.3898-0.54021-0.78936 0.56098-0.91404 1.5791-0.31149 2.4518 3.3451 4.9244 5.423 11.241 5.423 17.952 0 6.7113-1.9945 13.132-5.423 17.952-0.60255 0.87268-0.47787 1.8908 0.31149 2.4518z"></path></svg>
              </button>
              <input
                type="range"
                min="0"
                max="1"
                :value="volume"
                step="0.01"
                class="volume-slider"
                @input="handleVolumeSliderChange"
                ref="volumeBar" >
          </div>
      </div>
    </div>
  </template>

  <script setup>
    // 导入 ref 和 onMounted
    import { defineProps, defineEmits, ref, onMounted, watch } from 'vue';

    const props = defineProps({
      isPlaying: { type: Boolean, default: false },
      currentTime: { type: Number, default: 0 },
      duration: { type: Number, default: 0 },
      volume: { type: Number, default: 0.5 },
    });

    const emit = defineEmits(['togglePlayPause', 'seek', 'playNext', 'playPrevious', 'setVolume']);

    // 创建对滑块元素的引用
    const progressBar = ref(null);
    const volumeBar = ref(null);

    // 更新滑块填充样式的函数
    const updateSliderFill = (sliderElement, value, max) => {
        if (!sliderElement || !max || max === 0) {
            // 如果元素或最大值无效，设置填充为 0%
            if (sliderElement) {
                 sliderElement.style.setProperty('--fill-percentage', '0%');
            }
             return;
        }
        // 计算填充百分比
        const percentage = (value / max) * 100;
        // 设置 CSS 变量 --fill-percentage
        sliderElement.style.setProperty('--fill-percentage', `${percentage}%`);
    };


    const handleSliderInput = (event) => {
        // 当滑块拖动时，实时更新填充样式
        const value = parseFloat(event.target.value);
        updateSliderFill(progressBar.value, value, props.duration);
        // emit('seek', value); // Seek 只在 change 时触发，input 用于实时更新 UI
    };

    const handleSliderChange = (event) => {
        // 当滑块释放时，触发 seek 事件
        const time = parseFloat(event.target.value);
        emit('seek', time);
        // 确保松开滑块后样式也正确更新一次（虽然 input 已经做了）
        updateSliderFill(progressBar.value, time, props.duration);
    };

    const handleVolumeSliderChange = (event) => {
        const newVolume = parseFloat(event.target.value);
        // 当音量滑块调节时，实时更新填充样式
        updateSliderFill(volumeBar.value, newVolume, 1); // 音量 max 是 1
        emit('setVolume', newVolume);
    };

    const formatTime = (seconds) => {
         if (isNaN(seconds) || seconds < 0) {
            return '0:00';
         }
         const minutes = Math.floor(seconds / 60);
         const remainingSeconds = Math.floor(seconds % 60);
         const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;
         return `${minutes}:${formattedSeconds}`;
     };

     // 在组件挂载后，初始化滑块填充样式
     onMounted(() => {
         updateSliderFill(progressBar.value, props.currentTime, props.duration);
         updateSliderFill(volumeBar.value, props.volume, 1);
     });

     // 监听 props 的变化，确保外部数据更新时滑块样式也更新
     watch(() => props.currentTime, (newValue) => {
         updateSliderFill(progressBar.value, newValue, props.duration);
     });

      watch(() => props.duration, (newValue) => {
          // 当歌曲切换或 duration 变化时，更新进度条样式
          updateSliderFill(progressBar.value, props.currentTime, newValue);
      });


     watch(() => props.volume, (newValue) => {
         updateSliderFill(volumeBar.value, newValue, 1);
     });


  </script>
<style scoped>
/* ======================================== */
/* === 最终滑块样式：移除边框和阴影 === */
/* ======================================== */

/* 保持核心布局和按钮样式 */
.playback-controls {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 30px;
  max-width: 500px; /* 限制控制条的最大宽度 */
}

.progress-bar-container {
    width: 100%;
    margin-bottom: 10px;
    text-align: center;
}

 .time-labels {
     font-size: 14px;
      /* 将时间标签也改为亮色 */
     color: var(--primary-text-color); /* 使用亮色 */
     margin-top: 5px;
     display: flex;
     justify-content: space-between;
     width: 100%;
     padding: 0 5px;
     box-sizing: border-box;
 }
  /* 剩余时间标签颜色调整为暗色 */
.time-labels .duration {
    color: var(--secondary-text-color);
    margin-left: 5px; /* 与当前时间稍作间隔 */
 }
.time-labels .time-separator {
     color: var(--secondary-text-color); /* 斜杠颜色 */
}


/* 主要控制按钮行 */
.main-button-row {
    display: flex;
    align-items: center;
    width: 100%;
    justify-content: space-between;
    margin-top: 10px;
}

/* 小尺寸按钮容器 (随机播放，重复播放，音量图标) */
.control-button.small {
     width: 50px;
     height: 50px;
     flex-shrink: 0;
     flex-grow: 0;
     display: flex;
     justify-content: center;
     align-items: center;
     padding: 0;
     border: none;
     background: none;
     color: var(--control-button-color);
     cursor: pointer;
     transition: opacity 0.2s ease-in-out;
     overflow: hidden;
}
/* 随机播放按钮 wrapper */
.shuffle-button-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
}

/* 大尺寸按钮容器 (上一曲/下一曲) */
.control-button.large {
     width: 60px;
     height: 60px;
     flex-shrink: 0;
     flex-grow: 0;
     display: flex;
     justify-content: center;
     align-items: center;
     padding: 0;
     border: none;
     background: none;
     color: var(--control-button-color);
     cursor: pointer;
     transition: opacity 0.2s ease-in-out;
     overflow: hidden;
}

/* 主要控制按钮组 (上一曲，播放/暂停，下一曲) */
.music-controls__main {
 display: flex;
 align-items: center;
  gap: 20px;
}

/* 超大尺寸按钮容器 (播放/暂停) */
.control-button.huge {
    width: 80px;
    height: 80px;
    flex-shrink: 0;
    flex-grow: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    border: none;
    background: none;
    color: var(--control-button-color);
    cursor: pointer;
    transition: opacity 0.2s ease-in-out;
    overflow: hidden;
}

/* SVG styling within buttons */
.control-button svg {
    display: block;
    width: 70%;
    height: 70%;
}

/* Adjust SVG size for different button sizes */
 .control-button.large svg {
      width: 60%;
      height: 60%;
 }

  .control-button.huge svg {
      width: 80%;
      height: 80%;
  }

 /* Specific size for Volume Icon SVG */
 .volume-control .control-button.small svg {
      width: 25px;
      height: 25px;
 }

.control-button:hover { opacity: 0.8; }

/* Volume control row */
.volume-control-row {
   display: flex;
   align-items: center;
   width: 100%;
   margin-top: 15px;
    padding: 0;
    box-sizing: border-box;
}

/* Volume control container (Icon and Slider) */
.volume-control {
   display: flex;
   align-items: center;
    flex-shrink: 0;
    gap: 2px;
    width: 100%;
}

/* Repeat button wrapper */
.repeat-button-wrapper {
     display: flex;
    justify-content: center;
    align-items: center;
}

/* ======================================== */
/* === Final Slider Styles === */
/* ======================================== */

/* 通用滑块轨道样式 */
.progress-slider,
.volume-slider {
  width: 100%;
  -webkit-appearance: none;
  appearance: none;

  height: 4px; /* 轨道高度 */
  outline: none; /* 移除轨道本身的 outline */
  cursor: pointer;
  border-radius: 2px; /* 轨道圆角 */
  opacity: 1;
  transition: opacity .2s;

  /* 线性渐变背景，用于轨道填充（使用硬编码颜色）*/
  background: linear-gradient(to right,
      #ffffff 0%, /* 硬编码亮色（假设是白色） */
      #ffffff var(--fill-percentage, 0%), /* 硬编码亮色到填充百分比位置 */
      rgba(255, 255, 255, 0.2) var(--fill-percentage, 0%), /* 硬编码暗色从填充百分比位置开始 */
      rgba(255, 255, 255, 0.2) 100% /* 硬编码暗色到 100% 结束 */
  );

   /* 确保背景覆盖整个元素 */
  background-size: 100% 100%;
  background-repeat: no-repeat;

  /* 确保浏览器默认的轨道渲染是关闭的 */
   &::-webkit-slider-runnable-track { background: none; }
   &::-moz-range-track { background: none; }
    &::-ms-track { background: none; }
    /* 确保之前尝试的伪元素填充样式被移除 */
    &::-moz-range-progress { background: none; }
     &::-ms-fill-lower { background: none; }
     &::-ms-fill-upper { background: none; }
}

/* 滑块 (Thumb) 样式 */
.progress-slider::-webkit-slider-thumb,
.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;

  width: 12px; /* 恢复到原始尺寸 */
  height: 12px;
  background-color: var(--primary-text-color); /* 使用亮色变量作为背景色 */
  border-radius: 50%;
  border: none; /* 确保 border 是 none */
  outline: none; /* === 移除 outline === */
  cursor: pointer;
  margin-top: -4px; /* 根据轨道/滑块尺寸调整位置 */

  box-shadow: none; /* === 移除 box-shadow === */
  /* 如果 box-shadow 移除后边框消失，说明是阴影导致的问题。如果还想保留阴影，需要调整阴影参数。 */

  position: relative; /* 用于 z-index */
  z-index: 1;
}

.progress-slider::-moz-range-thumb,
.volume-slider::-moz-range-thumb {
  width: 12px; /* 恢复到原始尺寸 */
  height: 12px;
  background-color: var(--primary-text-color); /* 使用亮色变量作为背景色 */
  border-radius: 50%;
  border: none; /* 确保 border 是 none */
  outline: none; /* === 移除 outline === */
  cursor: pointer;
  /* margin-top 在 Firefox 通常不需要 */
  box-shadow: none; /* === 移除 box-shadow === */
  position: relative; /* 用于 z-index */
  z-index: 1;
}

.progress-slider::-ms-thumb,
.volume-slider::-ms-thumb {
    width: 12px; /* 恢复到原始尺寸 */
  height: 12px;
    background-color: var(--primary-text-color); /* 使用亮色变量作为背景色 */
    border-radius: 50%;
    border: none; /* 确保 border 是 none */
    outline: none; /* === 移除 outline === */
    cursor: pointer;
    margin-top: 0; /* MS 通常不需要负 margin */
    box-shadow: none; /* === 移除 box-shadow === */
    position: relative; /* 用于 z-index */
    z-index: 1;
}
</style>