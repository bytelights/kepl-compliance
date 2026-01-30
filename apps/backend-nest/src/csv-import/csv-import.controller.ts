import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { CsvImportService } from './csv-import.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('admin/import')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class CsvImportController {
  constructor(private readonly csvImportService: CsvImportService) {}

  @Post('csv')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Query('mode') mode: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!['preview', 'commit'].includes(mode)) {
      throw new BadRequestException(
        'Mode must be either "preview" or "commit"',
      );
    }

    const fileContent = file.buffer.toString('utf-8');

    const result = await this.csvImportService.parseAndValidate(
      fileContent,
      user.workspaceId,
      mode as 'preview' | 'commit',
      user.sub,
    );

    return {
      success: true,
      data: result,
      message:
        mode === 'preview'
          ? 'CSV validated successfully'
          : 'CSV imported successfully',
    };
  }

  @Get('jobs')
  async getImportJobs(@CurrentUser() user: JwtPayload) {
    const data = await this.csvImportService.getImportJobs(user.workspaceId);
    return { success: true, data };
  }

  @Get('jobs/:id')
  async getImportJobDetails(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.csvImportService.getImportJobDetails(
      id,
      user.workspaceId,
    );
    return { success: true, data };
  }
}
