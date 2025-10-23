import { container } from 'tsyringe-neo';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TechparkCompanyMapping } from '../../src/storage/stored/stored_techpark';
import { TechparkCompanyMappingStore } from '../../src/storage/techpark_company_mapping_store';
import { generateTechparkId, generateCompanyId } from '../../src/utils/id_utils';
import { initTsyringe } from '../tsyringe';

describe('Techpark company mapping store CRUD tests', () => {

	beforeAll(() => {
        initTsyringe();
    })

    afterAll(() => {
        container.clearInstances();
        container.reset()
    })

    it('techpark company mapping crud operations', async () => {
        const techparkCompanyMappingStore = container.resolve<TechparkCompanyMappingStore>('TechparkCompanyMappingStore');

        const techparkId = generateTechparkId('Electronic City', 'Phase 1, Bangalore');
        const companyId = generateCompanyId('Tech Corporation', 'Electronic City Phase 1, Bangalore');

        const mapping: TechparkCompanyMapping = {
            techparkId: techparkId,
            companyId: companyId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }

        await techparkCompanyMappingStore.createMapping(mapping);

        const fetchedMapping = await techparkCompanyMappingStore.getMapping(mapping.techparkId, mapping.companyId);
        expect(fetchedMapping).toBeDefined();
        expect(fetchedMapping?.techparkId).toBe(techparkId);
        expect(fetchedMapping?.companyId).toBe(companyId);

        // Test ensureMapping (should not create duplicate)
        await techparkCompanyMappingStore.ensureMapping(mapping.techparkId, mapping.companyId);
        const ensuredMapping = await techparkCompanyMappingStore.getMapping(mapping.techparkId, mapping.companyId);
        expect(ensuredMapping).toBeDefined();
        expect(ensuredMapping?.techparkId).toBe(techparkId);

        await techparkCompanyMappingStore.deleteMapping(mapping.techparkId, mapping.companyId);
        const deletedMapping = await techparkCompanyMappingStore.getMapping(mapping.techparkId, mapping.companyId);
        expect(deletedMapping).toBeNull();
    });

    it('techpark company mapping sync operations', async () => {
        const techparkCompanyMappingStore = container.resolve<TechparkCompanyMappingStore>('TechparkCompanyMappingStore');

        const techparkId = generateTechparkId('Whitefield Tech Park', 'Whitefield, Bangalore');
        const companyId1 = generateCompanyId('Microsoft', 'Whitefield, Bangalore');
        const companyId2 = generateCompanyId('Google', 'Whitefield, Bangalore');
        const companyId3 = generateCompanyId('Amazon', 'Whitefield, Bangalore');

        // Create multiple mappings for the same techpark
        const mapping1: TechparkCompanyMapping = {
            techparkId: techparkId,
            companyId: companyId1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const mapping2: TechparkCompanyMapping = {
            techparkId: techparkId,
            companyId: companyId2,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const mapping3: TechparkCompanyMapping = {
            techparkId: techparkId,
            companyId: companyId3,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        await techparkCompanyMappingStore.createMapping(mapping1);
        await techparkCompanyMappingStore.createMapping(mapping2);
        await techparkCompanyMappingStore.createMapping(mapping3);

        // Test initial sync (no pointer)
        const initialSync = await techparkCompanyMappingStore.sync(techparkId, {
            direction: 'FORWARD',
            limit: 10
        });

        expect(initialSync.data.length).toBe(3);
        expect(initialSync.total).toBe(3);
        expect(initialSync.cursor).toBeDefined();

        // Verify all mappings are returned
        const companyIds = initialSync.data.map(m => m.companyId);
        expect(companyIds).toContain(companyId1);
        expect(companyIds).toContain(companyId2);
        expect(companyIds).toContain(companyId3);

        // Test pagination with cursor
        const limitedSync = await techparkCompanyMappingStore.sync(techparkId, {
            direction: 'FORWARD',
            limit: 2
        });

        expect(limitedSync.data.length).toBe(2);
        expect(limitedSync.cursor).toBeDefined();

        // Clean up
        await techparkCompanyMappingStore.deleteMapping(techparkId, companyId1);
        await techparkCompanyMappingStore.deleteMapping(techparkId, companyId2);
        await techparkCompanyMappingStore.deleteMapping(techparkId, companyId3);
    });
});
