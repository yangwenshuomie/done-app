interface Props {
  msg: string
  onOk: () => void
  onCancel: () => void
  okLabel?: string
  danger?: boolean
}

export default function ConfirmDialog({ msg, onOk, onCancel, okLabel = '确定', danger = true }: Props) {
  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-box" onClick={e => e.stopPropagation()}>
        <div className="confirm-msg">{msg}</div>
        <div className="confirm-btns">
          <button className="confirm-cancel" onClick={onCancel}>取消</button>
          <button
            className="confirm-ok"
            style={danger ? {} : { background: 'var(--ink)' }}
            onClick={onOk}
          >
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
