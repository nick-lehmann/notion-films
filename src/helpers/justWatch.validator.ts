import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  isNumberString,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'

// List of numbers, separated by a comma
// e.g. 1,4,5,10
export type CommaSeparatedNumberList = string

@ValidatorConstraint()
export class IsJustWatchProvidersConstraint
  implements ValidatorConstraintInterface
{
  defaultMessage = (): string => 'The provider string is invalid'

  validate(value: any, args: ValidationArguments): boolean {
    if (typeof value !== 'string') return false
    const parts = value.split(',')

    for (const part of parts) {
      if (!isNumberString(part)) return false
    }

    return true
  }
}

export function IsJustWatchProviders(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsJustWatchProvidersConstraint,
    })
  }
}
