<script>
import MainHeader from "@/components/component/MainHeader.vue"

export default {
  name: 'HomePage',
  components: {
    MainHeader,
  }
}
</script>

<template>
  <slot>
    <MainHeader/>
  </slot>

  <p>main</p>
</template>

<style scoped>

</style>