import type { H3Event } from 'h3'

interface Profile {
	name: string;
	linkedInUrl?: string;
}

interface OutgoingCompanyData {
	name: string;
	address: string;
	pincode: string;
	hrProfiles: Profile[];
	hasToastmasterClub: boolean;
	toastmasterClubUrl?: string;
	employeeCount?: number;
}

interface OutgoingCompany {
	companyId: string;
	data: OutgoingCompanyData;
	createdAt: number;
	updatedAt: number;
}

export default defineEventHandler(async (event: H3Event) => {
    assertMethod(event, "GET");
    const query = getQuery(event)
    const session = await requireUserSession(event);
    const { env } = event.context.cloudflare;
    const response = await env.LEADS_SERVER.fetch(`https://leads.example.com/v1/leads?pincode=${query.pincode}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.secure?.token}`,
        }
    });
    if (!response.ok) {
        console.log("Login failed", response.status, await response.text())
        throw createError({ status: response.status, statusMessage: 'Login failed' });
    }
    const responseBody = await response.json() as { leads: Array<OutgoingCompany> };

    const csvHeaders = ['Company ID', 'Name', 'Address', 'Pincode', 'Has Toastmaster Club', 'Toastmaster Club URL', 'Employee Count', 'HR Profiles'];
    const csvRows = responseBody.leads.map(lead => {
        const hrProfiles = lead.data.hrProfiles.map(profile => `${profile.name} (${profile.linkedInUrl || 'N/A'})`).join('; ');
        return [
            lead.companyId,
            lead.data.name,
            lead.data.address,
            lead.data.pincode,
            lead.data.hasToastmasterClub ? 'Yes' : 'No',
            lead.data.toastmasterClubUrl || 'N/A',
            lead.data.employeeCount?.toString() || 'N/A',
            hrProfiles
        ].map(field => `"${field.replace(/"/g, '""')}"`).join(',');
    });

    const csvString = [csvHeaders.join(','), ...csvRows].join('\n');
    const csvContent = Buffer.from(csvString, 'utf-8');

    event.node.res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    event.node.res.setHeader('Content-Type', 'text/csv');
    event.node.res.end(csvContent);
})
