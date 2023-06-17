import { TransferType } from '@xblackfury/unchained-client'
import { useMemo } from 'react'

import { Amount } from './TransactionDetails/Amount'
import { TransactionDetailsContainer } from './TransactionDetails/Container'
import { Row } from './TransactionDetails/Row'
import { Status } from './TransactionDetails/Status'
import { TransactionId } from './TransactionDetails/TransactionId'
import { Transfers } from './TransactionDetails/Transfers'
import { TxGrid } from './TransactionDetails/TxGrid'
import { TransactionGenericRow } from './TransactionGenericRow'
import type { TransactionRowProps } from './TransactionRow'
import { getTransfersByType } from './utils'

export const TransactionReceive = ({
  txDetails,
  showDateAndGuide,
  compactMode,
  toggleOpen,
  isOpen,
  parentWidth,
}: TransactionRowProps) => {
  const transfersByType = useMemo(
    () => getTransfersByType(txDetails.transfers, [TransferType.Receive]),
    [txDetails.transfers],
  )

  return (
    <>
      <TransactionGenericRow
        type={txDetails.type}
        status={txDetails.tx.status}
        toggleOpen={toggleOpen}
        compactMode={compactMode}
        blockTime={txDetails.tx.blockTime}
        transfersByType={transfersByType}
        fee={txDetails.fee}
        explorerTxLink={txDetails.explorerTxLink}
        txid={txDetails.tx.txid}
        showDateAndGuide={showDateAndGuide}
        parentWidth={parentWidth}
      />
      <TransactionDetailsContainer isOpen={isOpen} compactMode={compactMode}>
        <Transfers compactMode={compactMode} transfers={txDetails.transfers} />
        <TxGrid compactMode={compactMode}>
          <TransactionId explorerTxLink={txDetails.explorerTxLink} txid={txDetails.tx.txid} />
          <Row title='status'>
            <Status status={txDetails.tx.status} />
          </Row>
          <Row title='minerFee'>
            <Amount
              value={txDetails.fee?.value ?? '0'}
              precision={txDetails.fee?.asset?.precision ?? 0}
              symbol={txDetails.fee?.asset.symbol ?? ''}
            />
          </Row>
        </TxGrid>
      </TransactionDetailsContainer>
    </>
  )
}
