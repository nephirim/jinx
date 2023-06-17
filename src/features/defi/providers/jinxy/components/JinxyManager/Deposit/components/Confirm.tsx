import { Alert, AlertIcon, Box, Stack, useToast } from '@chakra-ui/react'
import { supportsETH } from '@shapeshiftoss/hdwallet-core'
import type { AccountId } from '@xblackfury/caip'
import { fromAccountId } from '@xblackfury/caip'
import type { ethers } from 'ethers'
import { Confirm as ReusableConfirm } from 'features/defi/components/Confirm/Confirm'
import { Summary } from 'features/defi/components/Summary'
import { DefiStep } from 'features/defi/contexts/DefiManagerProvider/DefiCommon'
import { useJinxyQuery } from 'features/defi/providers/jinxy/components/JinxyManager/useJinxyQuery'
import isNil from 'lodash/isNil'
import { useCallback, useContext, useMemo } from 'react'
import { useTranslate } from 'react-polyglot'
import { Amount } from 'components/Amount/Amount'
import { AssetIcon } from 'components/AssetIcon'
import type { StepComponentProps } from 'components/DeFi/components/Steps'
import { Row } from 'components/Row/Row'
import { RawText, Text } from 'components/Text'
import { usePoll } from 'hooks/usePoll/usePoll'
import { useWallet } from 'hooks/useWallet/useWallet'
import { bn, bnOrZero } from 'lib/bignumber/bignumber'
import { getJinxyApi } from 'state/apis/jinxy/jinxyApiSingleton'
import {
  selectBIP44ParamsByAccountId,
  selectPortfolioCryptoPrecisionBalanceByFilter,
} from 'state/slices/selectors'
import { useAppSelector } from 'state/store'

import { JinxyDepositActionType } from '../DepositCommon'
import { DepositContext } from '../DepositContext'

type ConfirmProps = StepComponentProps & { accountId: AccountId | undefined }

export const Confirm: React.FC<ConfirmProps> = ({ onNext, accountId }) => {
  const poll = usePoll<ethers.providers.TransactionReceipt>()
  const jinxyApi = getJinxyApi()
  const { state, dispatch } = useContext(DepositContext)
  const translate = useTranslate()
  const {
    stakingAssetReference: assetReference,
    feeMarketData,
    contractAddress,
    stakingAsset: asset,
    feeAsset,
  } = useJinxyQuery()

  const accountFilter = useMemo(() => ({ accountId: accountId ?? '' }), [accountId])
  const accountAddress = useMemo(
    () => (accountId ? fromAccountId(accountId).account : null),
    [accountId],
  )
  const bip44Params = useAppSelector(state => selectBIP44ParamsByAccountId(state, accountFilter))

  // user info
  const { state: walletState } = useWallet()

  // notify
  const toast = useToast()

  const feeAssetBalanceFilter = useMemo(
    () => ({ assetId: feeAsset?.assetId, accountId: accountId ?? '' }),
    [accountId, feeAsset?.assetId],
  )
  const feeAssetBalance = useAppSelector(s =>
    selectPortfolioCryptoPrecisionBalanceByFilter(s, feeAssetBalanceFilter),
  )

  const handleDeposit = useCallback(async () => {
    if (
      !(
        accountAddress &&
        assetReference &&
        walletState.wallet &&
        jinxyApi &&
        bip44Params &&
        dispatch
      )
    )
      return
    try {
      dispatch({ type: JinxyDepositActionType.SET_LOADING, payload: true })

      if (!supportsETH(walletState.wallet))
        throw new Error(`handleDeposit: wallet does not support ethereum`)

      const txid = await jinxyApi.deposit({
        amountDesired: bnOrZero(state?.deposit.cryptoAmount)
          .times(bn(10).pow(asset.precision))
          .decimalPlaces(0),
        tokenContractAddress: assetReference,
        userAddress: accountAddress,
        contractAddress,
        wallet: walletState.wallet,
        bip44Params,
      })
      dispatch({ type: JinxyDepositActionType.SET_TXID, payload: txid })
      onNext(DefiStep.Status)

      const transactionReceipt = await poll({
        fn: () => jinxyApi.getTxReceipt({ txid }),
        validate: (result: ethers.providers.TransactionReceipt) => !isNil(result),
        interval: 15000,
        maxAttempts: 30,
      })
      dispatch({
        type: JinxyDepositActionType.SET_DEPOSIT,
        payload: {
          txStatus: transactionReceipt.status ? 'success' : 'failed',
          usedGasFeeCryptoBaseUnit: transactionReceipt.effectiveGasPrice
            .mul(transactionReceipt.gasUsed)
            .toString(),
        },
      })
    } catch (error) {
      console.error(error)
      toast({
        position: 'top-right',
        description: translate('common.transactionFailedBody'),
        title: translate('common.transactionFailed'),
        status: 'error',
      })
    } finally {
      dispatch({ type: JinxyDepositActionType.SET_LOADING, payload: false })
    }
  }, [
    accountAddress,
    assetReference,
    walletState.wallet,
    jinxyApi,
    bip44Params,
    dispatch,
    state?.deposit.cryptoAmount,
    asset.precision,
    contractAddress,
    onNext,
    poll,
    toast,
    translate,
  ])

  if (!state || !dispatch) return null

  const hasEnoughBalanceForGas = bnOrZero(feeAssetBalance)
    .minus(bnOrZero(state.deposit.estimatedGasCryptoBaseUnit).div(bn(10).pow(feeAsset.precision)))
    .gte(0)

  return (
    <ReusableConfirm
      onCancel={() => onNext(DefiStep.Info)}
      onConfirm={handleDeposit}
      loading={state.loading}
      loadingText={translate('common.confirm')}
      isDisabled={!hasEnoughBalanceForGas}
      headerText='modals.confirm.deposit.header'
    >
      <Summary>
        <Row variant='vertical' p={4}>
          <Row.Label>
            <Text translation='modals.confirm.amountToDeposit' />
          </Row.Label>
          <Row px={0} fontWeight='medium'>
            <Stack direction='row' alignItems='center'>
              <AssetIcon size='xs' src={asset.icon} />
              <RawText>{asset.name}</RawText>
            </Stack>
            <Row.Value>
              <Amount.Crypto value={state.deposit.cryptoAmount} symbol={asset.symbol} />
            </Row.Value>
          </Row>
        </Row>
        <Row p={4}>
          <Row.Label>
            <Text translation='modals.confirm.estimatedGas' />
          </Row.Label>
          <Row.Value>
            <Box textAlign='right'>
              <Amount.Fiat
                fontWeight='bold'
                value={bnOrZero(state.deposit.estimatedGasCryptoBaseUnit)
                  .div(bn(10).pow(feeAsset.precision))
                  .times(feeMarketData.price)
                  .toFixed(2)}
              />
              <Amount.Crypto
                color='gray.500'
                value={bnOrZero(state.deposit.estimatedGasCryptoBaseUnit)
                  .div(bn(10).pow(feeAsset.precision))
                  .toFixed(5)}
                symbol={feeAsset.symbol}
              />
            </Box>
          </Row.Value>
        </Row>
      </Summary>
      <Alert status='info' borderRadius='lg'>
        <AlertIcon />
        <Text translation='modals.confirm.deposit.preFooter' />
      </Alert>
      {!hasEnoughBalanceForGas && (
        <Alert status='error' borderRadius='lg'>
          <AlertIcon />
          <Text translation={['modals.confirm.notEnoughGas', { assetSymbol: feeAsset.symbol }]} />
        </Alert>
      )}
    </ReusableConfirm>
  )
}
