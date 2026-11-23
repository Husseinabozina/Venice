import dashboard from './dashboard.js';
import customers, { handlers as hCustomers } from './customers.js';
import statements, { handlers as hStatements } from './statements.js';
import sales, { handlers as hSales } from './sales.js';
import projects, { handlers as hProjects } from './projects.js';
import production, { handlers as hProduction } from './production.js';
import inventory, { handlers as hInventory } from './inventory.js';
import purchases, { handlers as hPurchases } from './purchases.js';
import costing, { handlers as hCosting } from './costing.js';
import hr, { handlers as hHr } from './hr.js';
import reports, { handlers as hReports } from './reports.js';
import settings, { handlers as hSettings } from './settings.js';

export const pages = { dashboard, customers, statements, sales, projects, production, inventory, purchases, costing, hr, reports, settings };
export const handlers = { ...hCustomers, ...hStatements, ...hSales, ...hProjects, ...hProduction, ...hInventory, ...hPurchases, ...hCosting, ...hHr, ...hReports, ...hSettings };
