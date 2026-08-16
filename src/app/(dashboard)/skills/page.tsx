import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserClawpumpApiKey } from "@/lib/auth-session";
import { listSkills } from "@/lib/clawpump";
import { MOONPAY_SKILLS, SOLANA_SKILLS } from "@/lib/moonpay";
import { SkillsClient } from "./skills-client";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  let clawpumpSkills: any[] = [];
  let error: string | null = null;
  let hasOwnKey = false;

  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userKey = userId ? await getUserClawpumpApiKey(userId) : undefined;
    hasOwnKey = !!userKey;
    if (userKey) {
      clawpumpSkills = await listSkills(userKey);
    } else {
      error =
        "Connect your own ClawPump API key in Settings → Accounts to install ClawPump skills.";
    }
  } catch (err: any) {
    error = err.message;
  }

  return (
    <SkillsClient
      clawpumpSkills={clawpumpSkills}
      moonpaySkills={MOONPAY_SKILLS}
      solanaSkills={[...SOLANA_SKILLS]}
      error={error}
      hasOwnKey={hasOwnKey}
    />
  );
}
