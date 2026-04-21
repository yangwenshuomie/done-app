interface Props {
  msg: string
}

export default function Toast({ msg }: Props) {
  return (
    <div className={`toast${msg ? ' show' : ''}`}>{msg}</div>
  )
}
