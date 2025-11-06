import { createRouter, createWebHistory } from 'vue-router';
import ChatPage from '../pages/ChatPage.vue';
import DocsPage from '../pages/DocsPage.vue';
import ProfilePage from '../pages/ProfilePage.vue';
import DashboardPage from '../pages/DashboardPage.vue';
import AgentPage from '../pages/AgentPage.vue';
import AuthPage from '../pages/AuthPage.vue';
import { useUserStore } from '../stores/user';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'chat',
      component: ChatPage
    },
    {
      path: '/chat',
      redirect: '/' 
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthPage
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

const publicRoutes = new Set(['auth']);

router.beforeEach((to) => {
  const userStore = useUserStore();
  userStore.initialize();

  const targetName = typeof to.name === 'string' ? to.name : undefined;
  if (!userStore.userId && (!targetName || !publicRoutes.has(targetName))) {
    const query = to.fullPath && to.fullPath !== '/' ? { redirect: to.fullPath } : undefined;
    return { name: 'auth', query };
  }

  if (userStore.userId && targetName === 'auth') {
    return { path: '/' };
  }

  return true;
});

export default router;
