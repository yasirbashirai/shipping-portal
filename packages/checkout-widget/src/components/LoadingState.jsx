/**
 * Loading skeleton component displayed while fetching rates
 * Shows pulse animation cards to prevent blank white space
 */
export default function LoadingState() {
  return (
    <div className="space-y-4" data-testid="rates-loading">
      <div className="text-center">
        <div className="inline-flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-700">Getting your best shipping rates...</p>
        </div>
        <p className="text-xs text-gray-500 mt-1">Checking 4 carriers for the best price</p>
      </div>

      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 border border-gray-200 rounded-card animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-[50px] h-[30px] bg-gray-200 rounded" />
              <div>
                <div className="w-24 h-4 bg-gray-200 rounded mb-2" />
                <div className="w-16 h-3 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="text-right">
              <div className="w-20 h-7 bg-gray-200 rounded mb-1" />
              <div className="w-16 h-3 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
