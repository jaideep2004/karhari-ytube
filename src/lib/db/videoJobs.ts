import { ObjectId, Db } from "mongodb";
import { getDb } from "./mongo";

export type VideoJobStatus = "queued" | "downloading" | "generating" | "uploading" | "done" | "failed";
export type VideoPreset = "bars" | "circular" | "wave" | "pulse";
export type VideoColor = "cyan" | "green" | "pink" | "purple" | "red" | "white";

export type VideoJobDoc = {
  _id?: ObjectId;
  userId: ObjectId;
  status: VideoJobStatus;
  input: {
    audioR2Key: string;
    artworkR2Key?: string | null;
    title: string;
    artist: string;
    preset: VideoPreset;
    color?: VideoColor;
    visibility?: "public" | "unlisted" | "private";
    scheduleAt?: string | null;
    description?: string | null;
  };
  output?: {
    r2VideoKey?: string;
    r2Url?: string;
    duration?: number;
    fileSize?: number;
  };
  progress: { phase: string; pct: number; updatedAt: Date };
  destinations?: { platform: string; channelId?: string; pageId?: string; externalId?: string; videoUrl?: string; status?: string; error?: string }[];
  error?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function videoJobsCollection(db?: Db) {
  const d = db || (await getDb());
  return d.collection<VideoJobDoc>("videoJobs");
}

export async function createVideoJob(params: {
  userId: string | ObjectId;
  input: VideoJobDoc["input"];
}) {
  const col = await videoJobsCollection();
  const now = new Date();
  const doc: VideoJobDoc = {
    userId: typeof params.userId === "string" ? new ObjectId(params.userId) : params.userId,
    status: "queued",
    input: params.input,
    progress: { phase: "queued", pct: 0, updatedAt: now },
    createdAt: now,
    updatedAt: now,
    error: null,
  };
  const res = await col.insertOne(doc);
  return { ...doc, _id: res.insertedId };
}

export async function getVideoJob(id: string) {
  const col = await videoJobsCollection();
  if (!ObjectId.isValid(id)) return null;
  return col.findOne({ _id: new ObjectId(id) });
}

export async function listVideoJobs(userId: string | ObjectId, opts?: { page?: number; limit?: number; status?: string }) {
  const col = await videoJobsCollection();
  const uid = typeof userId === "string" ? new ObjectId(userId) : userId;
  const filter: Record<string, unknown> = { userId: uid };
  if (opts?.status) filter.status = opts.status;
  const page = Math.max(1, opts?.page || 1);
  const limit = Math.min(50, Math.max(1, opts?.limit || 20));
  const skip = (page - 1) * limit;
  const [jobs, total] = await Promise.all([
    col.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    col.countDocuments(filter),
  ]);
  return { jobs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateVideoJob(id: string | ObjectId, patch: Partial<VideoJobDoc>) {
  const col = await videoJobsCollection();
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  const now = new Date();
  await col.updateOne({ _id }, { $set: { ...patch, updatedAt: now } });
}

export async function setJobProgress(id: string | ObjectId, phase: string, pct: number) {
  const col = await videoJobsCollection();
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  await col.updateOne({ _id }, { $set: { progress: { phase, pct, updatedAt: new Date() }, updatedAt: new Date() } });
}

export async function ensureVideoJobIndexes() {
  const col = await videoJobsCollection();
  await col.createIndex({ userId: 1, createdAt: -1 });
  await col.createIndex({ status: 1 });
}
