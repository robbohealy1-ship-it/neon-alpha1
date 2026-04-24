import { ExternalLink } from 'lucide-react'

interface ExchangeLinksProps {
  symbol: string
}

const EXCHANGE_URLS: { [key: string]: string } = {
  'BINANCE': 'https://www.binance.com/en/trade/',
  'COINBASE': 'https://exchange.coinbase.com/trade/',
  'BYBIT': 'https://www.bybit.com/trade/usdt/',
  'OKX': 'https://www.okx.com/trade-spot/',
  'KUCOIN': 'https://www.kucoin.com/trade/',
}

const DEX_URLS: { [key: string]: string } = {
  'UNISWAP': 'https://app.uniswap.org/#/swap?outputCurrency=',
  'SUSHISWAP': 'https://www.sushi.com/swap?token1=',
  'RAYDIUM': 'https://raydium.io/swap/?outputCurrency=',
  'JUPITER': 'https://jup.ag/swap/',
  'ORCA': 'https://orca.so/?tokenIn=SOL&tokenOut=',
}

// Token contract addresses for DEX linking
const TOKEN_ADDRESSES: { [key: string]: { address: string; chain: string } } = {
  'BTC': { address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', chain: 'ethereum' },
  'ETH': { address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', chain: 'ethereum' },
  'SOL': { address: 'So11111111111111111111111111111111111111112', chain: 'solana' },
  'AVAX': { address: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7', chain: 'avalanche' },
  'MATIC': { address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', chain: 'ethereum' },
  'LINK': { address: '0x514910771af9ca656af840dff83e8264ecf986ca', chain: 'ethereum' },
  'UNI': { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', chain: 'ethereum' },
  'AAVE': { address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', chain: 'ethereum' },
  'DOGE': { address: '0xba2ae424d960c26247dd6c32edc70b29501a22eb', chain: 'ethereum' },
  'SHIB': { address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', chain: 'ethereum' },
}

export default function ExchangeLinks({ symbol }: ExchangeLinksProps) {
  const tokenInfo = TOKEN_ADDRESSES[symbol]

  return (
    <div className="space-y-4">
      {/* CEX Links */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Centralized Exchanges
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`${EXCHANGE_URLS.BINANCE}${symbol}_USDT`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-lg transition-colors"
          >
            <span className="text-yellow-400 font-semibold text-sm">Binance</span>
            <ExternalLink size={14} className="text-yellow-400" />
          </a>
          <a
            href={`${EXCHANGE_URLS.BYBIT}${symbol}USDT`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg transition-colors"
          >
            <span className="text-orange-400 font-semibold text-sm">Bybit</span>
            <ExternalLink size={14} className="text-orange-400" />
          </a>
          <a
            href={`${EXCHANGE_URLS.OKX}${symbol}-USDT`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
          >
            <span className="text-blue-400 font-semibold text-sm">OKX</span>
            <ExternalLink size={14} className="text-blue-400" />
          </a>
          <a
            href={`${EXCHANGE_URLS.KUCOIN}${symbol}-USDT`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors"
          >
            <span className="text-green-400 font-semibold text-sm">KuCoin</span>
            <ExternalLink size={14} className="text-green-400" />
          </a>
        </div>
      </div>

      {/* DEX Links */}
      {tokenInfo && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Decentralized Exchanges
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {tokenInfo.chain === 'ethereum' && (
              <>
                <a
                  href={`${DEX_URLS.UNISWAP}${tokenInfo.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-pink-500/10 hover:bg-pink-500/20 rounded-lg transition-colors"
                >
                  <span className="text-pink-400 font-semibold text-sm">Uniswap</span>
                  <ExternalLink size={14} className="text-pink-400" />
                </a>
                <a
                  href={`${DEX_URLS.SUSHISWAP}${tokenInfo.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                >
                  <span className="text-blue-400 font-semibold text-sm">Sushi</span>
                  <ExternalLink size={14} className="text-blue-400" />
                </a>
              </>
            )}
            {tokenInfo.chain === 'solana' && (
              <>
                <a
                  href={`${DEX_URLS.JUPITER}${symbol}-USDC`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors"
                >
                  <span className="text-purple-400 font-semibold text-sm">Jupiter</span>
                  <ExternalLink size={14} className="text-purple-400" />
                </a>
                <a
                  href={`${DEX_URLS.RAYDIUM}${tokenInfo.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                >
                  <span className="text-blue-400 font-semibold text-sm">Raydium</span>
                  <ExternalLink size={14} className="text-blue-400" />
                </a>
              </>
            )}
            {tokenInfo.chain === 'avalanche' && (
              <a
                href={`https://traderjoexyz.com/avalanche/trade?outputCurrency=${tokenInfo.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <span className="text-red-400 font-semibold text-sm">Trader Joe</span>
                <ExternalLink size={14} className="text-red-400" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Birdeye Link for Solana tokens */}
      {tokenInfo?.chain === 'solana' && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Token Analytics
          </h4>
          <a
            href={`https://birdeye.so/token/${tokenInfo.address}?chain=solana`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 rounded-lg transition-colors w-full"
          >
            <span className="text-neon-cyan font-semibold text-sm">Birdeye.so</span>
            <span className="text-xs text-gray-500">- Solana DEX Screener</span>
            <ExternalLink size={14} className="text-neon-cyan ml-auto" />
          </a>
        </div>
      )}

      {/* DexScreener for all tokens */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          DEX Analytics
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`https://dexscreener.com/search?q=${symbol}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors"
          >
            <span className="text-green-400 font-semibold text-sm">DexScreener</span>
            <ExternalLink size={14} className="text-green-400" />
          </a>
          <a
            href={`https://www.coingecko.com/en/coins/${symbol.toLowerCase()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-teal-500/10 hover:bg-teal-500/20 rounded-lg transition-colors"
          >
            <span className="text-teal-400 font-semibold text-sm">CoinGecko</span>
            <ExternalLink size={14} className="text-teal-400" />
          </a>
        </div>
      </div>
    </div>
  )
}
