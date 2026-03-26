export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="w-6 h-6 border-2 border-[#003049]/15 border-t-[#003049]/50 rounded-full animate-spin" />
    </div>
  );
}
