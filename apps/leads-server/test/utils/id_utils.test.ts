import { describe, expect, it } from 'vitest';
import { 
    workflowIdGenerator, 
    taskIdGenerator, 
    generateCompanyId, 
    generateTechparkId 
} from '../../src/utils/id_utils';

describe('ID Utils Tests', () => {

    describe('workflowIdGenerator', () => {
        it('should generate workflow ID with W prefix', () => {
            const id = workflowIdGenerator();
            expect(id).toMatch(/^W[A-Z0-9]{26}$/);
        });

        it('should generate unique workflow IDs', () => {
            const id1 = workflowIdGenerator();
            const id2 = workflowIdGenerator();
            expect(id1).not.toBe(id2);
        });

        it('should generate monotonic workflow IDs', () => {
            const id1 = workflowIdGenerator();
            const id2 = workflowIdGenerator();
            // ULID is monotonic, so id2 should be lexicographically greater
            expect(id2 > id1).toBe(true);
        });
    });

    describe('taskIdGenerator', () => {
        it('should generate task ID with T prefix', () => {
            const id = taskIdGenerator();
            expect(id).toMatch(/^T[A-Z0-9]{26}$/);
        });

        it('should generate unique task IDs', () => {
            const id1 = taskIdGenerator();
            const id2 = taskIdGenerator();
            expect(id1).not.toBe(id2);
        });

        it('should generate monotonic task IDs', () => {
            const id1 = taskIdGenerator();
            const id2 = taskIdGenerator();
            expect(id2 > id1).toBe(true);
        });
    });

    describe('generateCompanyId', () => {
        it('should generate company ID with C prefix', () => {
            const id = generateCompanyId('Microsoft Corporation');
            expect(id).toMatch(/^C[a-f0-9]{12}$/);
        });

        it('should generate deterministic IDs for same company name', () => {
            const id1 = generateCompanyId('Microsoft Corporation');
            const id2 = generateCompanyId('Microsoft Corporation');
            expect(id1).toBe(id2);
        });

        it('should normalize company names consistently', () => {
            const id1 = generateCompanyId('Microsoft Corporation');
            const id2 = generateCompanyId('Microsoft Corp');
            const id3 = generateCompanyId('Microsoft Inc');
            const id4 = generateCompanyId('Microsoft Limited');
            const id5 = generateCompanyId('Microsoft Ltd');
            const id6 = generateCompanyId('Microsoft LLC');
            const id7 = generateCompanyId('Microsoft Pvt');
            const id8 = generateCompanyId('Microsoft Private');
            
            // All should normalize to the same base name "microsoft"
            expect(id1).toBe(id2);
            expect(id1).toBe(id3);
            expect(id1).toBe(id4);
            expect(id1).toBe(id5);
            expect(id1).toBe(id6);
            expect(id1).toBe(id7);
            expect(id1).toBe(id8);
        });

        it('should handle special characters and whitespace', () => {
            const id1 = generateCompanyId('  Microsoft!!! Corporation  ');
            const id2 = generateCompanyId('Microsoft Corporation');
            expect(id1).toBe(id2);
        });

        it('should handle case insensitivity', () => {
            const id1 = generateCompanyId('MICROSOFT CORPORATION');
            const id2 = generateCompanyId('microsoft corporation');
            const id3 = generateCompanyId('Microsoft Corporation');
            expect(id1).toBe(id2);
            expect(id1).toBe(id3);
        });

        it('should include address in ID generation when provided', () => {
            const id1 = generateCompanyId('Microsoft', 'Redmond, WA');
            const id2 = generateCompanyId('Microsoft', 'Seattle, WA');
            const id3 = generateCompanyId('Microsoft');
            
            expect(id1).not.toBe(id2);
            expect(id1).not.toBe(id3);
            expect(id2).not.toBe(id3);
        });

        it('should normalize addresses consistently', () => {
            const id1 = generateCompanyId('Microsoft', '  Redmond, WA  ');
            const id2 = generateCompanyId('Microsoft', 'redmond, wa');
            expect(id1).toBe(id2);
        });

        it('should generate different IDs for different companies', () => {
            const id1 = generateCompanyId('Microsoft');
            const id2 = generateCompanyId('Google');
            const id3 = generateCompanyId('Apple');
            
            expect(id1).not.toBe(id2);
            expect(id1).not.toBe(id3);
            expect(id2).not.toBe(id3);
        });
    });

    describe('generateTechparkId', () => {
        it('should generate techpark ID with TP prefix', () => {
            const id = generateTechparkId('Electronic City');
            expect(id).toMatch(/^TP[a-f0-9]{12}$/);
        });

        it('should generate deterministic IDs for same techpark name', () => {
            const id1 = generateTechparkId('Electronic City');
            const id2 = generateTechparkId('Electronic City');
            expect(id1).toBe(id2);
        });

        it('should handle special characters and whitespace', () => {
            const id1 = generateTechparkId('  Electronic!!! City  ');
            const id2 = generateTechparkId('Electronic City');
            expect(id1).toBe(id2);
        });

        it('should handle case insensitivity', () => {
            const id1 = generateTechparkId('ELECTRONIC CITY');
            const id2 = generateTechparkId('electronic city');
            const id3 = generateTechparkId('Electronic City');
            expect(id1).toBe(id2);
            expect(id1).toBe(id3);
        });

        it('should include address in ID generation when provided', () => {
            const id1 = generateTechparkId('Electronic City', 'Phase 1, Bangalore');
            const id2 = generateTechparkId('Electronic City', 'Phase 2, Bangalore');
            const id3 = generateTechparkId('Electronic City');
            
            expect(id1).not.toBe(id2);
            expect(id1).not.toBe(id3);
            expect(id2).not.toBe(id3);
        });

        it('should normalize addresses consistently', () => {
            const id1 = generateTechparkId('Electronic City', '  Phase 1, Bangalore!!!  ');
            const id2 = generateTechparkId('Electronic City', 'phase1bangalore');
            expect(id1).toBe(id2);
        });

        it('should generate different IDs for different techparks', () => {
            const id1 = generateTechparkId('Electronic City');
            const id2 = generateTechparkId('Whitefield Tech Park');
            const id3 = generateTechparkId('Manyata Tech Park');
            
            expect(id1).not.toBe(id2);
            expect(id1).not.toBe(id3);
            expect(id2).not.toBe(id3);
        });
    });

    describe('ID collision resistance', () => {
        it('should have low collision probability for similar inputs', () => {
            const ids = new Set();
            const variations = [
                'Microsoft',
                'Microsofy',
                'Microsof',
                'Microsaft',
                'Microsoft1',
                'Microsoft2',
                '1Microsoft',
                'Microsoft Technologies',
                'Microsoft Systems'
            ];

            variations.forEach(name => {
                ids.add(generateCompanyId(name));
            });

            // Should have unique IDs for different variations (Corp was removed since it normalizes to same as Microsoft)
            expect(ids.size).toBe(variations.length);
        });

        it('should handle suffix normalization edge cases', () => {
            // Test that known suffixes are properly normalized to same ID
            const baseId = generateCompanyId('Microsoft');
            const corpId = generateCompanyId('Microsoft Corp');
            expect(baseId).toBe(corpId);

            // But truly different names should have different IDs
            const googleId = generateCompanyId('Google');
            expect(baseId).not.toBe(googleId);
        });

        it('should generate consistent hash length', () => {
            const companies = [
                'A',
                'Very Long Company Name With Many Words Inc',
                '中文公司名称',
                '123 Numeric Company 456',
                'Special!@#$%^&*()Characters'
            ];

            companies.forEach(name => {
                const id = generateCompanyId(name);
                expect(id.length).toBe(13); // 'C' + 12 hex characters
            });
        });
    });
});