import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose'],
  });
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const config = new DocumentBuilder()
    .setTitle('Meetly')
    .setDescription('모임 관리 서비스')
    .setVersion('1.0')
    //NOTE: Swagger Auth setting
    .addBasicAuth()
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  function filterDocByVersion(doc: any, version: 'v1' | 'v2') {
    const copy = JSON.parse(JSON.stringify(doc));
    const prefix = `/${version}`;
    for (const path in copy.paths) {
      if (!path.startsWith(prefix)) {
        delete copy.paths[path];
      }
    }
    return copy;
  }

  SwaggerModule.setup('v1/doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    patchDocumentOnRequest: (_req, _res, doc) => filterDocByVersion(doc, 'v1'),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        // class type의 기반으로 request 값의 형태를 바꾼다.
        enableImplicitConversion: true,
      },
    }),
  );
  await app.listen(3000);
}
bootstrap();
