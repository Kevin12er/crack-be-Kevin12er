import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { EmailModule } from '../email/email.module';
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }), // Explicitly register default strategy
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'super-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  exports: [AuthService, JwtModule, JwtStrategy, PassportModule],
})
export class AuthModule {}

//1. disini secret key jwt berlaku sebagai "KTP DIGITAL", karena ini memrupakan praktik terbaik untuk mencegah hacker
//memanipulasi data dan untuk memastikan token asli agar nest.js tidak perlu mengecek database berkali kali.
//2. untuk kasus hacker disini jika dia mencoba mengubah email didalam token dari siswa@gmail.com stempelnya akan rusak karena
//dia tidak tahu apa secret key nya 
