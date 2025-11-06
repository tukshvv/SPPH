import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './assets/main.css';
import { useUserStore } from './stores/user';
import { useMetricsStore } from './stores/metrics';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const userStore = useUserStore(pinia);
userStore.initialize();

const metricsStore = useMetricsStore(pinia);
metricsStore.bindLifecycle();

app.mount('#app');
