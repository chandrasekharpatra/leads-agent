import type { PerplexityProvider } from '@ai-sdk/perplexity';
import { generateObject } from 'ai';
import { inject, singleton } from 'tsyringe-neo';
import { z } from 'zod';
import { TechPark, Company, HiringManagerHead } from '../models/internal';

const techParksSchema = z.object({
	name: z.string(),
	pincode: z.string(),
	address: z.string(),
});

const listTechParkResponseSchema = z.object({
	techParks: z.array(techParksSchema),
});

const listCompanyResponseSchema = z.object({
	companies: z.array(
		z.object({
			name: z.string(),
			industry: z.string(),
			employeeCount: z.number(),
			hasToastmasterClub: z.boolean(),
		}),
	),
});

const findHiringManagerHeadResponseSchema = z.object({
	hiringManagers: z.array(
		z.object({
			name: z.string(),
		}),
	),
});

interface LeadGenService {
	generateLead(pincode: string): Promise<Company[]>;
}

@singleton()
class PerplexityLeadGenService implements LeadGenService {
	constructor(@inject('PerplexityProvider') private readonly perplexity: PerplexityProvider) {}

	async generateLead(pincode: string): Promise<Company[]> {
		// Implementation for generating a lead using the Perplexity API
		const techParks = await this.listTechParksInPincode(pincode, 1);
		const companiesList = await Promise.all(
			techParks.map(async (techPark) => {
				const companies = await this.listCompaniesInTechPark(techPark.name, techPark.address);
				return companies;
			}),
		);
		// Flatten the list of companies
		return companiesList.flat();
	}

	private async listTechParksInPincode(pincode: string, limit: number): Promise<TechPark[]> {
		const prompt = `List ${limit} technology parks in Bangalore, India with pincode ${pincode}.`;
		const {
			object: { techParks },
		} = await generateObject({
			model: this.perplexity('sonar-pro'),
			prompt,
			schema: listTechParkResponseSchema,
		});
		return techParks;
	}

	private async listCompaniesInTechPark(techParkName: string, address: string): Promise<Company[]> {
		const prompt = `List companies in the tech park ${techParkName} located at ${address} along with their details.`;
		const {
			object: { companies },
		} = await generateObject({
			model: this.perplexity('sonar-pro'),
			prompt,
			schema: listCompanyResponseSchema,
		});
		const hiringManagerPromises = companies.map(async (company) => {
			const hiringManagers = await this.findHiringManagerHead(company.name);
			return { company, hiringManagers };
		});
		const companiesWithHiringManagers = await Promise.all(hiringManagerPromises);
		return companiesWithHiringManagers.map(({ company, hiringManagers }) => ({
			...company,
			techParkName,
			nameOfHiringManagerLeads: hiringManagers.map((hm) => hm.name),
		}));
	}

	private async findHiringManagerHead(companyName: string): Promise<HiringManagerHead[]> {
		// Implementation to find the hiring manager head for a given company
		const prompt = `Find the hiring manager head or talent acquisition head or Learning and development head for the company ${companyName} in India.`;
		const {
			object: { hiringManagers },
		} = await generateObject({
			model: this.perplexity('sonar-pro'),
			prompt,
			schema: findHiringManagerHeadResponseSchema,
		});
		return hiringManagers;
	}
}

export { PerplexityLeadGenService, type LeadGenService };
