import { createParamDecorator } from '@nestjs/common';

export const UserDecorator = createParamDecorator((data, req) => {
  return data && req.args[0].user ? req.args[0].user[data] : req.args[0].user;
});
