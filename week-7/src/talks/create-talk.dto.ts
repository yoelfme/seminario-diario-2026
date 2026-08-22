import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateTalkDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  speaker!: string;
}
