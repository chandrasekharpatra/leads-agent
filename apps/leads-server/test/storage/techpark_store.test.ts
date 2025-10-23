import { container } from 'tsyringe-neo';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Techpark } from '../../src/storage/stored/stored_techpark';
import { TechParkStore } from '../../src/storage/techpark_store';
import { generateTechparkId } from '../../src/utils/id_utils';
import { initTsyringe } from '../tsyringe';

describe('Techpark store CRUD tests', () => {

	beforeAll(() => {
        initTsyringe();
    })

    afterAll(() => {
        container.clearInstances();
        container.reset()
    })

    it('techpark crud operations', async () => {
        const techparkStore = container.resolve<TechParkStore>('TechParkStore');

        const techpark: Techpark = {
            techparkId: generateTechparkId('Electronic City', 'Phase 1, Bangalore'),
            data: {
                name: 'Electronic City',
                pincode: '560100',
                address: 'Phase 1, Bangalore'
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }

        await techparkStore.createTechPark(techpark);

        const fetchedTechpark = await techparkStore.getTechParkById(techpark.techparkId);
        expect(fetchedTechpark).toBeDefined();
        expect(fetchedTechpark?.data.name).toBe('Electronic City');
        expect(fetchedTechpark?.data.pincode).toBe('560100');

        await techparkStore.updateTechPark({
            ...techpark,
            data: {
                name: 'Electronic City',
                pincode: '560101',
                address: 'Phase 2, Bangalore'
            }
        });

        const updatedTechpark = await techparkStore.getTechParkById(techpark.techparkId);
        expect(updatedTechpark).toBeDefined();
        expect(updatedTechpark?.data.address).toBe('Phase 2, Bangalore');
        expect(updatedTechpark?.data.pincode).toBe('560101');

        await techparkStore.deleteTechPark(techpark.techparkId);
        const deletedTechpark = await techparkStore.getTechParkById(techpark.techparkId);
        expect(deletedTechpark).toBeNull();
    });
});
