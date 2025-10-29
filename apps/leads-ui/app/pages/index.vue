<script setup lang="ts">
import { z } from 'zod/v4'; 

definePageMeta({
	middleware: ['auth']
});

const types = ref(['DOWNLOAD', 'SEARCH'])

const schema = z.object({
  pincode: z.string().min(6, 'Invalid pincode'),
  type: z.enum(['DOWNLOAD', 'SEARCH']),
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  pincode: '',
  type: 'SEARCH'
})

async function onSubmit() {
  const result = schema.safeParse(state)
  if (!result.success) {
    // Handle validation errors
    return
  }
  if (result.data.type === 'DOWNLOAD') {
    // Handle download logic
    console.log('Downloading leads for pincode:', result.data.pincode)
  } else {
    // Handle search logic
    console.log('Searching leads for pincode:', result.data.pincode)
  }
}

</script>
<template>
  <div class="container mx-auto">
    <UModal title="Search leads">
      <UButton label="New" color="neutral" variant="subtle" />
      <template #body>
        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Type" name="type">
            <UInputMenu v-model="state.type" :items="types"/>
          </UFormField>

          <UFormField label="Pincode" name="pincode">
            <UInput v-model="state.pincode" />
          </UFormField>

          <UButton type="submit">
            Submit
          </UButton>
        </UForm>
      </template>  
    </UModal>
  </div>
</template>
