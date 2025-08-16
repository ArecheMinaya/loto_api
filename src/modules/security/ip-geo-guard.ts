import { Request, Response, NextFunction } from 'express';
import { supabase } from '@/config/supabase';
import { AuthorizationError } from '@/shared/errors';
import { logger } from '@/config/logger';

interface GeoProvider {
  getCountry(ip: string): Promise<string | null>;
  getCity(ip: string): Promise<string | null>;
}

// Stub implementation - replace with real geolocation service
class StubGeoProvider implements GeoProvider {
  async getCountry(ip: string): Promise<string | null> {
    logger.debug({ ip }, 'Stub geo provider - accepting all IPs');
    return 'DO'; // Dominican Republic
  }

  async getCity(ip: string): Promise<string | null> {
    logger.debug({ ip }, 'Stub geo provider - accepting all IPs');
    return 'Santo Domingo';
  }
}

const geoProvider = new StubGeoProvider();

export function ipGeoGuard() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
      const bancaId = req.body?.banca_id || req.params?.bancaId;

      logger.debug({ clientIp, bancaId }, 'Checking IP/Geo restrictions');

      if (bancaId) {
        // Check IP whitelist for this banca
        const { data: banca, error } = await supabase
          .from('bancas')
          .select('ip_whitelist')
          .eq('id', bancaId)
          .single();

        if (error) {
          logger.warn({ error: error.message, bancaId }, 'Error fetching banca IP whitelist');
        } else if (banca?.ip_whitelist?.length > 0) {
          if (!banca.ip_whitelist.includes(clientIp)) {
            throw new AuthorizationError(`IP ${clientIp} no autorizada para esta banca`);
          }
        }
      }

      // Optional geofencing (can be enabled via env)
      const country = await geoProvider.getCountry(clientIp);
      if (country && country !== 'DO') {
        logger.warn({ clientIp, country }, 'Access from outside Dominican Republic');
        // Uncomment to enforce geofencing
        // throw new AuthorizationError('Acceso desde fuera de República Dominicana no permitido');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}