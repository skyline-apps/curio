import { eq, sql, TransactionDB } from "@app/api/db";
import { profileLabels } from "@app/api/db/schema";
import {
  CreateOrUpdateLabelsRequest,
  CreateOrUpdateLabelsResponse,
} from "@app/schemas/v1/user/labels";

export async function createOrUpdateLabels(
  db: TransactionDB,
  profileId: string,
  labels: CreateOrUpdateLabelsRequest["labels"],
): Promise<CreateOrUpdateLabelsResponse["labels"]> {
  const now = new Date();
  const newLabels = labels.map((label) => ({
    id: "id" in label ? label.id : undefined,
    profileId,
    name: label.name ?? "",
    color: label.color ?? "",
    createdAt: now,
    updatedAt: now,
  }));
  const updatedLabels = await db
    .insert(profileLabels)
    .values(newLabels)
    .onConflictDoUpdate({
      target: [profileLabels.id],
      set: {
        name: sql`CASE WHEN EXCLUDED.name = '' THEN profile_labels.name ELSE EXCLUDED.name END`,
        color: sql`CASE WHEN EXCLUDED.color = '' THEN profile_labels.color ELSE EXCLUDED.color END`,
        updatedAt: sql`now()`,
      },
      where: eq(profileLabels.profileId, profileId),
    })
    .returning({
      id: profileLabels.id,
      name: profileLabels.name,
      color: profileLabels.color,
    });
  return updatedLabels;
}
