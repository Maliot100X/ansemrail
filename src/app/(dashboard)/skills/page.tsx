import { listSkills } from "@/lib/clawpump";
import { MOONPAY_SKILLS } from "@/lib/moonpay";
import { SkillsClient } from "./skills-client";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  let clawpumpSkills: any[] = [];
  let error: string | null = null;

  try {
    clawpumpSkills = await listSkills();
  } catch (err: any) {
    error = err.message;
  }

  return (
    <SkillsClient
      clawpumpSkills={clawpumpSkills}
      moonpaySkills={MOONPAY_SKILLS}
      error={error}
    />
  );
}
