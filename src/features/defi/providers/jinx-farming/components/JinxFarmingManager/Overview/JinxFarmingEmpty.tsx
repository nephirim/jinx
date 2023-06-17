import { Button, Skeleton, Stack, Text as CText } from '@chakra-ui/react'
import { DefiModalContent } from 'features/defi/components/DefiModal/DefiModalContent'
import { EmptyOverview } from 'features/defi/components/EmptyOverview/EmptyOverview'
import { Amount } from 'components/Amount/Amount'
import { Text } from 'components/Text'
import type { Asset } from 'lib/asset-service'

type JinxFarmingEmptyProps = {
  assets: Asset[]
  apy: string | undefined
  onClick?: () => void
  opportunityName: string
}

export const JinxFarmingEmpty = ({
  assets,
  apy,
  onClick,
  opportunityName,
}: JinxFarmingEmptyProps) => {
  return (
    <DefiModalContent>
      <EmptyOverview
        assets={assets}
        footer={
          <Button width='full' colorScheme='blue' onClick={onClick}>
            <Text translation='defi.modals.jinxFarmingOverview.cta' />
          </Button>
        }
      >
        <Stack spacing={1} justifyContent='center' mb={4}>
          <Text
            translation={[
              'defi.modals.jinxFarmingOverview.header',
              { opportunity: opportunityName },
            ]}
          />
          <CText color='green.500'>
            <Skeleton isLoaded={Boolean(apy)}>
              <Amount.Percent value={apy ?? ''} suffix='APR' />
            </Skeleton>
          </CText>
        </Stack>
        <Text color='gray.500' translation='defi.modals.jinxFarmingOverview.body' />
        <Text color='gray.500' translation='defi.modals.jinxFarmingOverview.rewards' />
      </EmptyOverview>
    </DefiModalContent>
  )
}
