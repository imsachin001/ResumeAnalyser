const { clerkMiddleware, getAuth } = require('@clerk/express');

/**
 * Middleware to verify Clerk authentication
 * Protects API endpoints that require authentication
 * 
 * Usage: Add to Express app before routes
 */
const requireAuth = (req, res, next) => {
  const auth = getAuth(req);
  const hasAuthHeader = !!req.headers.authorization;
  const hasClerkSecret = !!(process.env.CLERK_SECRET_KEY && process.env.CLERK_SECRET_KEY.trim());

  if (!auth || !auth.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: hasAuthHeader
        ? 'Authentication token could not be verified by backend.'
        : 'Authentication required',
      details: {
        hasAuthorizationHeader: hasAuthHeader,
        hasClerkSecretKey: hasClerkSecret,
        hint: !hasClerkSecret
          ? 'Set CLERK_SECRET_KEY in server/.env from Clerk Dashboard > API Keys.'
          : 'Sign out/in again and retry to refresh the token.'
      }
    });
  }

  // Keep auth details on request for downstream handlers.
  req.auth = auth;
  next();
};

module.exports = { 
  clerkMiddleware,
  requireAuth 
};
