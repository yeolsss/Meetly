import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entiy/user.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import * as bcrypt from 'bcrypt';
import { envVariableKeys } from '../common/constants/env.constant';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  parseBasicToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포멧이 잘못됐습니다.');
    }

    const [basic, token] = basicSplit;

    if (basic.toLowerCase() !== 'basic') {
      throw new BadRequestException('토큰 포멧이 잘못됐습니다.');
    }

    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    const tokenSplit = decoded.split(':');

    if (tokenSplit.length !== 2) {
      throw new BadRequestException('토큰 포멧이 잘못됐습니다.');
    }

    const [email, password] = tokenSplit;

    return { email, password };
  }

  async parseRefreshToken(rawToken: string) {
    const cookieArray = rawToken.split(';').map((cookie) => cookie.trim());
    const refreshTokenCookie = cookieArray.find((cookie) =>
      cookie.startsWith('refreshToken='),
    );

    if (!refreshTokenCookie) {
      throw new BadRequestException('토큰 포멧이 잘못됐습니다.');
    }

    const refreshToken = refreshTokenCookie.split('=');

    if (refreshToken.length !== 2) {
      throw new BadRequestException('토큰 포멧이 잘못됐습니다.');
    }

    const [refresh, token] = refreshToken;

    if (refresh.toLowerCase() !== 'refreshtoken') {
      throw new BadRequestException('토큰 포멧이 잘못됐습니다.');
    }

    try {
      return await this.jwtService.verify(token, {
        secret: this.configService.get<string>(
          envVariableKeys.refreshTokenSecret,
        ),
      });
    } catch (e) {
      throw new UnauthorizedException(e);
    }
  }

  async issueToken(user: Partial<User>, isRefreshToken: boolean) {
    const refreshTokenSecret = this.configService.get<string>(
      envVariableKeys.refreshTokenSecret,
    );

    const accessTokenSecret = this.configService.get<string>(
      isRefreshToken
        ? envVariableKeys.refreshTokenSecret
        : envVariableKeys.accessTokenSecret,
    );

    return await this.jwtService.signAsync(
      {
        sub: user.email,
        type: isRefreshToken ? 'refresh' : 'access',
      },
      {
        secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
        expiresIn: isRefreshToken ? '30d' : '1m',
      },
    );
  }

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException('잘못된 로그인 정보입니다.');
    }
    const passOk = await bcrypt.compare(password, user.password);

    if (!passOk) {
      throw new BadRequestException('잘못된 로그인 정보입니다.');
    }

    return user;
  }

  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      throw new BadRequestException('이미 가입된 이메일입니다.');
    }

    const hashPassword = await bcrypt.hash(
      password,
      this.configService.get<number>(envVariableKeys.hashRounds)!,
    );

    await this.userRepository.save({
      email,
      password: hashPassword,
    });

    return this.userRepository.findOne({ where: { email } });
  }

  async login(rawToken: string, response: Response) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.authenticate(email, password);

    const refreshToken = await this.issueToken(user, true);
    const accessToken = await this.issueToken(user, false);

    const envMode =
      this.configService.get<string>(envVariableKeys.env) !== 'dev';

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: envMode ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return {
      accessToken,
      user: {
        email: user.email,
      },
    };
  }
}
