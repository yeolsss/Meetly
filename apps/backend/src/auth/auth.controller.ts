import {
  ClassSerializerInterceptor,
  Controller,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBasicAuth,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Public } from './decorator/public.decorator';
import { Authorization } from './decorator/authorization.decorator';

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
        },
      },
    },
  })
  registerUser(@Authorization() token: string) {
    return this.authService.register(token);
  }
}
