import { ValidationPipe } from '@nestjs/common';

export const defaultValidationPipe = new ValidationPipe({
  transform: true,
});
