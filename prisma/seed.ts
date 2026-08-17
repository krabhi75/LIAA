import { ensureDemoTenant } from "../lib/saas";

async function main() {
  const demo = await ensureDemoTenant();
  console.log("Demo tenant ready");
  console.log("  email:    demo@molvaani.app");
  console.log("  password: demo1234");
  console.log("  org:     ", demo.org.slug);
  console.log("  agent:   ", demo.agent.slug, demo.agent.id);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
