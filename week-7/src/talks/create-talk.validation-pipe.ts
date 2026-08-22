import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { CreateTalkDto } from "../talks/create-talk.dto.ts";

@Injectable()
export class CreateTalkValidationPipe implements PipeTransform {
  async transform(value: unknown): Promise<CreateTalkDto> {
    const dto = plainToInstance(CreateTalkDto, value ?? {});
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new BadRequestException({
        message: "Validation failed",
        errors: errors.map((error) => ({
          property: error.property,
          constraints: error.constraints,
        })),
      });
    }

    return dto;
  }
}
