import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../guards/optionalAuth.guard';
import { UserDecorator } from '../users/decorators/user.decorator';
import { SearchDTO } from './dtos/search.dto';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private _searchService: SearchService) { }

  @UseGuards(OptionalAuthGuard)
  @Post()
  @HttpCode(200)
  search(@Body() searchParameters: SearchDTO, @UserDecorator('id') uuid: string) {
    return this._searchService.search(searchParameters, uuid);
  }
}
