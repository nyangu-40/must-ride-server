import { ADMIN_TOKEN } from '../config/index.js';

export default function adminAuth(req, res, next) {
  const token = (req.headers['x-admin-token'] || req.query?.admin_token || '').toString();

  if (!ADMIN_TOKEN) {
    return res.status(500).json({ message: 'Admin token not configured on server.' });
  }

  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return next();
}
