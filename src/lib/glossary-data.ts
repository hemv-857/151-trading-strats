// Glossary terms — inspired by the paper's 900+ glossary, acronym, and math definitions.
// Curated to the most important terms for understanding the strategies in this terminal.

export interface GlossaryTerm {
  term: string;
  category: GlossaryCategory;
  definition: string;
  relatedStrategy?: string; // strategy id
  seeAlso?: string[];
}

export type GlossaryCategory =
  | "options"
  | "volatility"
  | "fixed-income"
  | "stocks"
  | "risk"
  | "macro"
  | "trading";

export const GLOSSARY_CATEGORIES: { id: GlossaryCategory; label: string; icon: string; color: string }[] = [
  { id: "options", label: "Options & Greeks", icon: "Layers", color: "text-emerald-400" },
  { id: "volatility", label: "Volatility", icon: "Activity", color: "text-rose-400" },
  { id: "fixed-income", label: "Fixed Income", icon: "Landmark", color: "text-sky-400" },
  { id: "stocks", label: "Stocks & Factors", icon: "TrendingUp", color: "text-emerald-400" },
  { id: "risk", label: "Risk & Portfolio", icon: "ShieldAlert", color: "text-amber-400" },
  { id: "macro", label: "Macro & FX", icon: "Globe", color: "text-cyan-400" },
  { id: "trading", label: "Trading & Execution", icon: "ArrowLeftRight", color: "text-violet-400" },
];

