import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBasicAuth,
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Public } from './decorator/public.decorator';
import { Authorization } from './decorator/authorization.decorator';
import { Request, Response } from 'express';
import { GoogleAuthGuard } from './guard/google-auth.guard';

@Controller({ path: 'auth', version: '1' })
@ApiBearerAuth('Auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiBasicAuth('BasicAuth')
  @ApiOperation({
    summary: '회원 등록',
    description:
      '프론트엔드에서 `Authorization: Basic <base64(username:password)>` 헤더로 요청합니다.',
  })
  @ApiBody({
    schema: {
      example: {
        nickname: '사용자닉네임',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '회원 등록 성공',
    schema: {
      example: {
        success: true,
        message: '회원이 등록되었습니다.',
        data: {
          id: 123,
          email: 'user@example.com',
          role: 1,
        },
      },
    },
  })
  registerUser(
    @Authorization() token: string,
    @Body() nickname: { nickname: string },
  ) {
    return this.authService.register(token, nickname.nickname);
  }

  @Public()
  @ApiBasicAuth('BasicAuth')
  @ApiOperation({
    summary: '로그인',
    description:
      '프론트엔드에서 `Authorization: Basic <base64(username:password)>` 헤더로 요청합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '로그인 성공',
    schema: {
      example: {
        accessToken: 'jwt access token',
        user: {
          email: 'user@example.com',
        },
      },
    },
  })
  @Post('login')
  loginUser(
    @Authorization() token: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(token, response);
  }

  @Public()
  @Post('token/issue')
  async rotateAccessToken(@Req() request: Request) {
    const refreshToken = request.headers.cookie;

    if (!refreshToken) {
      throw new BadRequestException('리프레시 토큰이 없습니다.');
    }

    const payload = await this.authService.parseRefreshToken(refreshToken);
    const user = { email: payload.sub };

    return {
      accessToken: await this.authService.issueToken(user, false),
    };
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth 로그인',
    description:
      'Google OAuth 인증 페이지로 리다이렉트됩니다.</br> `Swagger에서는 작동하지 않습니다.`',
  })
  async googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth 콜백',
    description:
      'Google OAuth 인증 후 리다이렉트되는 엔드포인트입니다.</br> `Swagger에서는 작동하지 않습니다.`',
  })
  @ApiResponse({
    status: 200,
    description: 'Google 로그인 성공',
    schema: {
      example: {
        accessToken: 'jwt access token',
        user: {
          email: 'user@example.com',
        },
      },
    },
  })
  async googleAuthRedirect(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const googleUser = req.user as {
      googleId: string;
      email: string;
      displayName: string;
    };

    const user = await this.authService.validateGoogleUser(googleUser);
    return this.authService.googleLogin(user, response);
  }
}
