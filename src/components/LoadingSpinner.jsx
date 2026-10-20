export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="w-6 h-6 border-2 border-[#14213D]/15 border-t-[#14213D]/50 rounded-full animate-spin" />
    </div>
  );
}
