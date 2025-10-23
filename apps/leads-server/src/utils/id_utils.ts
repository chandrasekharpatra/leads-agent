import { createHash } from "node:crypto";
import { monotonicFactory } from "ulid";

const ulid = monotonicFactory();

export const workflowIdGenerator = (): string => {
    return "W" + ulid();
}

export const taskIdGenerator = (): string => {
    return "T" + ulid();
}

export const generateCompanyId = (companyName: string, address?: string): string => {
    const normalized = companyName
        .toLowerCase()
        .trim()
        .replace(/\b(inc|ltd|llc|corp|corporation|limited|pvt|private)\b/g, '')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '');
    
    const input = address ? `${normalized}:${address.toLowerCase().trim()}` : normalized;
    const hash = createHash('sha256').update(input).digest('hex').substring(0, 12);
    
    return `C${hash}`;
};

export const generateTechparkId = (techparkName: string, address?: string): string => {
    const normalized = techparkName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '');

    const normalizedAddress = address
        ? address
              .toLowerCase()
              .trim()
              .replace(/[^\w\s]/g, '')
              .replace(/\s+/g, '')
        : '';

    const input = address ? `${normalized}:${normalizedAddress}` : normalized;
    const hash = createHash('sha256').update(input).digest('hex').substring(0, 12);
    
    return `TP${hash}`;
};