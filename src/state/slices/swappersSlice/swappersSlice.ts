import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { AccountId } from '@xblackfury/caip'
import { ethAssetId, jinxAssetId } from '@xblackfury/caip'
import type { Asset } from 'lib/asset-service'
import { localAssetData } from 'lib/asset-service'
import { bnOrZero } from 'lib/bignumber/bignumber'
import type { SwapperName } from 'lib/swapper/api'

import { defaultAsset } from '../assetsSlice/assetsSlice'
import { MultiHopExecutionStatus } from './types'

export type SwappersState = {
  selectedQuote: SwapperName | undefined
  buyAsset: Asset
  sellAsset: Asset
  sellAssetAccountId: AccountId | undefined
  receiveAddress: string | undefined
  sellAmountCryptoPrecision: string
  tradeExecutionStatus: MultiHopExecutionStatus
}

// Define the initial state:
const initialState: SwappersState = {
  selectedQuote: undefined,
  buyAsset: localAssetData[jinxAssetId] ?? defaultAsset,
  sellAsset: localAssetData[ethAssetId] ?? defaultAsset,
  sellAssetAccountId: undefined,
  receiveAddress: undefined,
  sellAmountCryptoPrecision: '0',
  tradeExecutionStatus: MultiHopExecutionStatus.Hop1AwaitingApprovalConfirmation,
}

// Create the slice:
export const swappers = createSlice({
  name: 'swappers',
  initialState,
  reducers: {
    clear: () => initialState,
    setSelectedQuote: (state, action: PayloadAction<SwapperName>) => {
      state.selectedQuote = action.payload
    },
    setBuyAsset: (state, action: PayloadAction<Asset>) => {
      state.buyAsset = action.payload
    },
    setSellAsset: (state, action: PayloadAction<Asset>) => {
      state.sellAsset = action.payload
    },
    setSellAssetAccountId: (state, action: PayloadAction<AccountId | undefined>) => {
      state.sellAssetAccountId = action.payload
    },
    setReceiveAddress: (state, action: PayloadAction<string | undefined>) => {
      state.receiveAddress = action.payload
    },
    setSellAmountCryptoPrecision: (state, action: PayloadAction<string>) => {
      // dedupe 0, 0., 0.0, 0.00 etc
      state.sellAmountCryptoPrecision = bnOrZero(action.payload).toString()
    },
    incrementTradeExecutionState: state => {
      if (state.tradeExecutionStatus === MultiHopExecutionStatus.TradeComplete) return
      state.tradeExecutionStatus += 1 as MultiHopExecutionStatus
    },
    switchAssets: state => {
      const buyAsset = state.sellAsset
      state.sellAsset = state.buyAsset
      state.buyAsset = buyAsset
    },
  },
})
