import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/page/Home.vue'

const routes = [
    {
        path: '/login',
        name: 'HelloWorld',
        component: () => import('@/page/Login.vue'),
    },
    {
        path: '/',
        name: 'HomePage',
        component: Home,
    },
    {
        path: '/admin/',
        name: 'adminHome',
        component: () => import('@/page/admin/Admin.vue'),
    },
    {
        path: '/sign-up',
        name: 'signUp',
        component: () => import('@/page/SignUp.vue'),
    },
]

const router = createRouter({
    history: createWebHistory(), // 👈 base 제거 또는 명시적 지정
    routes,
})

export default router
