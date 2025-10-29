# Leads Agent

A modern, extensible lead generation and enrichment engine for B2B workflows, built with TypeScript, Node.js, and a modular workflow/task processor architecture.

## Features

- **Workflow Engine**: Orchestrates multi-stage lead generation and enrichment workflows.
- **Extensible Task Processors**: Add new data sources or enrichment steps by implementing simple interfaces.
- **Parallel & Priority Execution**: Optimizes for speed and resource usage.
- **Type-Safe**: Built with TypeScript for robust, maintainable code.
- **Comprehensive Logging & Metrics**: Track every stage of the pipeline.
- **Testable**: Modular design for easy unit and integration testing.

## Architecture

```
apps/
  leads-server/
    src/
      engine/         # Task processor-based workflow engine (current)
      services/       # LeadService, WorkflowService, etc.
      storage/        # Stores for companies, techparks, mappings
      models/         # TypeScript types and interfaces
      ...
packages/
  eslint-config/      # Shared linting config
```

### Data Flow Example

1. **Pincode → Techparks**: Find tech parks in a pincode
2. **Techparks → Companies**: Find companies in each tech park
3. **Companies → Enrichment**: Find hiring managers, Toastmaster clubs, etc.
4. **Persistence**: Save all data to the database

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install Dependencies
```sh
npm install
```

### Development
```sh
npm run dev
```

### Running Tests
```sh
npm test
```

## Usage

### Lead Generation Workflow

```typescript
// See engine/ and services/ for usage patterns
// Example:
const result = await workflowService.resume(ctx, workflowId);
```

## Extending the System

- Add new enrichment steps by implementing a TaskProcessor in `engine/`.
- Register new processors in the workflow engine.

## License

MIT
