import { seedTalks } from "../src/prisma/seed.ts";

const result = await seedTalks();
console.log(`Seeded talks: ${result.count}`);
