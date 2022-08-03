import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthenticationController } from './authentication.controller';
import { FacebookStrategy } from './facebook.strategy';
import { GoogleStrategy } from './google.strategy';
import { GoogleIdTokenStrategy } from './google-id-token.strategy';
import { JwtAdminStrategy } from './jwt-admin.strategy';
import { JwtStrategy } from './jwt.strategy';
import { LocalSignupStrategy } from './local-signup.strategy';
import { LocalStrategy } from './local.strategy';

@Module({
  controllers: [AuthenticationController],
  imports: [
    PassportModule.register({
      accessType: 'offline',
      prompt: 'consent',
      approval_prompt: 'force',
      defaultStrategy: 'jwt',
    }),
    ConfigModule,
    UsersModule,
  ],
  providers: [FacebookStrategy, GoogleStrategy, GoogleIdTokenStrategy, JwtStrategy, JwtAdminStrategy, LocalStrategy, LocalSignupStrategy],
  exports: [],
})
export class AuthenticationModule {}
