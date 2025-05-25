<script>
import MainHeader from "@/components/MainHeader.vue";

// const HOST = "";
export default {
  name: 'adminHome',
  components: {
    MainHeader
  }
}
</script>

<template>
  <main-header>
    <slot>
      <MainHeader/>
    </slot>
  </main-header>
  <div>
    <p>관리자 페이지</p>
  </div>
</template>
