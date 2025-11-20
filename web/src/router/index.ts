import { createRouter, createWebHistory } from 'vue-router';
import AuthLogin from '../pages/AuthLogin.vue';
import AuthRegister from '../pages/AuthRegister.vue';
import HomePage from '../pages/HomePage.vue';
import ChatPage from '../pages/ChatPage.vue';
import ProfilePage from '../pages/ProfilePage.vue';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/auth/login' },
    { path: '/auth/login', name: 'login', component: AuthLogin },
    { path: '/auth/register', name: 'register', component: AuthRegister },
    { path: '/home', name: 'home', component: HomePage, meta: { requiresAuth: true } },
    { path: '/chat/:id?', name: 'chat', component: ChatPage, meta: { requiresAuth: true } },
    { path: '/profile', name: 'profile', component: ProfilePage, meta: { requiresAuth: true } }
  ]
});

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();
  auth.hydrate();
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: 'login' });
  } else if ((to.name === 'login' || to.name === 'register') && auth.isAuthenticated) {
    next({ name: 'home' });
  } else {
    next();
  }
});

export default router;
