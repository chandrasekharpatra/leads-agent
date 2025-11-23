import { type PerplexityProvider } from '@ai-sdk/perplexity';
import { generateObject } from 'ai';
import { inject, singleton } from 'tsyringe-neo';
import { z } from 'zod';
import { Company, Profile, TechPark, ToastmasterClubDetail } from '../models/internal';
import { OutgoingCompany } from '../models/io';
import { type CompanyStore } from '../storage/company_store';
import { type PincodeTechparkMappingStore } from '../storage/pincode_techpark_mapping_store';
import { type TechparkCompanyMappingStore } from '../storage/techpark_company_mapping_store';

const techParksSchema = z.object({
	name: z.string().describe('Name of the tech park'),
	address: z.string().describe('Address of the tech park in Bangalore, India'),
});

const listTechParkResponseSchema = z.object({
	techParks: z.array(techParksSchema).describe('List of tech parks in the specified pincode'),
});

const listCompanyResponseSchema = z.object({
	companies: z.array(
		z.object({
			name: z.string().describe('Name of the company'),
			industry: z.string().describe('Industry of the company'),
			employeeCount: z.number().describe('Number of employees in the company'),
			address: z.string().describe('Address of the company in the tech park'),
		}).describe('List of all the companies in the tech park.'),
	),
});

const hasToastmasterClubResponseSchema = z.object({
	hasClub: z.boolean().describe('True if the company has a Toastmasters club in Bangalore'),
	url: z.string().optional().describe('URL of the Toastmasters club if available else na'),
});

const findHiringManagerHeadResponseSchema = z.object({
	profiles: z.array(
		z.object({
			name: z
				.string()
				.describe(
					'Name of the Learning and development head of the company in Bangalore, else provide na if not found',
				),
			linkedInUrl: z.string().optional().describe('LinkedIn URL of the person if available'),
		}),
	),
});

interface LeadService {
	findTechParksInPincode(pincode: string, limit: number): Promise<TechPark[]>;
	findCompaniesInTechPark(techpark: TechPark): Promise<Company[]>;
	findToastmasterClubDetail(company: Company): Promise<ToastmasterClubDetail>;
	findHiringManagerHead(company: Company): Promise<Profile[]>;
	fetchLeads(pincode: string): Promise<OutgoingCompany[]>;
}

@singleton()
class PerplexityLeadService implements LeadService {
	constructor(
		@inject('PerplexityProvider') private readonly perplexity: PerplexityProvider,
		@inject('CompanyStore') private readonly companyStore: CompanyStore,
		@inject('TechparkCompanyMappingStore') private readonly techparkCompanyMappingStore: TechparkCompanyMappingStore,
		@inject('PincodeTechparkMappingStore') private readonly pincodeTechparkMappingStore: PincodeTechparkMappingStore,
	) {}

	async findTechParksInPincode(pincode: string, limit: number): Promise<TechPark[]> {
		console.log('Finding tech parks in pincode:', pincode);
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

	async findCompaniesInTechPark(techpark: TechPark): Promise<Company[]> {
		console.log('Finding companies in tech park:', techpark);
		const prompt = `List all the companies in the tech park ${techpark.name} Bangalore, India`;
		const {
			object: { companies },
		} = await generateObject({
			model: this.perplexity('sonar-pro'),
			prompt,
			schema: listCompanyResponseSchema,
			providerOptions: {
				perplexity: {
					search_mode: 'web',
				},
			},
		});
		return companies;
	}

	async findToastmasterClubDetail(company: Company): Promise<ToastmasterClubDetail> {
		console.log('Finding Toastmaster club detail for company:', company);
		const prompt = `Does the company ${company.name} has a Toastmasters club in Bangalore, India ?`;
		try {
			const {
				object: { hasClub, url },
			} = await generateObject({
				model: this.perplexity('sonar-pro'),
				prompt,
				schema: hasToastmasterClubResponseSchema,
				providerOptions: {
					perplexity: {
						search_mode: 'web',
					},
				},
			});
			return { hasClub, url };
		} catch (error) {
			console.error('Error while finding Toastmaster club detail:', error);
			return { hasClub: false, url: undefined };
		}
	}

	async findHiringManagerHead(company: Company): Promise<Profile[]> {
		console.log('Finding L&D head for company:', company);
		const prompt = `Give me the Learning and development head for the ${company.name}, Bangalore`;
		try {
			const {
				object: { profiles },
			} = await generateObject({
				model: this.perplexity('sonar-pro'),
				prompt,
				schema: findHiringManagerHeadResponseSchema,
			});
			return profiles;
		} catch (error) {
			console.error('Error while finding hiring manager head:', error);
			return [];
		}
	}

	async fetchLeads(pincode: string): Promise<OutgoingCompany[]> {
		// Get all techpark mappings for the pincode
		const pincodeTechparkMappings = await this.pincodeTechparkMappingStore.sync(pincode, { direction: 'FORWARD', limit: 100 });
		const techparkIds = pincodeTechparkMappings.data.map((mapping) => mapping.techparkId);

		// Process all techparks in parallel
		const techparkResults = await Promise.all(
			techparkIds.map(async (techparkId) => {
				// Get company mappings for this techpark
				const techparkCompanyMappings = await this.techparkCompanyMappingStore.sync(techparkId, { direction: 'FORWARD', limit: 100 });

				// Fetch all companies in parallel for this techpark
				const companies = await Promise.all(
					techparkCompanyMappings.data.map(async (mapping) => {
						return await this.companyStore.getCompanyById(mapping.companyId);
					}),
				);

				// Filter out null companies and transform to OutgoingCompany format
				return companies
					.filter((company): company is NonNullable<typeof company> => company !== null)
					.map((company) => ({
						companyId: company.companyId,
						data: {
							name: company.data.name,
							address: company.data.address,
							pincode: company.data.pincode,
							hrProfiles: company.data.hrProfiles,
							hasToastmasterClub: company.data.hasToastmasterClub,
							employeeCount: company.data.employeeCount,
						},
						createdAt: company.createdAt,
						updatedAt: company.updatedAt,
					}));
			}),
		);

		// Flatten all results into a single array
		return techparkResults.flat();
	}
}

export { PerplexityLeadService, type LeadService };
