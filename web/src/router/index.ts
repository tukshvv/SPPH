import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../pages/HomePage.vue';
import ChatPage from '../pages/ChatPage.vue';
import DocsPage from '../pages/DocsPage.vue';
import ProfilePage from '../pages/ProfilePage.vue';
import DashboardPage from '../pages/DashboardPage.vue';
import AgentPage from '../pages/AgentPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatPage
    },
    {
      path: '/docs',
      name: 'docs',
      component: DocsPage
    },
    {
      path: '/agent',
      name: 'agent',
      component: AgentPage
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfilePage
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardPage
    }
  ]
});

export default router;
