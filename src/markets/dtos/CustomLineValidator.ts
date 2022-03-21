import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'customText', async: false })
export class CustomLineValidator implements ValidatorConstraintInterface {
  validate(text: string) {
    return (text.match(/\n/g) || []).length < 10;
  }

  defaultMessage() {
    return 'Limit is 10 lines';
  }
}
