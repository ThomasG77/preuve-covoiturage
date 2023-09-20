'use client';
import PageTitle from '@/components/common/PageTitle';
import SelectInList from '@/components/common/SelectInList';
import SelectObserve from '@/components/observatoire/SelectObserve';
import SelectPeriod from '@/components/observatoire/SelectPeriod';
import SelectTerritory from '@/components/observatoire/SelectTerritory';
import { getPeriod } from '@/helpers/analyse';
import { graphList, mapList } from '@/helpers/lists';
import { useDashboard } from '@/hooks/useDashboard';
import { fr } from '@codegouvfr/react-dsfr';
import SectionTitle from '../../../components/common/SectionTitle';
import KeyFigures from './KeyFigures';
import DistanceGraph from './graphs/DistanceGraph';
import RepartitionDistanceGraph from './graphs/RepartitionDistanceGraph';
import RepartitionHoraireGraph from './graphs/RepartitionHoraireGraph';
import TrajetsGraph from './graphs/TrajetsGraph';
import DensiteMap from './maps/DensiteMap';
import FluxMap from './maps/FluxMap';
import OccupationMap from './maps/OccupationMap';
import AiresCovoiturageMap from './maps/AiresMap';
import BestFluxTable from './tables/BestFluxTable';
import BestTerritoriesTable from './tables/BestTerritoriesTable';
import { Suspense } from 'react';

export default function Page() {
  const title = 'Observer le covoiturage courte distance intermédié';
  const { params, error, loading, onChangeTerritory, onChangePeriod, onChangeObserve, onChangeGraph, onChangeMap } = useDashboard();
  const period = getPeriod(params.year, params.month);
  const observeLabel = params.map == 1 ? 'Flux entre:' : 'Territoires observés';

  return (
    <Suspense>
      {!loading && !error &&(
        <article id='content'>
          <PageTitle title={title} />
          <div className={fr.cx('fr-grid-row','fr-grid-row--gutters')}>
            <div className={fr.cx('fr-col','fr-col-md-6')}>
              <SelectTerritory code={params.code} type={params.observe} year={Number(params.year)} onChange={onChangeTerritory} />
            </div>
            <div className={fr.cx('fr-col','fr-col-md-6')}>
              <SelectPeriod year={Number(params.year)} month={Number(params.month)} onChange={onChangePeriod} />
            </div>
          </div>
          <SectionTitle
            title={`${params.name} du ${new Date(period.start_date).toLocaleDateString()} au ${new Date(
              period.end_date,
            ).toLocaleDateString()}`}
          />
          <KeyFigures params={params} />
          <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
            <div className={fr.cx('fr-col','fr-col-md-6')}>
              <RepartitionDistanceGraph title='Trajets par distance' direction='from' params={params} />
            </div>
          </div>
          <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
            <div className={fr.cx('fr-col')}>
              <RepartitionHoraireGraph title='Trajets sortants par horaire' direction='from' params={params} />
            </div>
            <div className={fr.cx('fr-col')}>
              <RepartitionHoraireGraph title='Trajets entrants par horaire' direction='to' params={params} />
            </div>
          </div>
          <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
            <div className={fr.cx('fr-col')}>
              <BestFluxTable title='Top 10 des trajets les plus covoiturés' limit={10} params={params} />
            </div>
            <div className={fr.cx('fr-col')}>
              <BestTerritoriesTable title='Top 10 des territoires' limit={10} params={params} />
            </div>
          </div>
          <SectionTitle title='Cartographie' />
          <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
            <div className={fr.cx('fr-col')}>
              <SelectInList
                label='Sélectionner une carte'
                id={params.map}
                list={mapList}
                sx={{ minWidth: 300 }}
                onChange={onChangeMap}
              />
            </div>
            {[1,3].includes(params.map) && 
              <div className={fr.cx('fr-col')}>
                <SelectObserve label={observeLabel} type={params.type} value={params.observe} onChange={onChangeObserve} />
              </div>
            }
          </div>
          <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
            <div className={fr.cx('fr-col')}>
              {params.map == 1 && <FluxMap title={mapList[0].name} params={params} />}
              {params.map == 2 && <DensiteMap title={mapList[1].name} params={params} />}
              {params.map == 3 && <OccupationMap title={mapList[2].name} params={params} />}
              {params.map == 4 && <AiresCovoiturageMap title={mapList[3].name} params={params} />}
            </div>
          </div>
          <SectionTitle title='Evolution' />
          <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
            <div className={fr.cx('fr-col')}>
              <SelectInList
                label='Sélectionner un graphique'
                id={params.graph}
                list={graphList}
                sx={{ minWidth: 300 }}
                onChange={onChangeGraph}
              />
            </div>
          </div>
          <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
            {params.graph == 1 && (
              <div className={fr.cx('fr-col')}>
                <TrajetsGraph title={graphList[0].name} params={params} />
              </div>
            )}
            {params.graph == 2 && (
              <div className={fr.cx('fr-col')}>
                <DistanceGraph title={graphList[1].name} params={params} />
              </div>
            )}
          </div>
        </article>
      )}
    </Suspense>
  );
}