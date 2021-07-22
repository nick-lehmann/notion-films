import { Transform } from 'class-transformer'

export const ToBoolean = () => {
  const toPlain = Transform(
    ({ value }) => {
      return value
    },
    {
      toPlainOnly: true,
    },
  )
  const toClass = (target: any, key: string) => {
    return Transform(
      ({ obj }) => {
        const value = obj[key]
        return valueToBoolean(value)
      },
      {
        toClassOnly: true,
      },
    )(target, key)
  }
  return function (target: any, key: string) {
    toPlain(target, key)
    toClass(target, key)
  }
}

export const valueToBoolean = (value: any): boolean | unknown => {
  const truthyValues = ['1', 1, 'true', 'True', true]
  const falsyValues = ['0', 0, 'false', 'False', false]
  if (
    typeof value !== 'number' &&
    typeof value !== 'boolean' &&
    typeof value !== 'string'
  ) {
    return value
  }
  if (truthyValues.includes(value)) return true
  if (falsyValues.includes(value)) return false
  return value
}
