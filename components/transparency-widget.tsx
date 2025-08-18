export function TransparencyWidget() {
  return (
    <section className="py-16 px-4 relative z-10">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-slate-800/50 neon-border rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-4 text-amber-300">100% Transparent Revenue Sharing</h3>
          <p className="text-lg mb-4 text-cyan-300">
            We profit from ads—you get <span className="font-bold neon-text">70% of revenue</span>!
          </p>
          <p className="text-slate-300">No scams. No Ponzi. Just real earnings from Google AdMob.</p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-cyan-500/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-cyan-300">70%</div>
              <div className="text-sm text-slate-300">Your Share</div>
            </div>
            <div className="bg-amber-500/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-amber-300">30%</div>
              <div className="text-sm text-slate-300">Platform Fee</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
