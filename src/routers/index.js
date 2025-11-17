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
        component: () => import('@/components/layout/ShellLayout.vue'),
        meta: { requiresAuth: true }, // 로그인 필요
        children: [
            {path: '', name: 'homeEmpty', component:() => import('@/components/chat/EmptyPanel.vue')},
            {path: 'rooms/:roomId?', name:'chatRoom', component: ()=>import('@/components/chat/ChatPanel.vue')}
        ]
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


    if (!hasToken && to.name !== 'loginPage' && to.name !== 'signUp') {
        console.log("if문 안에 있음")
        console.log("cookie 존재 하지 않음")
        next({ name: 'loginPage' });
    } else {
        // todo dummy cookie 없는데, access token cookie 있을 경우, access token 및 refresh token 대해서 어떻게 처리를 할 것인가?
        console.log("else 문 확인")
        console.log("cookie 존재")
        next();
    }
});

export default router;
