import { IsEmail, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'accountant', enum: ['admin', 'accountant', 'sales', 'viewer'] })
  @IsString()
  @IsIn(['admin', 'accountant', 'sales', 'viewer'])
  role: string;
}
