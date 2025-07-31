import { createRouter, createWebHistory } from 'vue-router';
import api from '@/plugins/axios.js';

const routes = [
    {
        path: '/login',
        name: 'loginPage',
        alias: '/',
        component: () => import('@/page/Login.vue'),
    },
    {
        path: '/home',
        name: 'HomePage',
        component: () => import('@/page/Home.vue'),
        meta: { requiresAuth: true }, // 로그인 필요
    },
    {
        path: '/admin/',
        name: 'adminHome',
        component: () => import('@/page/admin/Admin.vue'),
        meta: { requiresAuth: true, adminOnly: true },
    },
    {
        path: '/sign-up',
        name: 'signUp',
        component: () => import('@/page/SignUp.vue'),
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});


router.beforeEach((to, from, next) => {
    const hasToken = document.cookie.includes("loginDummy");


    if (!hasToken && to.name !== 'loginPage') {
        console.log("if문 안에 있음")
        next({ name: 'loginPage' });
    } else {
        console.log("else 문 확인")
        next();
    }
});

export default router;
