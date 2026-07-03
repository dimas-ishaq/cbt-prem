import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (() => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error(
            'JWT_SECRET belum diset. Isi di environment variables.',
          );
        }
        return secret;
      })(),
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        role: true,
        authVersion: true,
        isActive: true,
      },
    });
    if (!user || !user.isActive)
      throw new UnauthorizedException('Token tidak valid');
    if ((payload.authVersion ?? 0) !== user.authVersion)
      throw new UnauthorizedException('Token kedaluwarsa');
    return {
      userId: user.id,
      username: user.username,
      role: user.role,
      authVersion: user.authVersion,
    };
  }
}
