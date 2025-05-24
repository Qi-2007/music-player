<script setup>
import { computed, defineProps, nextTick, ref, watch } from 'vue';

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
const isUserScrolling = ref(false);
const lyricsContainer = ref(null);
let scrollTimeout = null;
const previousActiveLyricIndex = ref(-1); // 新增：记录上一个活跃歌词的索引

const isActiveLyric = (lyric, i) => {
  if (!props.lyrics || props.lyrics.length === 0) {
    return false;
  }
  const nextLyric = props.lyrics[i + 1];
  return props.currentTime >= lyric.time &&
         (!nextLyric || props.currentTime < nextLyric.time);
};

const activeLyricIndex = computed(() => {
  const index = props.lyrics.findIndex((lyric, i) => isActiveLyric(lyric, i));
  return index !== -1 ? index : -1;
});

const setActiveLyricElement = (el) => {
  activeLyricRef.value = el;
};

watch(activeLyricIndex, async (newIndex, oldIndex) => {
  if (newIndex !== -1 && newIndex !== oldIndex && !isUserScrolling.value) {
    await nextTick();
    const activeElement = lyricsContainer.value && lyricsContainer.value.children[newIndex];
    if (activeElement) {
      activeLyricRef.value = activeElement;
      setTimeout(() => {
        if (activeLyricRef.value && lyricsContainer.value && !isUserScrolling.value) {
          activeLyricRef.value.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          previousActiveLyricIndex.value = newIndex; // 更新上一个活跃歌词的索引
        } else {
          console.log(`[Scroll Blocked] Index: ${newIndex}, Lyrics Length: ${props.lyrics.length}, Scrolling: ${isUserScrolling.value}, Container: ${lyricsContainer.value}`);
        }
      }, 200);
    } else {
      console.log('Active element not found.');
    }
  } else if (newIndex !== -1 && oldIndex === -1 && !isUserScrolling.value) {
    // 处理歌曲开始时第一次高亮歌词的情况
    await nextTick();
    const activeElement = lyricsContainer.value && lyricsContainer.value.children[newIndex];
    if (activeElement) {
      activeLyricRef.value = activeElement;
      setTimeout(() => {
        if (activeLyricRef.value && lyricsContainer.value && !isUserScrolling.value) {
          activeLyricRef.value.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          previousActiveLyricIndex.value = newIndex;
        }
      }, 600);
    }
  }
});

const handleScrollStart = () => {
  isUserScrolling.value = true;
};

const handleScrollEnd = () => {
  isUserScrolling.value = false;
};

const handleWheel = () => {
  isUserScrolling.value = true;
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    isUserScrolling.value = false;
  }, 200);
};
</script>

<template>
  <div
    class="lyrics-display"
    @mousedown="handleScrollStart"
    @touchstart="handleScrollStart"
    @mouseup="handleScrollEnd"
    @touchend="handleScrollEnd"
    @mouseleave="handleScrollEnd"
    ref="lyricsContainer"
    @wheel="handleWheel"
  >
    <div
      v-for="(lyric, index) in lyrics"
      :key="index"
      class="lyric-line"
      :class="{ active: isActiveLyric(lyric, index) }"
      :ref="(el) => isActiveLyric(lyric, index) ? setActiveLyricElement(el) : null"
      @click="$emit('lyric-clicked', lyric.time)"
    >
      {{ lyric.text }}
    </div>
  </div>
</template>
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