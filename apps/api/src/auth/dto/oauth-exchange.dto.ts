import { IsIn, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class OAuthExchangeDto {
  @IsIn(['google'])
  provider: 'google';

  @IsString()
  @IsNotEmpty()
  authorizationCode: string;

  @IsUrl({ require_protocol: true, require_tld: false })
  redirectUri: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  codeVerifier?: string;
}
