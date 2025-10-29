import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    try {
      return await client.discovery(
        new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
        process.env.REPL_ID!
      );
    } catch (error: any) {
      console.error('[OIDC] Failed to discover OIDC configuration:', {
        error: error?.message,
        issuerUrl: process.env.ISSUER_URL,
      });
      throw error;
    }
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  const userId = claims["sub"];
  const email = claims["email"];
  const firstName = claims["first_name"] || "User";
  const lastName = claims["last_name"] || "";
  
  const existingUser = await storage.getUser(userId);
  if (existingUser) {
    return;
  }
  
  const normalizedEmail = email.toLowerCase();
  console.log(`[OIDC] upsertUser called for ${normalizedEmail}, userId: ${userId}`);
  
  const pendingInvitation = await storage.getPendingInvitationByEmail(normalizedEmail);
  
  if (pendingInvitation) {
    console.log(`[OIDC] Creating user from pending invitation, role: ${pendingInvitation.role}`);

    await storage.upsertUser({
      id: userId,
      email: email,
      firstName: firstName,
      lastName: lastName,
      profileImageUrl: claims["profile_image_url"],
      role: pendingInvitation.role,
      organizationId: pendingInvitation.organizationId || undefined,
      invitationStatus: 'pending',
    });
  } else {
    const isAdmin = normalizedEmail.includes('admin') && normalizedEmail.includes('@propertyflows.com');
    console.log(`[OIDC] Admin check for ${normalizedEmail}: ${isAdmin}`);
    if (isAdmin) {
      console.log(`[OIDC] Creating admin user`);

      await storage.upsertUser({
        id: userId,
        email: email,
        firstName: firstName,
        lastName: lastName,
        profileImageUrl: claims["profile_image_url"],
        role: 'admin',
        invitationStatus: 'accepted',
      });
    } else {
      const organization = await storage.getOrganizationByContactEmail(normalizedEmail);
      console.log(`[OIDC] Organization lookup for ${normalizedEmail}: ${organization ? organization.id : 'none'}`);
      if (organization) {
        console.log(`[OIDC] Creating property_manager for org ${organization.id}`);

        await storage.upsertUser({
          id: userId,
          email: email,
          firstName: firstName,
          lastName: lastName,
          profileImageUrl: claims["profile_image_url"],
          role: 'property_manager',
          organizationId: organization.id,
          invitationStatus: 'accepted',
        });
      } else {
        console.error(`[OIDC] RBAC DENIED for ${normalizedEmail} - no invitation, not admin, no organization`);
        throw new Error('RBAC_DENIED: User must be invited or have a registered organization');
      }
    }
  }
}

export async function setupAuth(app: Express) {
  try {
    app.set("trust proxy", 1);
    app.use(getSession());
    app.use(passport.initialize());
    app.use(passport.session());

    const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const claims = tokens.claims();
      if (!claims) {
        console.error('[OIDC] No claims found in token response');
        return verified(new Error('No claims found'), undefined);
      }
      
      const user: any = {
        id: claims["sub"],
      };
      updateUserSession(user, tokens);
      await upsertUser(claims);
      verified(null, user);
    } catch (error: any) {
      console.error('[OIDC] Error in token verification:', error?.message);
      verified(error, undefined);
    }
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, async (err: any, user: any) => {
      if (err || !user) {
        return res.redirect("/api/login");
      }
      
      const userId = user.claims.sub;
      const mfaSettings = await storage.getMfaSettings(userId);
      
      if (mfaSettings?.totpEnabled) {
        const { mfaService } = await import('./services/mfaService.js');
        const deviceFingerprint = mfaService.generateDeviceFingerprint(
          req.get('user-agent') || '',
          req.ip || ''
        );
        
        const trustedDevice = await storage.getTrustedDevice(userId, deviceFingerprint);
        
        if (!trustedDevice) {
          (req.session as any).requiresMfa = true;
          (req.session as any).mfaUserId = userId;
          (req.session as any).pendingUser = user;
          return res.redirect("/mfa-verify");
        }
      }
      
      req.logIn(user, async (loginErr) => {
        if (loginErr) {
          return res.redirect("/api/login");
        }
        res.redirect("/");
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
  } catch (error: any) {
    console.error('[OIDC] Failed to setup authentication:', {
      error: error?.message,
      stack: error?.stack,
    });
    throw error;
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
