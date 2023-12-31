import { Center } from '@chakra-ui/react'
import type { AccountId } from '@xblackfury/caip'
import { DefiModalContent } from 'features/defi/components/DefiModal/DefiModalContent'
import { DefiModalHeader } from 'features/defi/components/DefiModal/DefiModalHeader'
import type {
  DefiParams,
  DefiQueryParams,
} from 'features/defi/contexts/DefiManagerProvider/DefiCommon'
import { DefiAction, DefiStep } from 'features/defi/contexts/DefiManagerProvider/DefiCommon'
import qs from 'qs'
import { useMemo, useReducer } from 'react'
import { useTranslate } from 'react-polyglot'
import { useSelector } from 'react-redux'
import type { AccountDropdownProps } from 'components/AccountDropdown/AccountDropdown'
import { CircularProgress } from 'components/CircularProgress/CircularProgress'
import type { DefiStepProps } from 'components/DeFi/components/Steps'
import { Steps } from 'components/DeFi/components/Steps'
import { useBrowserRouter } from 'hooks/useBrowserRouter/useBrowserRouter'
import { serializeUserStakingId, toOpportunityId } from 'state/slices/opportunitiesSlice/utils'
import {
  selectEarnUserStakingOpportunityByUserStakingId,
  selectPortfolioLoading,
} from 'state/slices/selectors'
import { useAppSelector } from 'state/store'

import { Approve } from './components/Approve'
import { Confirm } from './components/Confirm'
import { ExpiredWithdraw } from './components/ExpiredWithdraw'
import { Status } from './components/Status'
import { Withdraw } from './components/Withdraw'
import { WithdrawContext } from './WithdrawContext'
import { initialState, reducer } from './WithdrawReducer'

type JinxFarmingWithdrawProps = {
  accountId: AccountId | undefined
  onAccountIdChange: AccountDropdownProps['onChange']
}
export const JinxFarmingWithdraw: React.FC<JinxFarmingWithdrawProps> = ({
  accountId,
  onAccountIdChange: handleAccountIdChange,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const translate = useTranslate()
  const { query, history, location } = useBrowserRouter<DefiQueryParams, DefiParams>()
  const { assetNamespace, chainId, contractAddress } = query

  const opportunityDataFilter = useMemo(
    () => ({
      userStakingId: serializeUserStakingId(
        accountId!,
        toOpportunityId({
          chainId,
          assetNamespace,
          assetReference: contractAddress,
        }),
      ),
    }),
    [accountId, assetNamespace, chainId, contractAddress],
  )
  const jinxFarmingOpportunity = useAppSelector(state =>
    selectEarnUserStakingOpportunityByUserStakingId(state, opportunityDataFilter),
  )

  const loading = useSelector(selectPortfolioLoading)

  const handleBack = () => {
    history.push({
      pathname: location.pathname,
      search: qs.stringify({
        ...query,
        modal: DefiAction.Overview,
      }),
    })
  }

  const StepConfig: DefiStepProps = useMemo(() => {
    return {
      [DefiStep.Info]: jinxFarmingOpportunity?.expired
        ? {
            label: translate('defi.steps.withdraw.info.title'),
            description: translate('defi.steps.withdraw.info.farmingExpiredDescription'),
            component: ownProps => (
              <ExpiredWithdraw
                {...ownProps}
                accountId={accountId}
                onAccountIdChange={handleAccountIdChange}
              />
            ),
          }
        : {
            label: translate('defi.steps.withdraw.info.title'),
            description: translate('defi.steps.withdraw.info.description', {
              asset: jinxFarmingOpportunity?.name,
            }),
            component: ownProps => (
              <Withdraw
                {...ownProps}
                accountId={accountId}
                onAccountIdChange={handleAccountIdChange}
              />
            ),
          },
      [DefiStep.Approve]: {
        label: translate('defi.steps.approve.title'),
        component: ownProps => <Approve {...ownProps} accountId={accountId} />,
      },
      [DefiStep.Confirm]: {
        label: translate('defi.steps.confirm.title'),
        component: ownProps => <Confirm {...ownProps} accountId={accountId} />,
      },
      [DefiStep.Status]: {
        label: 'Status',
        component: () => <Status accountId={accountId} />,
      },
    }
  }, [
    accountId,
    jinxFarmingOpportunity?.expired,
    jinxFarmingOpportunity?.name,
    handleAccountIdChange,
    translate,
  ])

  if (loading || !jinxFarmingOpportunity)
    return (
      <Center minW='350px' minH='350px'>
        <CircularProgress />
      </Center>
    )

  return (
    <WithdrawContext.Provider value={{ state, dispatch }}>
      <DefiModalContent>
        <DefiModalHeader
          title={translate('modals.withdraw.withdrawFrom', {
            opportunity: jinxFarmingOpportunity?.name,
          })}
          onBack={handleBack}
        />
        <Steps steps={StepConfig} />
      </DefiModalContent>
    </WithdrawContext.Provider>
  )
}
