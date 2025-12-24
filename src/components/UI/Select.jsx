import './Select.css'

const Select = ({
  options = [],
  value,
  onChange,
  placeholder = 'Sélectionner...',
  disabled = false,
  error = false,
  className = '',
  ...props
}) => {
  const baseClass = 'select'
  const errorClass = error ? 'select-error' : ''
  const disabledClass = disabled ? 'select-disabled' : ''

  const classes = [baseClass, errorClass, disabledClass, className]
    .filter(Boolean)
    .join(' ')

  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={classes}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value || option} value={option.value || option}>
          {option.label || option}
        </option>
      ))}
    </select>
  )
}

export default Select