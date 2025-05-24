/**
 * 解析 LRC 歌词字符串
 * @param {string} lrcString - LRC 格式的歌词字符串
 * @returns {Array<{time: number, text: string}>} - 解析后的歌词数组
 */
export function parseLrc(lrcString) {
    if (!lrcString) {
      return [];
    }

    const lines = lrcString.split('\n'); // 按行分割歌词
    const normalLyrics = []; // 存储解析后的正常歌词对象

    // 正则表达式匹配时间标签 [mm:ss.xx] 或 [mm:ss:xx]
    const timeTagRegex = /\[(\d{2}):(\d{2})[.:](\d{2,3})\]/g;

    lines.forEach(line => {
      let text = line;
      let match;
      const timestamps = [];

      // 重置 lastIndex，确保正则从行的开头开始匹配
      timeTagRegex.lastIndex = 0;
      while ((match = timeTagRegex.exec(line)) !== null) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = parseInt(match[3], 10);

        // 计算总秒数
        // 处理两位或三位毫秒
        const totalTime = minutes * 60 + seconds + (milliseconds.toString().length === 3 ? milliseconds / 1000 : milliseconds / 100);

        timestamps.push(totalTime);
      }
       // 获取去除所有时间标签后的文本内容，并去除首尾空白
       text = line.replace(timeTagRegex, '').trim();


      // 如果找到了时间标签
      if (timestamps.length > 0) {
          timestamps.forEach(time => {
              // 只添加有时间标签的行到正常歌词列表
              normalLyrics.push({ time: time, text: text });
          });
      }
        // 忽略没有时间标签的行（可能是歌曲信息等）
    });


    // === 生成开头的空行占位（使用负数时间）===
    const numberOfStartPlaceholderLines = 15; // 开头空行数量，可以调整
    const startPlaceholders = [];
    const invisibleText = '\u00A0'; // 使用非换行空格作为不可见文本

    for (let i = 0; i < numberOfStartPlaceholderLines; i++) {
        // 创建负数时间戳，例如 -5, -4, -3, -2, -1
        // 从负数开始递增，确保排序时它们按顺序排在最前面
        const negativeTime = -numberOfStartPlaceholderLines + i;
        startPlaceholders.push({ time: negativeTime, text: invisibleText });
    }
    // ===========================================


    // 将开头的占位行和正常歌词合并
    const lyricsWithStartPlaceholders = [...startPlaceholders, ...normalLyrics];


    // 按时间戳排序（现在包含负数时间）
    // 这里的排序会正确处理负数和正数
    lyricsWithStartPlaceholders.sort((a, b) => a.time - b.time);


    // === 生成结尾的空行占位（使用正数时间）===
    const numberOfEndPlaceholderLines = 15; // 结尾空行数量，可以调整
    const endPlaceholderTime = 999; // 设置一个足够大的时间戳
    // invisibleText already defined

    for (let i = 0; i < numberOfEndPlaceholderLines; i++) {
        // 将占位行的文本设置为不可见字符
        // 使用不同的时间戳避免排序问题（虽然时间很大，但保持好习惯）
        lyricsWithStartPlaceholders.push({ time: endPlaceholderTime + i, text: invisibleText });
    }
    // =========================================


    return lyricsWithStartPlaceholders; // 返回包含开头和结尾占位行的数组
}