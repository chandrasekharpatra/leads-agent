<script setup lang="ts">
const { clear } = useUserSession();
onMounted(async () => {
    await clear();
    await navigateTo('/login');
});

</script>
<template>

</template>  
