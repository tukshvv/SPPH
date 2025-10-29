import { createRouter, createWebHistory } from 'vue-router';
import ChatPage from '../pages/ChatPage.vue';
import DashboardPage from '../pages/DashboardPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'chat',
      component: ChatPage
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardPage
    }
  ]
});

export default router;
