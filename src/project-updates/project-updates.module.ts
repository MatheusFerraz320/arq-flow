import { Module } from '@nestjs/common';
import { ProjectUpdatesController } from './project-updates.controller';
import { ProjectUpdatesService } from './project-updates.service';

@Module({
  controllers: [ProjectUpdatesController],
  providers: [ProjectUpdatesService],
})
export class ProjectUpdatesModule {}
