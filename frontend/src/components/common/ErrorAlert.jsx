const ErrorAlert = ({ message, onDismiss }) => {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm animate-fade-in">
      <span className="text-base leading-none mt-0.5">⚠</span>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-300 leading-none">✕</button>
      )}
    </div>
  );
};

export default ErrorAlert;
