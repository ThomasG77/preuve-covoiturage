import Block from "@/components/common/Block";
import Hero from "@/components/common/Hero";
import PageTitle from "@/components/common/PageTitle";
import SectionTitle from "@/components/common/SectionTitle";
import RessourceCard from "@/components/ressources/RessourceCard";
import { fetchAPI, shorten } from "@/helpers/cms";
import { fr } from "@codegouvfr/react-dsfr";
import MDContent from "@/components/common/MDContent";
import Highlight from '@/components/common/Highlight';
import Indicator from '@/components/observatoire/indicators/Indicator';
import Analyse from '@/components/observatoire/indicators/Analyse';
import Map from '@/components/observatoire/indicators/Map';
import Graph from '@/components/observatoire/indicators/Graph';

export async function generateMetadata({ params }: { params: { slug: string }}) {
  const query = {
    filters: {
      slug: {
        $eq: params.slug,
      },
      tags:{
        slug:{
          $in: ['observatoire'],
        }
      }
    },
    fields:['title','content']
  };
  const {data}  = await fetchAPI('/pages',query);
  return {
    title: `${data ? data[0].attributes.title : ''} | Observatoire.covoiturage.gouv.fr`,
    description: shorten(`${data ? data[0].attributes.content :
    'Observer le covoiturage de courte distance en France'}`,150),
  }
}

export async function generateStaticParams() {
  const query = {
    filters: {
      tags:{
        slug:{
          $in: ['observatoire'],
        }
      }
    },
    fields:['slug']
  };
  const {data}  = await fetchAPI('/pages',query);
  return data ? data.map((post:any) => ({
    slug: post.attributes.slug,
  })) : []
}

export default async function ObservatoireSinglePage({ params }: { params: { slug: string }}) {
  const query = {
    filters: {
      slug: {
        $eq: params.slug,
      },
    },
    populate: {
      hero: {
        populate: 'buttons,img'
      },
      block: {
        populate: 'buttons,img'
      },
      list: {
        populate: '*'
      },
      rows: {
        populate: '*'
      }
    },  
  };
  const response  = await fetchAPI('/pages',query);
  const data = response.data[0];
  const hero = data.attributes.hero;
  const block = data.attributes.block;
  const list = data.attributes.list;
  const rows = data.attributes.rows;

  return(
    <div id='content'>
      {!hero && 
        <PageTitle title={data ? data.attributes.title : ''} />
      }
      {hero && 
        <Hero 
          title={hero.title} 
          subtitle={hero.subtitle}
          content={hero.content} 
          img={hero.img} 
          alt={hero.alt} 
          buttons={hero.buttons} 
        />
      }
      {rows && 
        <div className={fr.cx('fr-grid-row','fr-grid-row--gutters', 'fr-mt-5w')}>
          {rows.map((r:any, i:number) =>
            { 
              switch(r.__component){
                case 'row.title':
                  return(
                    <div key={i} className={fr.cx('fr-col-12')}>
                      <h2>{r.title}</h2>
                    </div>
                  )
                case 'row.indicator':
                  return(
                    <Indicator key={i} value={r.value} unit={r.unit} info={r.info} text={r.text} icon={r.icon} />
                  )
                case 'row.analyse':
                  return(
                    <Analyse key={i} title={r.title} content={r.content} link={r.link} />
                  )
                case 'row.map':
                  return(
                    <Map key={i} title={r.title} params={r.params} />
                  )
                case 'row.graph':
                  return(
                    <Graph key={i} title={r.title} params={r.params} />
                  )               
              }
            }            
          )}
        </div>
      }
      {block &&
        <Block 
          title={block.title} 
          content={block.content} 
          img={block.img.data.attributes.url} 
          alt={block.alt} 
          buttons={block.buttons} 
        />
      }
      {list && 
        <div className={fr.cx('fr-grid-row')}>
          {list.map((l:any, i:number) => 
            l.__component === 'page.highlight' 
            ? <Highlight key={i} 
                title={l.title}
                content={l.content}
                img={l.img.data.attributes.url}
                buttons={l.buttons}
                classes={l.classes} 
              /> 
            : <SectionTitle key={i} title={l.title} />        
          )}
        </div>
      }
      <div className={fr.cx('fr-grid-row','fr-mt-5w')}>
        <div className={fr.cx('fr-col')}>
          <div>
            <MDContent source={data ? data.attributes.content : ''} />
          </div>
        </div>
      </div>
      {/*ressources.length >=1 && 
      <>
        <SectionTitle title='Ressources' />
        <div className={fr.cx('fr-grid-row','fr-grid-row--gutters')}>
          {ressources.map((r:any, i:number) =>  
            <div key={i} className={fr.cx('fr-col', 'fr-col-md-4')}>
              <RessourceCard 
                title={r.item.title}
                content={shorten(r.item.content, 100)}
                date={new Date(r.item.date_created).toLocaleDateString('fr-FR')}
                link={r.item.link}
                file={`${cmsHost}/assets/${r.item.file}`}
                img={`${cmsHost}/assets/${r.item.img}`}
                img_legend={r.item.img_legend}                
              />
            </div>
          )}
        </div>
          </>*/}
    </div>
  );
}