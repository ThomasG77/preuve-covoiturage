import { Badge } from '@codegouvfr/react-dsfr/Badge';
import style from './Indicator.module.scss';
import { IndicatorProps } from '@/interfaces/observatoire/componentsInterfaces';
import { fr } from '@codegouvfr/react-dsfr';

export default function Indicator(props: IndicatorProps) {
  return (
    <div className={`${fr.cx('fr-col-12','fr-col-md-3')} ${style.col}`}>
      <div className={`${fr.cx('fr-callout')} ${style.stat}`}>
        {props.info && <Badge severity='info'>{props.info}</Badge>}
        
        <div className={`fr-callout__title`}>
          
          <p className={`${style.value}`}>
          {props.icon && <span aria-hidden={true} className={`${props.icon} ${style.icon}`}></span>}
          <span className={`fr-h3`}>{props.value} {props.unit ? props.unit : ''}</span></p>
        </div>
        <div className={`fr-callout__text ${style.text}`}>
          {props.text}
        </div>
      </div>
    </div>
  );
}
