import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import SSS from '../views/SSS.vue'
import Contact from '../views/Contact.vue'
import Product from '../views/Product.vue'
import Coming from '../views/Coming.vue'
import Finished from '../views/Finished.vue'
import Tools from '../views/Tools.vue'
import User from '../views/User.vue'
import Admin from '../views/Admin.vue'
import Checkout from '../views/Checkout.vue'
import { refreshAuthenticatedUser } from '../services/auth.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/about', name: 'about', component: About },
    { path: '/sss', name: 'sss', component: SSS },
    { path: '/contact', name: 'contact', component: Contact },
    { path: '/products', name: 'product', component: Product },
    { path: '/coming', name: 'coming', component: Coming },
    { path: '/finished', name: 'finished', component: Finished },
    { path: '/tools', name: 'tools', component: Tools },
    { path: '/user', name: 'user', component: User, meta: { requiresAuth: true, roles: [0] } },
    { path: '/admin', name: 'admin', component: Admin, meta: { requiresAuth: true, roles: [1] } },
    { path: '/checkout', name: 'checkout', component: Checkout, meta: { requiresAuth: true } },
  ],
})

router.beforeEach(async (to) => {
  const user = await refreshAuthenticatedUser()
  if (to.meta.requiresAuth && !user) return { name: 'home' }
  if (to.meta.roles && !to.meta.roles.includes(Number(user?.u_role))) return { name: 'home' }
  return true
})

export default router
