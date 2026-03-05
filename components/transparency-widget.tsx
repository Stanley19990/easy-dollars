export function TransparencyWidget() {
  return (
    <section className="py-16 px-4 relative z-10">
      <div className="max-w-4xl mx-auto text-center">
        <div className="cr-glass cr-card-3d rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-4 text-amber-300">Transparent Revenue Sharing</h3>
          <p className="text-lg mb-4 text-cyan-200">
            CashRise grows with you—you get <span className="font-bold neon-text">70% of revenue</span>.
          </p>
          <p className="text-slate-300">No scams. No Ponzi. Just real earnings from Google AdMob.</p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-cyan-500/10 rounded-2xl p-4 border border-cyan-400/20">
              <div className="text-2xl font-bold text-cyan-200">70%</div>
              <div className="text-sm text-slate-300">Your Share</div>
            </div>
            <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-400/20">
              <div className="text-2xl font-bold text-amber-200">30%</div>
              <div className="text-sm text-slate-300">Platform Fee</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