export const GLOSSARY: GlossaryTerm[] = [
  // ---------- OPTIONS & GREEKS ----------
  { term: "Call Option", category: "options", definition: "A contract giving the holder the right (but not the obligation) to buy an underlying asset at a specified strike price on or before expiration. Profit from rising prices.", relatedStrategy: "long-call" },
  { term: "Put Option", category: "options", definition: "A contract giving the holder the right to sell an underlying asset at a specified strike price on or before expiration. Profit from falling prices.", relatedStrategy: "long-put" },
  { term: "Strike Price (K)", category: "options", definition: "The fixed price at which an option holder can exercise their right to buy (call) or sell (put) the underlying asset." },
  { term: "Premium", category: "options", definition: "The price paid by the option buyer to the seller (writer) for the option contract. Determined by intrinsic value + time value." },
  { term: "Intrinsic Value", category: "options", definition: "The immediate exercise value of an option: max(S−K, 0) for a call, max(K−S, 0) for a put, where S is the spot price." },
  { term: "Time Value", category: "options", definition: "The portion of an option's premium above its intrinsic value, reflecting the probability of future favorable moves before expiration." },
  { term: "Moneyness (ITM/ATM/OTM)", category: "options", definition: "ITM = intrinsic value > 0 (profitable to exercise); ATM = strike ≈ spot; OTM = intrinsic value = 0 (not profitable to exercise)." },
  { term: "Delta (Δ)", category: "options", definition: "Rate of change of option price with respect to the underlying price. Call delta ∈ [0,1], put delta ∈ [-1,0]. Also approximates the hedge ratio and probability of finishing ITM.", relatedStrategy: "covered-call" },
  { term: "Gamma (Γ)", category: "options", definition: "Rate of change of delta with respect to the underlying price. Measures convexity — how quickly delta changes. Highest for ATM short-dated options." },
  { term: "Vega (ν)", category: "options", definition: "Rate of change of option price with respect to implied volatility (per 1% change). Long options are long vega; higher vol = higher option prices." },
  { term: "Theta (Θ)", category: "options", definition: "Rate of change of option price with respect to time (per day). Usually negative for long options (time decay) and positive for short options (income from decay)." },
  { term: "Rho (ρ)", category: "options", definition: "Rate of change of option price with respect to the risk-free interest rate. Usually small and neglected except for long-dated options." },
  { term: "Implied Volatility (IV)", category: "volatility", definition: "The volatility input that makes the Black-Scholes price equal to the observed market price. A forward-looking measure of expected volatility." },
  { term: "Realized Volatility (RV)", category: "volatility", definition: "The actual volatility of the underlying over a historical period, computed from observed returns. Typically annualized standard deviation of log returns." },
  { term: "Volatility Skew", category: "volatility", definition: "The pattern where OTM puts trade at higher implied vol than OTM calls (in equities). Reflects demand for downside protection. Traded via risk reversals.", relatedStrategy: "volatility-skew" },
  { term: "Volatility Smile", category: "volatility", definition: "The U-shaped pattern of implied volatility across strikes — ATM lowest, wings higher. Common in FX. Contrasts with the equity skew." },
  { term: "Volatility Risk Premium (VRP)", category: "volatility", definition: "The persistent gap where implied vol exceeds realized vol. Selling options harvests this premium but carries tail risk.", relatedStrategy: "volatility-risk-premium", seeAlso: ["Implied Volatility (IV)", "Realized Volatility (RV)"] },
  { term: "VIX", category: "volatility", definition: "The CBOE Volatility Index — a measure of the stock market's expectation of 30-day forward volatility derived from S&P 500 option prices. The 'fear gauge'." },
  { term: "Variance Swap", category: "volatility", definition: "A derivative that pays the difference between realized variance and a pre-agreed strike. Allows pure, delta-neutral volatility exposure.", relatedStrategy: "variance-swap" },
  { term: "Gamma Scalping", category: "volatility", definition: "The practice of delta-hedging a long-gamma position frequently to capture P&L from price oscillations, offsetting theta decay." },
  { term: "Pin Risk", category: "options", definition: "The risk near expiration that an ATM option's assignment is uncertain — the holder doesn't know whether they'll be assigned until after the close." },

  // ---------- OPTIONS STRATEGIES ----------
  { term: "Covered Call", category: "options", definition: "Long stock + short call. Generates income from theta while capping upside above the strike. The classic yield-enhancement overlay.", relatedStrategy: "covered-call" },
  { term: "Protective Put", category: "options", definition: "Long stock + long put. Acts as insurance — pays a premium to lock in a downside floor while retaining upside.", relatedStrategy: "protective-put" },
  { term: "Straddle", category: "options", definition: "Long (or short) call + put at the same strike and expiry. Long straddle profits from a large move either direction; short straddle from low vol.", relatedStrategy: "long-straddle" },
  { term: "Strangle", category: "options", definition: "Like a straddle but with OTM strikes. Cheaper to enter but requires a larger move to profit.", relatedStrategy: "long-strangle" },
  { term: "Butterfly Spread", category: "options", definition: "A 3-strike structure (1 long low, 2 short mid, 1 long high) that profits if the underlying pins at the middle strike at expiry.", relatedStrategy: "long-call-butterfly" },
  { term: "Iron Condor", category: "options", definition: "A defined-risk income structure combining a bull put spread + bear call spread. Profits if the underlying stays between the short strikes.", relatedStrategy: "long-iron-condor" },
  { term: "Risk Reversal", category: "options", definition: "Long OTM call + short OTM put (or vice versa). A low-cost directional trade that also expresses a view on the vol skew.", relatedStrategy: "risk-reversal" },
  { term: "Collar", category: "options", definition: "Long stock + long put (floor) + short call (cap). A zero-cost hedge when the put premium is financed by the call premium.", relatedStrategy: "collar" },
  { term: "Calendar Spread", category: "options", definition: "Long one expiry, short another at the same strike. Profits from time decay and term-structure moves." },
  { term: "Box Spread", category: "options", definition: "Bull call spread + bear put spread at the same strikes. Fixed payoff regardless of underlying — effectively a synthetic loan/deposit.", relatedStrategy: "long-box" },

  // ---------- FIXED INCOME ----------
  { term: "Duration", category: "fixed-income", definition: "A measure of a bond's price sensitivity to interest rate changes. Approximate % price change for a 1% yield change. Modified duration is the standard measure." },
  { term: "Convexity", category: "fixed-income", definition: "The second derivative of bond price with respect to yield. Measures how duration itself changes as yields move. Positive convexity (in callable bonds, negative) is beneficial." },
  { term: "DV01 (Dollar Duration)", category: "fixed-income", definition: "The dollar P&L change for a 1 basis point (0.01%) change in yield. Used for hedging and risk management across bond portfolios." },
  { term: "Yield Curve", category: "fixed-income", definition: "The plot of yields against maturity for bonds of the same credit quality. Normally upward-sloping (longer = higher yield); inversion signals recession risk." },
  { term: "Flattener / Steepener", category: "fixed-income", definition: "A curve trade betting that the yield spread between two maturities will narrow (flatten) or widen (steepen). Set up DV01-neutral.", relatedStrategy: "yield-curve-spread" },
  { term: "Carry", category: "fixed-income", definition: "The return earned by holding an asset — coupon income + roll-down the yield curve. A core factor across fixed income, FX, and commodities.", relatedStrategy: "carry-factor-fi" },
  { term: "Roll-Down", category: "fixed-income", definition: "The price appreciation from a bond 'rolling down' an upward-sloping yield curve as time passes and its maturity shortens." },
  { term: "OAS (Option-Adjusted Spread)", category: "fixed-income", definition: "The spread over the risk-free curve after removing the value of embedded options (e.g. callable bonds, MBS prepayment option). Measures pure credit risk." },
  { term: "CDS (Credit Default Swap)", category: "fixed-income", definition: "A derivative that pays out if a reference entity defaults. The buyer pays periodic premiums; the seller pays the loss given default.", relatedStrategy: "cds-basis-arb" },
  { term: "CDS-Bond Basis", category: "fixed-income", definition: "The difference between a bond's spread and the matching CDS spread. Positive basis (CDS > bond) is the norm; traded by arbitrageurs.", relatedStrategy: "cds-basis-arb" },
  { term: "REPO (Repurchase Agreement)", category: "fixed-income", definition: "A short-term secured loan: sell a security (collateral) and agree to buy it back at a higher price. The implied rate is the repo rate.", relatedStrategy: "repurchase-agreement" },

  // ---------- STOCKS & FACTORS ----------
  { term: "Momentum", category: "stocks", definition: "The empirical tendency for assets that have performed well recently to continue performing well (and vice versa). Cross-sectional momentum is among the most robust anomalies.", relatedStrategy: "price-momentum" },
  { term: "Value Factor", category: "stocks", definition: "The premium earned by holding cheap (high book-to-market, low P/E) stocks vs expensive stocks. Core Fama-French factor.", relatedStrategy: "value" },
  { term: "Mean Reversion", category: "stocks", definition: "The tendency for prices to revert to a historical average or equilibrium. Basis for pairs trading and statistical arbitrage.", relatedStrategy: "pairs-trading" },
  { term: "Cointegration", category: "stocks", definition: "A statistical relationship where two non-stationary series have a stationary linear combination. The basis for pairs trading — the spread mean-reverts.", relatedStrategy: "pairs-trading" },
  { term: "Statistical Arbitrage", category: "stocks", definition: "A market-neutral strategy exploiting short-term mean-reversion in cross-sectional stock returns. Typically dollar-neutral with many small positions.", relatedStrategy: "stat-arb-opt" },
  { term: "Dollar Neutrality", category: "stocks", definition: "Equal dollar amounts long and short, so net market exposure ≈ 0. A constraint in market-neutral strategies to isolate alpha from beta.", relatedStrategy: "stat-arb-opt" },
  { term: "Beta (β)", category: "stocks", definition: "The sensitivity of an asset's return to the market. β = 1 moves with the market; β > 1 more volatile; β < 1 less volatile; β < 0 inversely correlated." },
  { term: "Alpha (α)", category: "stocks", definition: "The excess return of an investment relative to its benchmark, after adjusting for beta. The 'skill' component of returns." },
  { term: "Betting Against Beta (BAB)", category: "stocks", definition: "The anomaly that low-beta stocks deliver higher risk-adjusted returns than CAPM predicts. Long low-β, short high-β.", relatedStrategy: "low-volatility-anomaly" },
  { term: "Post-Earnings Announcement Drift (PEAD)", category: "stocks", definition: "The tendency for stock prices to continue drifting in the direction of an earnings surprise for weeks after the announcement.", relatedStrategy: "earnings-momentum" },

  // ---------- RISK & PORTFOLIO ----------
  { term: "Sharpe Ratio", category: "risk", definition: "Risk-adjusted return: (mean excess return) / (standard deviation of returns). The flagship metric for strategy evaluation. >1 good, >2 excellent." },
  { term: "Sortino Ratio", category: "risk", definition: "Like Sharpe but penalizes only downside volatility (not upside). More appropriate for asymmetric return distributions." },
  { term: "Maximum Drawdown (MaxDD)", category: "risk", definition: "The largest peak-to-trough decline in the equity curve. Measures worst-case loss. The denominator of the Calmar ratio." },
  { term: "Calmar Ratio", category: "risk", definition: "CAGR / Max Drawdown. Measures return per unit of worst-case risk. >3 is considered excellent." },
  { term: "Value at Risk (VaR)", category: "risk", definition: "The maximum expected loss over a given time horizon at a given confidence level (e.g. 95% 1-day VaR). A standard risk metric in banking." },
  { term: "Conditional VaR (CVaR / Expected Shortfall)", category: "risk", definition: "The expected loss given that the loss exceeds the VaR threshold. Measures the tail beyond VaR." },
  { term: "Volatility Targeting", category: "risk", definition: "Scaling position size inversely to realized volatility to maintain a constant portfolio volatility target. Reduces drawdowns.", relatedStrategy: "index-vol-targeting" },
  { term: "Kelly Criterion", category: "risk", definition: "The optimal bet size for maximizing long-term growth: f* = edge / odds. Scales positions to the 'edge' of a strategy." },

  // ---------- MACRO & FX ----------
  { term: "Carry Trade", category: "macro", definition: "Borrow in a low-yield currency, invest in a high-yield currency, capturing the interest differential. Profitable persistently but subject to crash risk.", relatedStrategy: "carry-trade" },
  { term: "Uncovered Interest Parity (UIP)", category: "macro", definition: "The theory that the interest differential between two currencies should equal the expected change in the exchange rate. Empirically violated — the basis of the carry trade." },
  { term: "Triangular Arbitrage", category: "macro", definition: "Exploiting inconsistencies across three currencies (e.g. USD→EUR→GBP→USD). If the round-trip yields ≠1, an arbitrage exists.", relatedStrategy: "fx-triangular-arb" },
  { term: "Purchasing Power Parity (PPP)", category: "macro", definition: "The theory that exchange rates should adjust to equalize the price of identical goods across countries. Long-run anchor for FX." },
  { term: "Breakeven Inflation", category: "macro", definition: "The difference between nominal Treasury yields and TIPS yields. The market's expectation of future inflation." },
  { term: "Term Premium", category: "macro", definition: "The extra yield investors demand for holding long-duration bonds vs rolling short-term bonds. Can be negative." },

  // ---------- TRADING & EXECUTION ----------
  { term: "Backwardation", category: "trading", definition: "A futures curve where the front (near) contract trades at a higher price than the back (far) contract. Long positions earn a positive roll yield.", relatedStrategy: "roll-yields" },
  { term: "Contango", category: "trading", definition: "A futures curve where the front contract trades lower than the back. Long positions suffer negative roll yield (the 'cost of carry').", relatedStrategy: "roll-yields" },
  { term: "Roll Yield", category: "trading", definition: "The P&L from rolling a long futures position: as the front contract converges to spot, backwardation yields a gain, contango a loss.", relatedStrategy: "roll-yields" },
  { term: "Basis", category: "trading", definition: "The difference between the spot price and the futures price (or between two related instruments). Basis risk = the risk that this spread moves adversely." },
  { term: "Cash-and-Carry Arbitrage", category: "trading", definition: "Buy the underlying spot, short the futures, and carry to delivery. Locks in the mispricing when futures trade rich.", relatedStrategy: "cash-and-carry-index" },
  { term: "Market Making", category: "trading", definition: "The practice of quoting both bids and offers to capture the spread, while managing inventory risk. Profits from flow, not direction.", relatedStrategy: "market-making" },
  { term: "Slippage", category: "trading", definition: "The difference between the expected execution price and the actual fill price. A key cost in backtesting that is often underestimated." },
  { term: "Implied Correlation", category: "trading", definition: "The correlation level implied by index option vs single-stock option prices. Dispersion trading is a bet on this correlation.", relatedStrategy: "dispersion-trading" },
  { term: "Leveraged ETF (LETF)", category: "trading", definition: "An ETF that aims to deliver a multiple (e.g. 3×) of the daily return of an index. Daily rebalancing creates volatility drag in choppy markets.", relatedStrategy: "leveraged-etf" },

  // ---------- BLACK-SCHOLES ----------
  { term: "Black-Scholes Model", category: "options", definition: "The landmark option pricing model (1973). Assumes lognormal stock prices, constant vol, and no arbitrage. Gives the theoretical European option price via a closed-form formula." },
  { term: "Geometric Brownian Motion (GBM)", category: "options", definition: "The stochastic process underlying Black-Scholes: dS = μS·dt + σS·dW. Models asset prices with constant drift and volatility. Used in this terminal's price generation." },
  { term: "Risk-Neutral Valuation", category: "options", definition: "The principle that option prices can be computed by discounting expected payoffs under a risk-neutral measure (where the drift = risk-free rate)." },
  { term: "No-Arbitrage", category: "options", definition: "The foundational assumption that two portfolios with identical payoffs must have the same price. The basis for all derivative pricing." },
  { term: "Put-Call Parity", category: "options", definition: "The identity: C − P = S − K·e^(-rT). Relates call, put, stock, and bond prices. Violations create arbitrage (box spread)." },

  // ---------- ADDITIONAL TERMS ----------
  { term: "American Option", category: "options", definition: "An option that can be exercised at any time up to and including the expiration date. More valuable than the European equivalent due to early-exercise flexibility." },
  { term: "European Option", category: "options", definition: "An option that can only be exercised at expiration. Simpler to price (closed-form Black-Scholes); less flexible than American." },
  { term: "Assignment", category: "options", definition: "The process by which a short option holder is notified that the buyer has exercised. A short call assignee must deliver the underlying; a short put assignee must buy it." },
  { term: "Exercise", category: "options", definition: "The act of the option buyer invoking their right to buy (call) or sell (put) the underlying at the strike price. Most equity options auto-exercise if ITM at expiration." },
  { term: "Open Interest", category: "options", definition: "The total number of outstanding option contracts that have not been closed or exercised. A measure of liquidity and positioning." },
  { term: "Volatility of Volatility (VVIX)", category: "volatility", definition: "The volatility of the VIX index itself — a 'vol of vol' measure. High VVIX = the market's expectation of vol itself is unstable." },
  { term: "VIX Term Structure", category: "volatility", definition: "The curve of VIX futures prices across expirations. Typically in contango (later > earlier); flips to backwardation in stress. Traded via VIX futures calendar spreads.", relatedStrategy: "vix-futures-basis" },
  { term: "Volatility Carry", category: "volatility", definition: "The return from being short volatility when implied exceeds realized. Harvested via short options or short variance swaps; subject to crash risk.", relatedStrategy: "volatility-carry-etn" },
  { term: "Convexity", category: "fixed-income", definition: "The curvature in the price-yield relationship. Bonds with positive convexity gain more when yields fall than they lose when yields rise — an asymmetric, favorable property." },
  { term: "Key Rate Duration", category: "fixed-income", definition: "Sensitivity of a bond's price to a 1bp change at a specific point on the yield curve (holding other points constant). A more granular measure than effective duration." },
  { term: "Roll-Down", category: "fixed-income", definition: "The price appreciation as a bond 'rolls down' an upward-sloping yield curve toward its maturity. A component of fixed-income carry.", relatedStrategy: "roll-down-yield-curve" },
  { term: "Repo Rate", category: "fixed-income", definition: "The interest rate on a repurchase agreement — the implied cost of borrowing cash against collateral. A key short-term funding rate." },
  { term: "Factor Model", category: "stocks", definition: "A model that decomposes asset returns into exposures to common factors (market, size, value, momentum) plus idiosyncratic noise. The basis of factor investing." },
  { term: "Information Ratio", category: "risk", definition: "Active return divided by tracking error. Measures the consistency of outperformance vs a benchmark. The 'skill' ratio for active managers." },
  { term: "Tracking Error", category: "risk", definition: "The standard deviation of the difference between a portfolio's return and its benchmark's return. Measures how closely the portfolio follows the benchmark." },
  { term: "Beta-Adjusted Return", category: "risk", definition: "Return adjusted for the portfolio's beta exposure. Isolates alpha from market-directional P&L." },
  { term: "Purchasing Power Parity (PPP)", category: "macro", definition: "The theory that exchange rates should adjust to equalize the price of identical goods across countries. Long-run anchor for FX; violated in the short run." },
  { term: "Covered Interest Parity (CIP)", category: "macro", definition: "The no-arbitrage condition linking spot FX, forward FX, and interest rates: the forward premium equals the interest differential. Deviations (the 'cross-currency basis') signal funding stress." },
  { term: "Risk Reversal (FX)", category: "macro", definition: "In FX markets, the difference between the implied vol of an OTM call and an OTM put of the same delta. A standard market quote reflecting skew." },
  { term: "Open Interest", category: "trading", definition: "The total number of outstanding futures or options contracts not yet closed or delivered. A measure of market commitment and liquidity." },
  { term: "Contango / Backwardation", category: "trading", definition: "Contango: futures curve where later contracts are pricier (cost of carry). Backwardation: later contracts are cheaper (scarcity). Drives roll yield for long/short futures.", relatedStrategy: "roll-yields" },
  { term: "Convenience Yield", category: "trading", definition: "The non-monetary benefit of holding a physical commodity (e.g. ability to use in production). Explains backwardation in commodity curves." },
  { term: "Hedging Pressure", category: "trading", definition: "The net positioning of commercial hedgers in commodity futures (from CFTC COT data). Used as a contrarian signal — commercials tend to be informed." },
  { term: "Basis Risk", category: "trading", definition: "The risk that the price of a hedge does not move in lockstep with the underlying exposure. The residual risk after an imperfect hedge." },

  // ---------- ADDITIONAL TERMS (round 5) ----------
  { term: "American-style Exercise", category: "options", definition: "An option that can be exercised any time before expiry. American options are worth at least as much as European (early-exercise premium)." },
  { term: "At-the-Money (ATM)", category: "options", definition: "An option whose strike equals the current spot price. ATM options have the highest gamma and the most time value." },
  { term: "Bear Spread", category: "options", definition: "An option spread that profits from a decline in the underlying. Constructed with calls (bear call) or puts (bear put)." },
  { term: "Bull Spread", category: "options", definition: "An option spread that profits from a rise in the underlying. Constructed with calls (bull call) or puts (bull put)." },
  { term: "Calendar Spread", category: "options", definition: "A spread between two options of the same strike but different expirations. Profits from time decay and term-structure moves." },
  { term: "Condor", category: "options", definition: "A 4-strike structure (two inner shorts + two outer longs) that profits when the underlying stays within a range. Wider profit zone than a butterfly." },
  { term: "Credit Spread", category: "options", definition: "A spread that collects a net premium up front (e.g. short put spread). Maximum profit is the credit; risk is defined by the spread width." },
  { term: "Debit Spread", category: "options", definition: "A spread that costs a net premium up front (e.g. long call spread). Maximum profit is the spread width minus the debit; risk is the debit paid." },
  { term: "Delta Hedging", category: "options", definition: "Trading the underlying to offset the directional (delta) exposure of an option position, leaving mostly vega/gamma/theta exposure." },
  { term: "Diagonal Spread", category: "options", definition: "A spread combining different strikes AND different expirations. A hybrid of vertical and calendar spreads." },
  { term: "European-style Exercise", category: "options", definition: "An option exercisable only at expiry. Simpler to price (closed-form Black-Scholes); less flexible than American." },
  { term: "In-the-Money (ITM)", category: "options", definition: "An option with positive intrinsic value: a call when spot > strike, a put when spot < strike." },
  { term: "Iron Butterfly", category: "options", definition: "A defined-risk structure: short ATM straddle + long OTM wings. Profits if pinned at the strike; defined-risk version of a short straddle." },
  { term: "Leg", category: "options", definition: "A single component of a multi-leg option strategy. E.g. a long straddle has 2 legs; an iron condor has 4." },
  { term: "Naked Option", category: "options", definition: "A short option position without the underlying (for a call) or cash (for a put). Carries undefined risk." },
  { term: "Out-of-the-Money (OTM)", category: "options", definition: "An option with zero intrinsic value: a call when spot < strike, a put when spot > strike." },
  { term: "Ratio Spread", category: "options", definition: "A spread with an unequal number of long and short options (e.g. 1:2). One side has undefined risk if the wrong leg is short." },
  { term: "Risk Reversal", category: "options", definition: "Long OTM call + short OTM put (or vice versa). A low-cost directional trade; also a standard FX vol-skew quote." },
  { term: "Spread", category: "options", definition: "A combined option position of two or more legs. Spreads cap risk and reward vs naked options." },
  { term: "Strangle", category: "options", definition: "Long OTM call + long OTM put (same expiry). Cheaper than a straddle but needs a larger move to profit." },
  { term: "Synthetic", category: "options", definition: "A position constructed from options that replicates another instrument. E.g. long call + short put = synthetic long stock." },
  { term: "Vertical Spread", category: "options", definition: "A spread between two strikes of the same expiry. Bull/bear call/put spreads are all vertical spreads." },
  { term: "Wings", category: "options", definition: "The outer strikes in a butterfly or condor. The 'body' is the middle strike(s)." },

  { term: "CBOE", category: "volatility", definition: "Chicago Board Options Exchange — the largest US options exchange and home of the VIX index." },
  { term: "Contango (Vol)", category: "volatility", definition: "When VIX futures trade higher than the spot VIX (upward-sloping term structure). The norm in calm markets; bleeds long-VIX holders." },
  { term: "Backwardation (Vol)", category: "volatility", definition: "When VIX futures trade below the spot VIX (downward-sloping term structure). Signals stress; long VIX futures profit." },
  { term: "Vol-of-Vol", category: "volatility", definition: "The volatility of an asset's own volatility. High vol-of-vol = vol itself is unstable; relevant for VIX-option pricing (VVIX)." },
  { term: "Skewness", category: "volatility", definition: "The asymmetry of a return distribution. Negative skew (fat left tail) is typical of equities; positive skew of long options." },
  { term: "Kurtosis", category: "volatility", definition: "The 'fatness' of distribution tails. High kurtosis = more extreme outcomes than a normal distribution predicts." },

  { term: "Accrued Interest", category: "fixed-income", definition: "Interest earned on a bond since the last coupon date but not yet paid. Added to the clean price to get the dirty (full) price." },
  { term: "Barbell", category: "fixed-income", definition: "A bond portfolio split between short and long maturities, skipping the belly. Captures long yield + short liquidity." },
  { term: "Bullet", category: "fixed-income", definition: "A bond portfolio concentrated at a single target maturity. Maximizes exposure to one point on the yield curve." },
  { term: "Clean Price", category: "fixed-income", definition: "A bond's quoted price excluding accrued interest. The 'clean' price is what's typically quoted in markets." },
  { term: "Dirty Price", category: "fixed-income", definition: "A bond's full price including accrued interest. Clean price + accrued interest = dirty price." },
  { term: "Duration Matching", category: "fixed-income", definition: "Setting a portfolio's duration equal to the liability horizon to immunize against parallel yield shifts.", relatedStrategy: "bond-immunization" },
  { term: "Ladder", category: "fixed-income", definition: "A bond portfolio with evenly-spaced maturities. As rungs mature, reinvest at the long end — smooths reinvestment risk." },
  { term: "Maturity", category: "fixed-income", definition: "The date when a bond's principal is repaid. Longer maturity generally means higher duration and yield." },
  { term: "Par", category: "fixed-income", definition: "A bond trading at par = 100% of face value. Happens when coupon = yield." },
  { term: "Yield to Maturity (YTM)", category: "fixed-income", definition: "The IRR of a bond held to maturity — the annualized total return assuming coupons are reinvested at the YTM." },
  { term: "Zero-Coupon Bond", category: "fixed-income", definition: "A bond that pays no coupons, trading at a discount to face value. Return = face value − purchase price." },

  { term: "Cross-sectional", category: "stocks", definition: "Analysis comparing many assets at the same point in time (e.g. ranking stocks by momentum). Basis of stat-arb and factor investing." },
  { term: "Time-series", category: "stocks", definition: "Analysis of a single asset over time (e.g. trend-following). Contrasts with cross-sectional strategies." },
  { term: "Earnings Surprise (SUE)", category: "stocks", definition: "Standardized Unexpected Earnings = (actual EPS − forecast) / σ(forecast error). High SUE stocks drift (PEAD).", relatedStrategy: "earnings-momentum" },
  { term: "Fama-French Model", category: "stocks", definition: "A 3-factor asset-pricing model (market, size, value) extending CAPM. Later extended to 5 factors (adding profitability, investment)." },
  { term: "Idiosyncratic", category: "stocks", definition: "Asset-specific risk uncorrelated with common factors. Diversifiable in large portfolios." },
  { term: "Size Factor (SMB)", category: "stocks", definition: "Small Minus Big — the historical premium of small-cap stocks over large-caps. A Fama-French factor." },
  { term: "Value Factor (HML)", category: "stocks", definition: "High Minus Low — the premium of high book-to-market (value) stocks over low. A Fama-French factor." },
  { term: "Quality Factor", category: "stocks", definition: "The premium of high-quality (profitable, stable) stocks. A newer addition to the Fama-French 5-factor model." },
  { term: "Investment Factor", category: "stocks", definition: "The negative premium of high-investment firms (they underperform). A Fama-French 5-factor." },

  { term: "Correlation", category: "risk", definition: "A measure of how two assets move together, ∈ [-1, 1]. Low/negative correlation = diversification benefit." },
  { term: "Covariance", category: "risk", definition: "How two assets co-move (un-normalized). Correlation = covariance / (σ₁·σ₂)." },
  { term: "Drawdown Duration", category: "risk", definition: "How long an equity curve stays below its peak before recovering. A complement to max drawdown depth." },
  { term: "Efficient Frontier", category: "risk", definition: "The set of portfolios with the highest expected return for each risk level. Modern Portfolio Theory's optimal set." },
  { term: "Leverage", category: "risk", definition: "Using borrowed capital to amplify exposure. Increases both gains and losses; a key risk multiplier." },
  { term: "Liquidity Risk", category: "risk", definition: "The risk of being unable to exit a position without a large price concession. Often spikes in crises." },
  { term: "Modern Portfolio Theory (MPT)", category: "risk", definition: "Markowitz's framework for constructing portfolios that maximize return for a given variance. The foundation of mean-variance optimization." },
  { term: "Recovery Factor", category: "risk", definition: "Total return / max drawdown. Similar to Calmar; measures return per unit of worst-case loss." },
  { term: "Risk Parity", category: "risk", definition: "Allocating so each asset contributes equal risk to the portfolio (vs equal capital). Often leverages low-vol assets." },
  { term: "Tail Risk", category: "risk", definition: "The risk of extreme, low-probability losses. Hedged via OTM puts, tail-risk funds, or short variance." },

  { term: "Base Currency", category: "macro", definition: "The currency in which a portfolio's P&L is denominated. Often USD for global investors." },
  { term: "Cross Rate", category: "macro", definition: "An FX rate between two currencies, both quoted against a third (usually USD). E.g. EUR/GBP derived from EUR/USD and GBP/USD." },
  { term: "Currency Peg", category: "macro", definition: "A fixed exchange rate between a currency and a reference (usually USD or EUR). Maintained by central-bank intervention." },
  { term: "Forward Points", category: "macro", definition: "The interest-rate differential between two currencies, expressed as the forward-spot differential. Positive = the higher-yield currency trades at a forward discount." },
  { term: "Inflation Swap", category: "macro", definition: "A derivative exchanging a fixed rate for realized inflation. A direct, clean inflation hedge used by pension funds." },
  { term: "TIPS", category: "macro", definition: "Treasury Inflation-Protected Securities — US govt bonds whose principal adjusts with CPI. A liquid inflation hedge." },

  { term: "Ask (Offer)", category: "trading", definition: "The price at which a market-maker is willing to sell. The spread = ask − bid." },
  { term: "Bid", category: "trading", definition: "The price a market-maker is willing to pay. The spread = ask − bid; market-makers profit from the spread." },
  { term: "Dark Pool", category: "trading", definition: "A private trading venue that does not display orders publicly. Used to minimize market impact for large orders." },
  { term: "Fill", category: "trading", definition: "The execution of an order. A 'partial fill' means only part of the order was executed." },
  { term: "Front-running", category: "trading", definition: "Trading ahead of a known incoming order to profit from the price impact. Illegal for brokers; a form of toxic flow." },
  { term: "Market Impact", category: "trading", definition: "The adverse price move caused by one's own order. Larger orders in less liquid markets cause more impact." },
  { term: "Order Book", category: "trading", definition: "The list of outstanding bids and offers. The 'depth' of the book = how much size is available at each level." },
  { term: "Position Sizing", category: "trading", definition: "The art of determining how much capital to allocate to a trade. Kelly criterion and volatility targeting are common methods." },
  { term: "Rebalance", category: "trading", definition: "Adjusting a portfolio back to its target weights after drift. Frequency affects transaction costs and tax efficiency." },
  { term: "Toxic Flow", category: "trading", definition: "Order flow that systematically loses money for the market-maker (e.g. informed/latency-arb flow). The cost of providing liquidity." },
  { term: "VWAP", category: "trading", definition: "Volume-Weighted Average Price — a benchmark for execution quality. Algorithms aim to 'beat VWAP' over the day." },
  { term: "Whipsaw", category: "trading", definition: "A rapid reversal that triggers a trend-following signal then immediately stops it out. The main cost of trend-following in chop." },

  // ---------- ADDITIONAL TERMS (round 6) ----------
  { term: "Alpha-Neutral", category: "risk", definition: "A portfolio construction where idiosyncratic alpha offsets to zero, leaving only systematic (beta) exposure. A constraint in factor-tilt portfolios." },
  { term: "Beta-Neutral", category: "risk", definition: "A portfolio whose net beta is zero — long and short positions offset market exposure. Isolates alpha from market direction." },
  { term: "Co-skewness", category: "risk", definition: "The co-movement of an asset's returns with the market's squared returns. Measures contribution to portfolio skewness, beyond covariance." },
  { term: "Downside Deviation", category: "risk", definition: "The standard deviation of returns below the mean (or a threshold). The denominator of the Sortino ratio." },
  { term: "Information Coefficient (IC)", category: "risk", definition: "The correlation between predicted and realized returns. A measure of forecasting skill; IC > 0.05 is decent, > 0.1 strong." },
  { term: "Marginal VaR", category: "risk", definition: "The change in portfolio VaR from adding $1 of a specific asset. Used for risk-budgeting decisions." },
  { term: "Maximum Drawdown Duration", category: "risk", definition: "The longest time (in days/months) the equity curve stays below its prior peak. Measures recovery speed." },
  { term: "Omega Ratio", category: "risk", definition: "A risk-return ratio = (prob-weighted gains) / (prob-weighted losses) above a threshold. Captures the full distribution, not just mean/variance." },
  { term: "Sterling Ratio", category: "risk", definition: "Return / (max drawdown − 10% [arbitrary excess]). A Sharpe alternative penalizing drawdowns instead of volatility." },
  { term: "Treynor Ratio", category: "risk", definition: "Excess return / beta. Risk-adjusted return per unit of systematic (market) risk, vs Sharpe's total risk." },
  { term: "Upside Capture", category: "risk", definition: "The % of the benchmark's up-moves captured by a strategy. 100% = matches the benchmark's up-days; >100% outperforms." },
  { term: "Downside Capture", category: "risk", definition: "The % of the benchmark's down-moves captured. <100% = the strategy loses less than the benchmark in declines." },

  { term: "At-the-Money Forward (ATMF)", category: "options", definition: "An option whose strike equals the forward price. The standard reference for FX options (delta is quoted vs the forward)." },
  { term: "Black-76 Model", category: "options", definition: "A variant of Black-Scholes for pricing options on futures (where the underlying is the forward/futures price, not spot)." },
  { term: "Cash Settlement", category: "options", definition: "An option that settles in cash (the difference) rather than physical delivery. Standard for index options and VIX options." },
  { term: "Physical Settlement", category: "options", definition: "An option that settles by delivering (call) or receiving (put) the underlying. Standard for most single-stock equity options." },
  { term: "Exchange Option (Margrabe)", category: "options", definition: "An option to exchange one asset for another. Priced by the Margrabe formula — a Black-Scholes generalization." },
  { term: "Forward Start Option", category: "options", definition: "An option whose strike is set at a future date (typically as a % of then-spot). Used in executive compensation and cliquets." },
  { term: "Quanto Option", category: "options", definition: "An option whose payoff is in a different currency than the underlying, at a fixed FX rate. Removes FX risk from a foreign asset option." },
  { term: "Rainbow Option", category: "options", definition: "An option on the best (or worst, or average) of multiple underlyings. E.g. 'best-of' options on two indices." },
  { term: "Spread Option", category: "options", definition: "An option whose payoff depends on the spread between two underlyings (e.g. crack spread, spark spread)." },
  { term: "Volatility Swap (Vol Swap)", category: "options", definition: "A derivative paying the difference between realized vol and a strike. Linear in vol (vs variance swaps which are convex)." },

  { term: "Accrued Coupon", category: "fixed-income", definition: "The interest earned on a bond since its last coupon payment. The buyer pays the seller the accrued interest on top of the clean price." },
  { term: "Callable Bond", category: "fixed-income", definition: "A bond the issuer can redeem early at a set price. Gives the issuer negative convexity; trades at a higher yield vs non-callable." },
  { term: "Putable Bond", category: "fixed-income", definition: "A bond the holder can sell back to the issuer at a set price. Gives the holder positive convexity; trades at a lower yield." },
  { term: "Convertibility", category: "fixed-income", definition: "A bond feature allowing conversion into equity at a set ratio. The embedded call option makes convertibles part-bond, part-equity." },
  { term: "Covenant", category: "fixed-income", definition: "A contractual term in a bond indenture restricting issuer behavior (e.g. limits on leverage). Protects bondholders; weaker covenants = higher yield." },
  { term: "Default Recovery", category: "fixed-income", definition: "The % of face value recovered by bondholders if the issuer defaults. Senior secured ≈ 60-70%; subordinated ≈ 20-30%." },
  { term: "High-Yield (Junk) Bond", category: "fixed-income", definition: "A bond rated below investment grade (BB/Ba or lower). Higher yield to compensate for higher default risk." },
  { term: "Investment-Grade Bond", category: "fixed-income", definition: "A bond rated BBB-/Baa3 or higher. Lower default risk, lower yield than high-yield." },
  { term: "Make-Whole Call", category: "fixed-income", definition: "A callable bond provision requiring the issuer to pay the holder the NPV of remaining coupons + principal at a small spread. Effectively prevents early call except in distress." },
  { term: "Sinking Fund", category: "fixed-income", definition: "A bond provision requiring the issuer to retire a portion of the issue each year. Reduces default risk but adds reinvestment risk." },
  { term: "Subordination", category: "fixed-income", definition: "The priority order of claims in default: senior > mezzanine > subordinated. Lower priority = higher recovery risk = higher yield." },

  { term: "Active Share", category: "stocks", definition: "The % of a portfolio's holdings that differ from its benchmark. >100% = fully active; 0% = a closet index fund." },
  { term: "Earnings Yield", category: "stocks", definition: "Earnings per share / share price. The inverse of the P/E ratio; can be compared to bond yields (the 'Fed Model')." },
  { term: "Free Cash Flow Yield", category: "stocks", definition: "Free cash flow / market cap. A cash-based valuation metric less prone to accounting manipulation than earnings yield." },
  { term: "Growth Factor", category: "stocks", definition: "The premium of high-growth stocks. Rallied hard in the 2010s; negatively correlated with the value factor over that period." },
  { term: "Low-Volatility Factor", category: "stocks", definition: "The anomaly that low-vol/low-beta stocks deliver higher risk-adjusted returns. Traded via inverse-variance weighting.", relatedStrategy: "low-volatility-anomaly" },
  { term: "P/B (Price-to-Book)", category: "stocks", definition: "Market cap / book value. A core value metric — low P/B = cheap relative to accounting net worth." },
  { term: "P/E (Price-to-Earnings)", category: "stocks", definition: "Price / earnings per share. The most common valuation ratio; high P/E = expensive or high-growth expectations." },
  { term: "Residual Return", category: "stocks", definition: "Return after subtracting the factor-attributable portion. The 'pure alpha' unexplained by the factor model." },
  { term: "Sector Rotation", category: "stocks", definition: "Tactical shifting across sectors based on the business cycle. E.g. overweight tech in expansion, staples in contraction.", relatedStrategy: "sector-momentum-rotation" },
  { term: "Style Drift", category: "stocks", definition: "When an active manager's portfolio characteristics change over time (e.g. a value fund buying growth stocks). A monitoring concern." },

  { term: "COT Report", category: "macro", definition: "Commitments of Traders — a weekly CFTC report showing net positioning of commercial hedgers, large speculators, and small traders. Used as a positioning signal." },
  { term: "Current Account", category: "macro", definition: "A country's trade balance + net income from abroad. Persistent deficits can pressure the currency." },
  { term: "Hawkish / Dovish", category: "macro", definition: "Hawkish = central bank leaning toward tighter policy (fighting inflation). Dovish = leaning toward looser policy (supporting growth)." },
  { term: "Inverted Yield Curve", category: "macro", definition: "When short-term yields exceed long-term yields. A classic recession predictor; the 2s-10s inversion is most watched." },
  { term: "Purchasing Managers' Index (PMI)", category: "macro", definition: "A monthly survey of manufacturing/services activity. >50 = expansion; <50 = contraction. A key leading indicator." },
  { term: "Quantitative Easing (QE)", category: "macro", definition: "Central-bank purchases of long-dated bonds to lower long yields and stimulate the economy. Used when policy rates are already at zero." },
  { term: "Real Yield", category: "macro", definition: "Nominal yield − expected inflation. The real return a bondholder earns; negative real yields are a drag on real wealth." },
  { term: "Terms of Trade", category: "macro", definition: "A country's export prices / import prices. Improving terms of trade = currency tailwind." },
  { term: "Yield Curve Control (YCC)", category: "macro", definition: "A central-bank policy of pegging a specific yield (e.g. the BOJ's 10yr cap) via unlimited bond purchases." },

  // ---------- ADDITIONAL TERMS (round 7) ----------
  { term: "AR(1) Process", category: "risk", definition: "A first-order autoregressive process: x_t = φ·x_{t-1} + ε. The basis for modeling momentum (|φ|>0) vs mean-reversion (φ<0). pACF cuts off after lag 1." },
  { term: "Box-Jenkins Method", category: "risk", definition: "A systematic approach to ARIMA time-series modeling: identification, estimation, diagnostics. Uses ACF/pACF to identify model order." },
  { term: "Heteroskedasticity", category: "risk", definition: "Non-constant variance over time. Volatility clustering is a form of heteroskedasticity; modeled by ARCH/GARCH." },
  { term: "Ljung-Box Test", category: "risk", definition: "A statistical test for whether any of a group of autocorrelations of a time series are different from zero. Used to check if returns have predictable structure." },
  { term: "Stationarity", category: "risk", definition: "A time series with constant mean and variance over time. Returns are approximately stationary; prices are not (they have a unit root)." },
  { term: "Unit Root", category: "risk", definition: "A stochastic trend in a time series (e.g. a random walk). Price series typically have a unit root; returns are stationary." },
  { term: "White Noise", category: "risk", definition: "A time series of independent, identically distributed zero-mean random variables. Returns that are white noise cannot be predicted." },

  { term: "Asian Option", category: "options", definition: "An option whose payoff depends on the AVERAGE price over a period, not the spot at expiry. Lower vol than vanilla; cheaper. Used in commodities." },
  { term: "Barrier Option", category: "options", definition: "An option that activates (knock-in) or deactivates (knock-out) when the underlying crosses a barrier level. Cheaper than vanilla due to the barrier risk." },
  { term: "Binary (Digital) Option", category: "options", definition: "An option that pays a fixed amount if ITM at expiry, zero otherwise. Effectively a bet on a specific outcome; all-or-nothing payoff." },
  { term: "Cliquet Option", category: "options", definition: "A series of forward-start options that lock in gains periodically. Caps the period return; used in structured products to smooth payoffs." },
  { term: "Compound Option", category: "options", definition: "An option on an option. E.g. a call on a call — pays to exercise into the underlying option. Two exercise dates." },
  { term: "Lookback Option", category: "options", definition: "An option whose payoff depends on the max (call) or min (put) price over a period. Eliminates timing risk; expensive." },
  { term: "Power Option", category: "options", definition: "An option whose payoff is a power of the underlying. Amplifies convexity and leverage; exotic structure." },
  { term: "Shout Option", category: "options", definition: "An option where the holder can 'shout' once to lock in the intrinsic value at that point, retaining the right to a better payoff later." },

  { term: "Basis Point (bp)", category: "fixed-income", definition: "One-hundredth of a percent (0.01%). Bond yield changes are typically quoted in basis points; e.g. a 25bp move = 0.25%." },
  { term: "Convexity Bias", category: "fixed-income", definition: "The extra return (or cost) from holding positively-convex bonds due to the curvature of the price-yield relationship. Approx = ½ × convexity × Δy²." },
  { term: "Day Count Convention", category: "fixed-income", definition: "The rule for computing accrued interest (e.g. Actual/360, 30/360). Affects the dirty price and yield calculations." },
  { term: "Flat Yield Curve", category: "fixed-income", definition: "When yields are similar across maturities. Signals uncertainty about the growth/inflation outlook; less term premium." },
  { term: "Implied Vol (FI)", category: "fixed-income", definition: "The volatility implied by swaption prices. A measure of expected rate moves; traded via swaption straddles." },
  { term: "Roll-Down (FI)", category: "fixed-income", definition: "The price appreciation from a bond rolling toward maturity on an upward-sloping curve. A carry component for buy-and-hold investors." },
  { term: "Steepener Trade", category: "fixed-income", definition: "A DV01-neutral position betting that the yield-curve spread (e.g. 2s-10s) will widen. Profits when long yields rise faster than short.", relatedStrategy: "yield-curve-spread" },

  { term: "Beta Decomposition", category: "stocks", definition: "Splitting a portfolio's return into market (beta), factor, and idiosyncratic components. Reveals the sources of P&L." },
  { term: "Crowding", category: "stocks", definition: "When many investors hold similar positions in a factor/strategy. Increases crash risk when they unwind together; e.g. the quant crisis of 2007." },
  { term: "Factor Crowding", category: "stocks", definition: "Crowding specifically in a factor like value or momentum. Measured via aggregate positioning, valuations, and correlation among factor portfolios." },
  { term: "Market-Cap Weighting", category: "stocks", definition: "Weighting stocks by their market capitalization. The standard index methodology (S&P 500, MSCI). Pro: low turnover. Con: concentrated in biggest stocks." },
  { term: "Smart Beta", category: "stocks", definition: "Rule-based, factor-tilted indices (e.g. low-vol, momentum, value) that sit between passive market-cap and active. Cheaper than active." },
  { term: "Stock-Specific Risk", category: "stocks", definition: "Idiosyncratic risk from a single stock (earnings miss, scandal). Diversifiable in large portfolios but material in concentrated ones." },

  { term: "Beta-Adjusted Futures Hedge", category: "macro", definition: "Scaling a futures hedge by the beta of the underlying to the futures contract. E.g. hedge a high-beta stock with more futures than 1:1." },
  { term: "Bond Convexity Hedging", category: "macro", definition: "Hedging the convexity exposure of a mortgage or callable-bond portfolio using Treasury futures or swaptions. Reduces P&L from curve shifts." },
  { term: "Convenience Yield (Commodity)", category: "macro", definition: "The benefit of holding the physical commodity (e.g. ability to satisfy a production shortfall). Higher convenience = more backwardation." },
  { term: "Cross-Currency Basis", category: "macro", definition: "The deviation from covered interest parity. Negative USD/JPY basis = USD funding scarcity; trades as a measure of bank funding stress." },
  { term: "Dollar Index (DXY)", category: "macro", definition: "A trade-weighted index of USD vs EUR, JPY, GBP, CAD, SEK, CHF. The standard measure of broad USD strength/weakness." },
  { term: "Oil Term Structure", category: "macro", definition: "The curve of oil futures prices. Backwardation (front > back) signals tight supply; contango signals oversupply. Drives roll yield." },

  { term: "Execution Algorithm", category: "trading", definition: "A trading algorithm that breaks a large order into smaller pieces to minimize market impact. Examples: VWAP, TWAP, POV, implementation shortfall." },
  { term: "Hot Hand Fallacy", category: "trading", definition: "The mistaken belief that past success predicts future success (in random processes). The basis for momentum may be partly behavioral." },
  { term: "Implementation Shortfall", category: "trading", definition: "The total cost of executing a trade = (decision price − execution price) + opportunity cost. A comprehensive execution-cost metric." },
  { term: "Latency Arbitrage", category: "trading", definition: "Exploiting tiny price discrepancies across venues faster than others can react. A form of toxic flow; requires low-latency infrastructure." },
  { term: "POV (Percentage of Volume)", category: "trading", definition: "An execution algorithm that maintains a target % of market volume. Scales up in liquid markets, down in thin ones." },
  { term: "Slippage Model", category: "trading", definition: "A model estimating the price impact of a trade as a function of order size, ADV, and volatility. Critical for realistic backtests." },
  { term: "TWAP", category: "trading", definition: "Time-Weighted Average Price — an execution algorithm that slices an order evenly over a time window. Simpler than VWAP; doesn't need volume data." },
];

export function searchGlossary(query: string): GlossaryTerm[] {
  if (!query.trim()) return GLOSSARY;
  const q = query.toLowerCase();
  return GLOSSARY.filter(
    (t) =>
      t.term.toLowerCase().includes(q) ||
      t.definition.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
  );
}

export function getGlossaryByCategory(cat: GlossaryCategory): GlossaryTerm[] {
  return GLOSSARY.filter((t) => t.category === cat);
}
