import Vue from 'vue'
import Router from 'vue-router'
import IndexPage from './views/Index.vue'


Vue.use(Router)

let router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'Index',
      component: IndexPage,
      props: true
    }
  ]
})

router.beforeEach((to, from, next) => {
  next();
});

export default router;