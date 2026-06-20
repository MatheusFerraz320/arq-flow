import { Module } from '@nestjs/common';
import { ProjectPhotosController } from './project-photos.controller';
import { ProjectPhotosService } from './project-photos.service';

@Module({
  controllers: [ProjectPhotosController],
  providers: [ProjectPhotosService],
})
export class ProjectPhotosModule {}
