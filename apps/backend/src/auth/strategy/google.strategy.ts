import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  StrategyOptions,
  VerifyCallback,
} from 'passport-google-oauth20';
import { envVariableKeys } from '../../common/constants/env.constant';

interface GoogleProfile {
  displayName: string;
  emails: { value: string }[];
  photos: { value: string }[];
  id: string;
  provider: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    console.log(
      configService.get<string>(envVariableKeys.googleClientId),
      configService.get<string>(envVariableKeys.googleClientSecret),
      configService.get<string>(envVariableKeys.googleCallbackUrl),
    );
    super({
      clientID: configService.get<string>(envVariableKeys.googleClientId)!,
      clientSecret: configService.get<string>(
        envVariableKeys.googleClientSecret,
      )!,
      callbackURL: configService.get<string>(
        envVariableKeys.googleCallbackUrl,
      )!,
      scope: ['email', 'profile'],
    } as StrategyOptions);
  }

  // refreshToken를 얻기 위한 필수 코드
  authorizationParams(): { [key: string]: string } {
    return {
      access_type: 'offline',
      prompt: 'select_account',
    };
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName } = profile;
    const user = {
      googleId: id,
      email: emails[0].value,
      displayName,
      accessToken,
    };
    done(null, user);
  }
}
