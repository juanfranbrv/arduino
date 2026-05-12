import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import type { GenericCtx } from "@convex-dev/better-auth/utils";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";

import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import authConfig from "../auth.config";
import schema from "./schema";

export const authComponent = createClient<DataModel, typeof schema>(
  components.betterAuth,
  {
    local: { schema },
    verbose: false,
  },
);

const authAllowedHosts = (
  process.env.AUTH_ALLOWED_HOSTS ??
  "localhost,localhost:3000,127.0.0.1,127.0.0.1:3000,arduino-bauset.vercel.app"
)
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const authTrustedOrigins = (
  process.env.AUTH_TRUSTED_ORIGINS ??
  "http://localhost:3000,https://arduino-bauset.vercel.app"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    appName: "Portal de Clase Arduino",
    baseURL: {
      allowedHosts: authAllowedHosts,
      fallback: process.env.SITE_URL ?? "https://arduino-bauset.vercel.app",
      protocol: "auto",
    },
    advanced: {
      trustedProxyHeaders: true,
    },
    trustedOrigins: authTrustedOrigins,
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: false,
    },
    socialProviders:
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            },
          }
        : undefined,
    plugins: [convex({ authConfig })],
  } satisfies BetterAuthOptions;
};

export const options = createAuthOptions({} as GenericCtx<DataModel>);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};
