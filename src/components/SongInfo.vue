<template>
    <div class="song-info">
      <div class="album-art">
        <img :src="song.coverUrl" :alt="song.album" />
      </div>

      <div class="text-info">
        <div class="song-title">{{ song.title }}</div> <div class="song-artist">{{ song.artist }}</div> <div class="song-album">{{ song.album }}</div> </div>
    </div>
  </template>

  <script setup>
    import { defineProps } from 'vue';

    // 定义接收一个 song 对象作为 prop
    const props = defineProps({
      song: {
        type: Object,
        // 提供一个包含默认值的空对象作为默认值，防止访问不存在的属性报错
        default: () => ({
          id: null,
          title: '未知歌曲',
          artist: '未知艺术家',
          album: '未知专辑',
          coverUrl: '/cover.jpg', // 请替换为你的默认封面图片路径
          audioUrl: null,
          lrcString: null
        })
        // 如果需要更严格的验证，可以添加 validator 函数
        // validator: (value) => {
        //   return value && typeof value.title === 'string' && typeof value.artist === 'string';
        // }
      }
    });
  </script>

  <style scoped>
  .song-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 30px; /* 增加与下方播放控制的间距 */
    width: 100%;
     max-width: 500px; /* 例如设置一个最大宽度 */
  }

  .album-art {
    width: 100%; /* 封面宽度占容器的比例 */
    border-radius: 8px; /* 圆角 */
    overflow: hidden;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4); /* 调整阴影效果，更明显一些 */
     margin-bottom: 30px; /* 增加封面与文本信息的间距 */
  }

  .album-art img {
    display: block;
    width: 100%;
    height: auto;
  }

  .text-info {
    text-align: center;
  }

  .song-title {
    font-size: 28px; /* 标题字体大小 */
    font-weight: bold;
    color: var(--primary-text-color);
    margin-bottom: 8px; /* 调整标题与艺术家间距 */
     white-space: nowrap;
     overflow: hidden;
     text-overflow: ellipsis;
     width: 100%; /* 配合 text-overflow */
  }

  .song-artist,
  .song-album {
    font-size: 18px; /* 艺术家和专辑字体大小 */
    color: var(--secondary-text-color);
    margin-top: 5px; /* 调整间距 */
     white-space: nowrap;
     overflow: hidden;
     text-overflow: ellipsis;
     width: 100%;
  }
</style>