import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
  IsNumber,
  IsUUID,
  ArrayMinSize,
  MaxLength,
  IsIn,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvoiceLineDto {
  @ApiProperty({ example: 'Consulting services' })
  @IsString()
  description: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 10, description: 'Tax rate in %' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate: number;

  @ApiProperty()
  @IsUUID()
  accountId: string;
}

export class CreateInvoiceDto {
  @ApiProperty({ enum: ['sales', 'purchase'] })
  @IsString()
  @IsIn(['sales', 'purchase'])
  type: string;

  @ApiProperty()
  @IsUUID()
  contactId: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  issueDate: string;

  @ApiProperty({ example: '2024-02-15' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [InvoiceLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines: InvoiceLineDto[];
}
