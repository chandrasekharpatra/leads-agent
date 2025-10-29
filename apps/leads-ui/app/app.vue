<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const items = computed<NavigationMenuItem[]>(() => [
  { label: 'Home', to: '/', icon: 'i-lucide-home'},
  { label: 'Logout', to: '/logout', icon: 'i-lucide-log-out'},
])

const { loggedIn } = useUserSession();

</script>

<template>
  <UApp>
     <UHeader mode="drawer">
      <template #title>
        <span class="text-lg font-semibold">Leads Agent</span>
      </template>

      <UNavigationMenu :items="loggedIn ? items : []" />

      <template #body>
        <UNavigationMenu :items="loggedIn ? items : []" orientation="vertical" class="-mx-2.5" />
      </template>
    </UHeader>
    <NuxtPage />
  </UApp>
</template>
