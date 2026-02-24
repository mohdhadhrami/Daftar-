import {
  IsString,
  IsOptional,
  MaxLength,
  IsIn,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({ example: '1000' })
  @IsString()
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 'Cash' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: ['asset', 'liability', 'equity', 'revenue', 'expense'] })
  @IsString()
  @IsIn(['asset', 'liability', 'equity', 'revenue', 'expense'])
  accountType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  subType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
