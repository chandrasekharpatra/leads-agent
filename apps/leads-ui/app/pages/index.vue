<script setup lang="ts">
import { z } from 'zod/v4';

interface WorkflowData {
	state: string;
	pointer?: string;
  pincode?: string;
}

interface Workflow {
	workflowId: string;
	data: WorkflowData;
	createdAt: number;
	updatedAt: number;
}

interface PaginatedResponse<T> {
	data: T[];
	total: number;
	cursor: string | undefined;
}


definePageMeta({
	middleware: ['auth']
});

const workflows = ref<Workflow[]>([])

const schema = z.object({
  pincode: z.string().min(6, 'Invalid pincode')
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  pincode: ''
})

const toast = useToast()

const open = ref(false);

const tabItems = [
  {
    label: 'Search',
    icon: 'i-lucide-search',
    slot: 'search'
  },
  {
    label: 'Download',
    icon: 'i-lucide-download',
    slot: 'download'
  }
]

onMounted( async () => {
    await syncWorkflows();
});

async function syncWorkflows() {
    await $fetch('/proxy/v1/workflows/sync', {
        method: 'POST',
        body: {
          pointer: undefined,
          direction: 'FORWARD'
        },
        onResponse({ response }) {
            if (response.status === 200) {
                const data = response._data as PaginatedResponse<Workflow>;
                workflows.value = data.data;
            } else {
                console.error("Failed to sync workflows");
            }
        }
    });
}

async function createWorkflow() {
    await $fetch('/proxy/v1/workflows', {
        method: 'POST',
        body: {
          pincode: state.pincode
        },
        onRequestError({ error }) {
            console.error("Error creating workflow:", error);
            toast.add({
                title: 'Error',
                description: 'Failed to create workflow',
            })
        },
        onResponseError({ response }) {
            console.error("Error response creating workflow:", response.status, response.statusText);
            toast.add({
                title: 'Error',
                description: 'Failed to create workflow',
            })
        },onResponse({ response }) {
            if (response.status === 200) {
                toast.add({
                    title: 'Success',
                    description: 'Workflow created successfully',
                })
                state.pincode = '';
            }
        }
    });
    await syncWorkflows();
}

async function onSearchSubmit() {
  const result = schema.safeParse(state)
  if (!result.success) {
    // Handle validation errors
    return
  }
  await createWorkflow();
  open.value = false;
  await syncWorkflows();
}

async function onDownloadSubmit() {
  const result = schema.safeParse(state)
  if (!result.success) {
    // Handle validation errors
    return
  }
  // Handle download logic
  await navigateTo(`/api/download?pincode=${result.data.pincode}`, { open: { target: '_parent', windowFeatures: { popup: true } } });
  open.value = false;
}

</script>
<template>
  <div class="container mx-auto">
    <div class="flex justify-end m-4">
        <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="subtle" @click="open = true" />
    </div>
    <UModal title="Search leads" v-model:open="open">
      <template #body>
        <UTabs :items="tabItems">
          <template #search class="">
            <UForm :schema="schema" :state="state" class="items-center space-y-4" @submit="onSearchSubmit">
              <UFormField label="Pincode" name="pincode">
                <UInput v-model="state.pincode" />
              </UFormField>

              <UButton label="Search" type="submit" />
            </UForm>
          </template>
          <template #download>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onDownloadSubmit">
              <UFormField label="Pincode" name="pincode">
                <UInput v-model="state.pincode" />
              </UFormField>

              <UButton label="Download" type="submit" />
            </UForm>
          </template>
        </UTabs>
      </template>
    </UModal>
    <div class="mt-8">
      <h2 class="text-2xl font-bold mb-4">Workflows</h2>
      <div v-if="workflows.length === 0" class="text-gray-500">No workflows found.</div>
      <ul v-else class="space-y-4">
        <li v-for="workflow in workflows" :key="workflow.workflowId" class="p-4 border rounded-lg">
          <div><strong>Workflow ID:</strong> {{ workflow.workflowId }}</div>
          <div><strong>State:</strong> {{ workflow.data.state }}</div>
          <div><strong>Pincode:</strong> {{ workflow.data.pincode || 'N/A' }}</div>
          <div><strong>Created At:</strong> {{ new Date(workflow.createdAt).toLocaleString() }}</div>
          <div><strong>Updated At:</strong> {{ new Date(workflow.updatedAt).toLocaleString() }}</div>
        </li>
      </ul>
    </div>
  </div>
</template>
