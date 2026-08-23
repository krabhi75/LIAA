import { ensureDemoTenant } from "../lib/saas";
import { seedDemoCrmData } from "../lib/demo-crm-seed";

async function main() {
  const demo = await ensureDemoTenant();
  console.log("Demo tenant ready");
  console.log("  email:    demo@molvaani.app");
  console.log("  password: demo1234");
  console.log("  org:     ", demo.org.slug);
  console.log("  agent:   ", demo.agent.slug, demo.agent.id);

  const seeded = await seedDemoCrmData();
  if (seeded.skipped) {
    console.log("  CRM demo farmers already seeded (9999-9999-99 … 80)");
  } else {
    console.log(
      `  seeded ${seeded.farmers} farmers, ${seeded.calls} calls, ${seeded.cases} cases`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
