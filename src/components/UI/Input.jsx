import './Input.css'

const Input = ({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  disabled = false,
  error = false,
  className = '',
  ...props
}) => {
  const baseClass = 'input'
  const errorClass = error ? 'input-error' : ''
  const disabledClass = disabled ? 'input-disabled' : ''

  const classes = [baseClass, errorClass, disabledClass, className]
    .filter(Boolean)
    .join(' ')

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={classes}
      {...props}
    />
  )
}

export default Input