import { createApp } from 'vue';
import App from './App.vue'; // 确保正确导入 App.vue
//import './style.css'; // 或 './style.scss'，或者如果你在 App.vue 中写了所有全局样式，这行可能被移除了或指向 App.vue

createApp(App).mount('#app') // 确保这一行存在，并且 '#app' 和 index.html 中的 id 匹配