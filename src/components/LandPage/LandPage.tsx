import * as React from 'react'
import { Table, Row, Column, Header, Pagination, Section, Container } from '@beland/uikit'
import { t } from '@beland/dapps/dist/modules/translation/utils'
import Chip from 'components/Chip'
import { Atlas } from 'components/Atlas'
import { NavigationTab } from 'components/Navigation/Navigation.types'
import LoggedInDetailPage from 'components/LoggedInDetailPage'
import { Land, RoleType } from 'modules/land/types'
import { LandPageView } from 'modules/ui/land/types'
import { getCoords } from 'modules/land/utils'
import TableRow from './TableRow'
import { Props, State } from './LandPage.types'
import './LandPage.css'

const PAGE_SIZE = 10

export default class LandPage extends React.PureComponent<Props, State> {
  state: State = {
    page: 1,
    selectedLand: 0
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.lands !== this.props.lands) {
      this.setState({ page: 1 })
    }
  }

  renderLand() {
    const { view, onSetView } = this.props
    const { page, selectedLand } = this.state

    const filteredLands = this.getFilteredLands()

    const totalPages = Math.ceil(filteredLands.length / PAGE_SIZE)

    let selectedX
    let selectedY
    if (filteredLands.length > 1 && selectedLand < filteredLands.length) {
      const { x, y } = getCoords(filteredLands[selectedLand])
      selectedX = x
      selectedY = y
    } else if (filteredLands.length === 1) {
      const { x, y } = getCoords(filteredLands[0])
      selectedX = x
      selectedY = y
    }
    return (
      <>
        <div className="filters">
          <Container>
            <Row height={30}>
              <Column>
                <Row>
                  <Header sub>{t('land_page.results', { count: filteredLands.length.toLocaleString() })}</Header>
                  {view === LandPageView.ATLAS && filteredLands.length > 1 ? (
                    <>
                      <div className="arrow prev" onClick={this.handlePrev}></div>
                      <div className="arrow next" onClick={this.handleNext}></div>
                    </>
                  ) : null}
                </Row>
              </Column>
              <Column align="right">
                <Row>
                  <Chip className="grid" icon="table" isActive={view === LandPageView.GRID} onClick={() => onSetView(LandPageView.GRID)} />
                  <Chip className="atlas" icon="pin" isActive={view === LandPageView.ATLAS} onClick={() => onSetView(LandPageView.ATLAS)} />
                </Row>
              </Column>
            </Row>
          </Container>
        </div>
        {view === LandPageView.GRID ? (
          <Container>
            <Section className="table-section">
              {filteredLands && filteredLands.length > 0 ? (
                <Table basic="very">
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell width="4">{t('land_page.name')}</Table.HeaderCell>
                      <Table.HeaderCell width="2">{t('land_page.coords')}</Table.HeaderCell>
                      <Table.HeaderCell width="2">{t('land_page.owner')}</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {filteredLands.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((land, index) => (
                      <TableRow land={land} key={index} />
                    ))}
                  </Table.Body>
                </Table>
              ) : null}
            </Section>
            {totalPages > 1 ? (
              <Section className="pagination-section">
                <Pagination
                  firstItem={null}
                  lastItem={null}
                  activePage={page}
                  onPageChange={(_event, props) => this.setState({ page: +props.activePage! })}
                  totalPages={totalPages}
                ></Pagination>
              </Section>
            ) : null}
          </Container>
        ) : (
          <div className="atlas-wrapper">
            <Atlas className="main" x={selectedX} y={selectedY} hasPopup />
          </div>
        )}
      </>
    )
  }

  getFilteredLands(): Land[] {
    const { lands } = this.props
    const filteredLands = lands.filter(land => {
      if (land.role === RoleType.OWNER) {
        return true
      }
      return false
    })
    return filteredLands
  }

  handleNext = () => {
    const { selectedLand } = this.state
    const lands = this.getFilteredLands()
    if (selectedLand === lands.length - 1) {
      this.setState({ selectedLand: 0 })
    } else {
      this.setState({ selectedLand: selectedLand + 1 })
    }
  }

  handlePrev = () => {
    const { selectedLand } = this.state
    if (selectedLand === 0) {
      const lands = this.getFilteredLands()
      this.setState({ selectedLand: lands.length - 1 })
    } else {
      this.setState({ selectedLand: selectedLand - 1 })
    }
  }

  render() {
    const { isLoading, view } = this.props
    return (
      <LoggedInDetailPage
        className={`LandPage ${view}-view`}
        activeTab={NavigationTab.LAND}
        isLoading={isLoading}
        isPageFullscreen={true}
        isFooterFullscreen={view === LandPageView.ATLAS}
        isNavigationFullscreen={view === LandPageView.ATLAS}
      >
        {this.renderLand()}
      </LoggedInDetailPage>
    )
  }
}
