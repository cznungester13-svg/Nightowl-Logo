import {
  clerkClient,
  getAuth,
  type User,
} from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

export type AdminIdentity = {
  email: string;
  isAdmin: boolean;
  allowlistConfigured: boolean;
};

function getAllowedEmails(): Set<string> {
  return new Set(
    (process.env.NIGHTOWL_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function getPrimaryEmail(user: User): string {
  const primary = user.emailAddresses.find(
    (address) => address.id === user.primaryEmailAddressId,
  );
  return (primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "")
    .trim()
    .toLowerCase();
}

export async function getAdminIdentity(
  req: Request,
): Promise<AdminIdentity | null> {
  const { userId } = getAuth(req);
  if (!userId) return null;

  const user = await clerkClient.users.getUser(userId);
  const email = getPrimaryEmail(user);
  const allowedEmails = getAllowedEmails();

  return {
    email,
    isAdmin: Boolean(email) && allowedEmails.has(email),
    allowlistConfigured: allowedEmails.size > 0,
  };
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const identity = await getAdminIdentity(req);
  if (!identity) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (!identity.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}