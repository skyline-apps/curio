import { and, desc, eq, inArray, TransactionDB } from "@app/api/db";
import { jobs } from "@app/api/db/schema";
import { JobStatus, JobType } from "@app/schemas/db";

export type Job = typeof jobs.$inferSelect;

export function getIncompleteJobs(
  db: TransactionDB,
  profileId: string,
  type: JobType,
): Promise<Job[]> {
  return db
    .select()
    .from(jobs)
    .where(
      and(
        eq(jobs.profileId, profileId),
        eq(jobs.type, type),
        inArray(jobs.status, [JobStatus.PENDING, JobStatus.RUNNING]),
      ),
    )
    .orderBy(desc(jobs.createdAt));
}
