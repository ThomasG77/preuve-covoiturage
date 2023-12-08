import { Config } from '@/config';
import { monthList } from '@/helpers/lists';
import { useApi } from '@/hooks/useApi';
import { SearchParamsInterface } from '@/interfaces/observatoire/componentsInterfaces';
import { EvolDistanceDataInterface } from '@/interfaces/observatoire/dataInterfaces';
import { fr } from '@codegouvfr/react-dsfr';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function DistanceGraph({ title, params }: { title: string; params: SearchParamsInterface }) {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const apiUrl = Config.get<string>('next.public_api_url', '');
  const url = `${apiUrl}/evol-monthly-flux?indic=distance&code=${params.code}&type=${params.type}&year=${params.year}&month=${params.month}`;
  const { data, error, loading } = useApi<EvolDistanceDataInterface[]>(url);
  const dataset = data?.map((d) => d.distance/d.journeys).reverse();

  const chartData = () => {
    const labels = data?.map((d) => {
      const month = monthList.find((m) => m.id == d.month);
      return month!.name + ' ' + d.year;
    });
    const datasets = [
      {
        data: dataset,
        fill: true,
        borderColor: '#000091',
        backgroundColor: 'rgba(0, 0, 145, 0.2)',
        tension: 0.1,
      },
    ];
    return { labels: labels!.reverse(), datasets: datasets };
  };

  return (
    <>
      {loading && (
        <div className={fr.cx('fr-callout')}>
          <h3 className={fr.cx('fr-callout__title')}>{title}</h3>
          <div>Chargement en cours...</div>
        </div>
      )}
      {error && (
        <div className={fr.cx('fr-callout')}>
          <h3 className={fr.cx('fr-callout__title')}>{title}</h3>
          <div>{`Un problème est survenu au chargement des données: ${error}`}</div>
        </div>
      )}
      {!loading && !error && (
        <div className={fr.cx('fr-callout')}>
          <h3 className={fr.cx('fr-callout__title')}>{title}</h3>
          <figure className='graph-wrapper' style={{ backgroundColor: '#fff' }}>
            <Line options={options} data={chartData()} aria-hidden tabIndex={0} />
            { dataset &&
              <figcaption className={fr.cx('fr-sr-only')}>
                <ul>
                  { dataset.map((d,i) =>{
                    return (
                      <li key={i}>{chartData().labels[i]} : {d.toLocaleString('fr-FR',{maximumFractionDigits:2})} km</li>
                    )
                  })} 
                </ul>
              </figcaption>
            }
          </figure>
        </div>
      )}
    </>
  );
}
