import { Module } from '@nestjs/common'
import { MailModule } from '../mail/mail.module'
import { VerificationController } from './verification.controller'
import { VerificationService } from './verification.service'

@Module({
  imports: [MailModule],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
