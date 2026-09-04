export function AdSlot({ label = 'Advertisement', slot, className = '' }: { label?: string; slot?: string; className?: string }) {
  return (
    <div className={`mx-auto flex min-h-[280px] w-full max-w-[720px] items-center justify-center rounded border border-zinc-200 bg-zinc-50 px-4 ${className}`}>
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-widest text-zinc-400">{label}</div>
        <div className="mt-1 text-sm text-zinc-500">Ad slot — 336×280 (AdSense{slot ? ` • ${slot}` : ''})</div>
        {/* Replace div above with real AdSense after approval:
         <ins className="adsbygoogle" style={{display:'block'}} data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true"></ins>
         <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        */}
      </div>
    </div>
  );
}
export function AdBanner({ slot = '6969748554', className = '' }: { slot?: string; className?: string }) {
  return <AdSlot slot={slot} className={className} />;
}