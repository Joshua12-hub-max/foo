import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const token = req.cookies.accessToken;
  
  if (!token) {
    return res.status(401).json({ message: "You are not authenticated" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token is not valid" });
    }
    
    req.user = user;
    next();
  });
};

export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === 'admin' || req.user.role === 'hr') {
      next();
    } else {
      res.status(403).json({ message: "You are not allowed to do that!" });
    }
  });
};

// Alias for verifyToken - used by SPMS routes
export const authenticateToken = verifyToken;

// Role-based access control middleware
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "You are not authenticated" });
    }
    
    const userRole = req.user.role?.toLowerCase();
    const roles = allowedRoles.map(r => r.toLowerCase());
    
    if (roles.includes(userRole)) {
      next();
    } else {
      res.status(403).json({ message: "You do not have permission to perform this action" });
    }
  };
};
