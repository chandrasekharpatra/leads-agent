import { container } from 'tsyringe-neo';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PincodeTechparkMapping } from '../../src/storage/stored/stored_pincode';
import { PincodeTechparkMappingStore } from '../../src/storage/pincode_techpark_mapping_store';
import { generateTechparkId } from '../../src/utils/id_utils';
import { initTsyringe } from '../tsyringe';

describe('Pincode techpark mapping store CRUD tests', () => {

	beforeAll(() => {
        initTsyringe();
    })

    afterAll(() => {
        container.clearInstances();
        container.reset()
    })

    it('pincode techpark mapping crud operations', async () => {
        const pincodeTechparkMappingStore = container.resolve<PincodeTechparkMappingStore>('PincodeTechparkMappingStore');

        const pincodeId = '560100';
        const techparkId = generateTechparkId('Electronic City', 'Phase 1, Bangalore');

        const mapping: PincodeTechparkMapping = {
            techparkId: techparkId,
            pincodeId: pincodeId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }

        await pincodeTechparkMappingStore.createMapping(mapping);

        const fetchedMapping = await pincodeTechparkMappingStore.getMapping(mapping.pincodeId, mapping.techparkId);
        expect(fetchedMapping).toBeDefined();
        expect(fetchedMapping?.techparkId).toBe(techparkId);
        expect(fetchedMapping?.pincodeId).toBe(pincodeId);

        // Test ensureMapping (should not create duplicate)
        await pincodeTechparkMappingStore.ensureMapping(mapping.pincodeId, mapping.techparkId);
        const ensuredMapping = await pincodeTechparkMappingStore.getMapping(mapping.pincodeId, mapping.techparkId);
        expect(ensuredMapping).toBeDefined();
        expect(ensuredMapping?.pincodeId).toBe(pincodeId);

        await pincodeTechparkMappingStore.deleteMapping(mapping.pincodeId, mapping.techparkId);
        const deletedMapping = await pincodeTechparkMappingStore.getMapping(mapping.pincodeId, mapping.techparkId);
        expect(deletedMapping).toBeNull();
    });

    it('pincode techpark mapping sync operations', async () => {
        const pincodeTechparkMappingStore = container.resolve<PincodeTechparkMappingStore>('PincodeTechparkMappingStore');

        const pincodeId = '560001';
        const techparkId1 = generateTechparkId('Electronic City', 'Phase 1, Bangalore');
        const techparkId2 = generateTechparkId('Whitefield Tech Park', 'Whitefield, Bangalore');
        const techparkId3 = generateTechparkId('Manyata Tech Park', 'Hebbal, Bangalore');

        // Create multiple mappings for the same pincode
        const mapping1: PincodeTechparkMapping = {
            techparkId: techparkId1,
            pincodeId: pincodeId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const mapping2: PincodeTechparkMapping = {
            techparkId: techparkId2,
            pincodeId: pincodeId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const mapping3: PincodeTechparkMapping = {
            techparkId: techparkId3,
            pincodeId: pincodeId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        await pincodeTechparkMappingStore.createMapping(mapping1);
        await pincodeTechparkMappingStore.createMapping(mapping2);
        await pincodeTechparkMappingStore.createMapping(mapping3);

        // Test initial sync (no pointer)
        const initialSync = await pincodeTechparkMappingStore.sync(pincodeId, {
            direction: 'FORWARD',
            limit: 10
        });

        expect(initialSync.data.length).toBe(3);
        expect(initialSync.total).toBe(3);
        expect(initialSync.cursor).toBeDefined();

        // Verify all mappings are returned
        const techparkIds = initialSync.data.map(m => m.techparkId);
        expect(techparkIds).toContain(techparkId1);
        expect(techparkIds).toContain(techparkId2);
        expect(techparkIds).toContain(techparkId3);

        // Test pagination with cursor
        const limitedSync = await pincodeTechparkMappingStore.sync(pincodeId, {
            direction: 'FORWARD',
            limit: 2
        });

        expect(limitedSync.data.length).toBe(2);
        expect(limitedSync.cursor).toBeDefined();

        // Clean up
        await pincodeTechparkMappingStore.deleteMapping(pincodeId, techparkId1);
        await pincodeTechparkMappingStore.deleteMapping(pincodeId, techparkId2);
        await pincodeTechparkMappingStore.deleteMapping(pincodeId, techparkId3);
    });
});
