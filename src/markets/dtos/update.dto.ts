import { IsOptional, IsString, MaxLength, Validate } from 'class-validator';
import { CustomLineValidator } from './CustomLineValidator';

export class MarketUpdateDTO {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Validate(CustomLineValidator)
  offerlistNote: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Validate(CustomLineValidator)
  wishlistNote: string;
}
