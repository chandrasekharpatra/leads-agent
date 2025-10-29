<script setup lang="ts">
import { ref } from 'vue'

const token = ref('')
const disabled = computed(() => token.value.length === 0)
const error = ref('')
const { fetch: fetchUserSession } = useUserSession();

async function login() {
    error.value = ''
    await $fetch('/api/login', {
        method: 'POST',
        body: {
            token: token.value
        },
        onResponse({ response }) {
            if (response.status === 200) {
                error.value = ''
                fetchUserSession()
                    .then(async () => await navigateTo('/'))
                    .catch(err => {
                        console.error("Error fetching user session after login:", err);
                    });
            } else {
                error.value = 'Login failed'
            }
        }
    })
}

</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
        <UInput v-model="token" placeholder="Enter your token" />
    </UPageCard>
    <UButton color="primary" class="text-center" :disabled="disabled" @click="login">Login</UButton>
    <div v-if="error" class="text-red-500">{{ error }}</div>
  </div>
</template>
