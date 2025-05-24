<template>
    <div class="lyrics-display">
      <div
        v-for="(lyric, index) in lyrics"
        :key="index"
        class="lyric-line"
        :class="{ active: isActiveLyric(lyric, index) }" :ref="el => { if (isActiveLyric(lyric, index)) activeLyricRef = el }"
        >
        {{ lyric.text }}
      </div>
    </div>
  </template>
  
  <script setup>
    import { defineProps, ref, watch, nextTick, computed } from 'vue';
  
    // ... (props 和 activeLyricRef 定义保持不变) ...
     const props = defineProps({
       lyrics: {
         type: Array,
         default: () => []
       },
       currentTime: {
         type: Number,
         default: 0
       }
     });
  
     const activeLyricRef = ref(null);
  
  
    // 判断歌词行是否为当前活跃行 (逻辑不变)
     const isActiveLyric = (lyric, i) => {
       if (!props.lyrics || props.lyrics.length === 0) {
         return false;
       }
  
       const nextLyric = props.lyrics[i + 1];
  
       return props.currentTime >= lyric.time &&
              (!nextLyric || props.currentTime < nextLyric.time);
     };
  
     // 计算当前活跃歌词的索引 (逻辑不变)
     const activeLyricIndex = computed(() => {
         const index = props.lyrics.findIndex((lyric, i) => isActiveLyric(lyric, i));
         // 返回找到的索引，如果没找到（例如，在歌曲开始前），返回 -1
         return index !== -1 ? index : -1;
     });
  
  
    // 监听 currentTime 的变化，当活跃歌词行改变时滚动
    watch(() => props.currentTime, (newTime, oldTime) => {
         // 只有当有活跃歌词索引（大于等于0）且引用存在时才尝试滚动
         if (activeLyricIndex.value >= 0 && activeLyricRef.value) {
             nextTick(() => {
                 const scrollDelay = 600; // 保持延迟，等待 DOM 更新
  
                 setTimeout(() => {
                     // 再次检查元素是否存在
                     if (activeLyricRef.value) {
                         activeLyricRef.value.scrollIntoView({
                             behavior: 'smooth', // 平滑滚动
                             block: 'center'     // 将当前行滚动到容器中央
                         });
                     }else{console.log(activeLyricIndex.value+"|"+props.lyrics.length)}
                 }, scrollDelay);
             });
         }
     });
  
     // 移除 isLyricVisible 函数和相关的 linesBefore/linesAfter 变量
     /*
     const linesBefore = 1;
     const linesAfter = 1;
     const isLyricVisible = (index) => { ... };
     */
  
  </script>
  
  <style scoped>
  .lyrics-display {
    flex-grow: 1;
    overflow-y: auto; /* 确保歌词在自身容器内滚动 */
    padding-right: 15px; /* 为滚动条留出空间 */

     /* 隐藏滚动条 */
      &::-webkit-scrollbar { display: none; }
      -ms-overflow-style: none;
      scrollbar-width: none;

    display: flex;
    flex-direction: column;
    /* 将 align-items 从 center 改为 flex-start，让歌词行靠左对齐 */
    align-items: flex-start;


     /* 歌词面板的左右内边距 */
     padding-left: 20px;
     padding-right: 35px; /* 考虑滚动条宽度 */
     box-sizing: border-box;
     width: 100%;
  }

  /* 歌词行样式 */
  .lyric-line {
    font-size: 4vw; /* 所有歌词的固定字号 */
    color: rgba(255, 255, 255, 0.5); /* 非当前行的颜色 */
    margin-bottom: 6vw; /* 歌词行间距 */
    transition: color 0.3s ease; /* 只保留颜色过渡 */
    line-height: 1.5;
    /* 将 text-align 从 center 改为 left，让歌词文本靠左对齐 */
    text-align: left;
    user-select: none; /* 阻止用户选中歌词 */
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
     /* 移除 opacity: 0; */ /* 所有行都可见 */
     width: 100%; /* 让歌词行宽度占满父容器，这样 text-align: left 才更有意义 */
     box-sizing: border-box; /* 确保 padding 不增加宽度 */
  }

  /* 当前正在播放的歌词行样式 */
  .lyric-line.active {
    color: var(--primary-text-color); /* 主文本颜色 (高亮) */
    font-weight: bold; /* 加粗 */
  }

   /* 可选：歌词淡入淡出效果 */
   /* 这通常通过在 .lyrics-display 容器上应用一个 linear-gradient 作为 mask 来实现 */

   .lyrics-display {
       mask-image: linear-gradient(to bottom, transparent 15%, black 50%, black 30%, transparent 100%);
       -webkit-mask-image: linear-gradient(to bottom, transparent 20%, black 55%, black 75%, transparent 100%);
   }


</style>