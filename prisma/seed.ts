import { ensureDemoTenant } from "../lib/saas";

async function main() {
  const demo = await ensureDemoTenant();
  console.log("Demo tenant ready");
  console.log("  email:    demo@molvaani.app");
  console.log("  password: demo1234");
  console.log("  org:     ", demo.org.slug);
  console.log("  agent:   ", demo.agent.slug, demo.agent.id);

  const { prisma } = await import("../lib/db");
  const count = await prisma.crmContact.count();
  if (count === 0) {
    await prisma.crmContact.createMany({
      data: [
        { name: "Demo Judge", phone: "+919876543210", company: "EchoSphere" },
      ],
    });
    console.log("  seeded 1 CRM contact (edit phone before dialing)");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
