import {
  BadRequestException,
  ClassSerializerInterceptor,
  Controller,
  Post,
  Req,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBasicAuth, ApiBearerAuth, ApiOperation, ApiResponse, } from '@nestjs/swagger';
import { Public } from './decorator/public.decorator';
import { Authorization } from './decorator/authorization.decorator';
import { Request, Response } from 'express';

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
  registerUser(@Authorization() token: string) {
    return this.authService.register(token);
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
}
