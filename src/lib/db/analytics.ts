import { ObjectId } from "mongodb";
import { getDb } from "./mongo";


export type AnalyticsEventDoc = {
  _id?: ObjectId;
  type: "visit" | "upload";
  path?: string;
  userId?: ObjectId;
  ip?: string;
  ua?: string;
  createdAt: Date;
};

export async function logEvent(doc: Omit<AnalyticsEventDoc, "createdAt">) {
  try {
    const db = await getDb();
    await db.collection("analyticsEvents").insertOne({ ...doc, createdAt: new Date() });
  } catch (e) {
    console.warn("[analytics] log failed", e);
  }
}

export async function getStats() {
  const db = await getDb();
  const [visits, users, jobs, uploadsByUser] = await Promise.all([
    db.collection("analyticsEvents").countDocuments({ type: "visit" }),
    db.collection("users").countDocuments({}),
    db.collection("videoJobs").countDocuments({}),
    db
      .collection("videoJobs")
      .aggregate([
        { $group: { _id: "$userId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
      ])
      .toArray(),
  ]);

  const recentUsers = await db.collection("users").find({}).sort({ createdAt: -1 }).limit(10).toArray();
  const recentJobs = await db.collection("videoJobs").find({}).sort({ createdAt: -1 }).limit(10).toArray();

  return { visits, users, jobs, uploadsByUser, recentUsers, recentJobs };
}