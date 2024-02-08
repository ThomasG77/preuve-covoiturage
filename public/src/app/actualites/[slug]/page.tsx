import PageTitle from "@/components/common/PageTitle";
import Share from "@/components/common/Share";
import { Config } from "@/config";
import { fr } from "@codegouvfr/react-dsfr";
import Tag from "@codegouvfr/react-dsfr/Tag";
import Image from 'next/image';
import { fetchAPI, shorten } from "@/helpers/cms";
import MDContent from "@/components/common/MDContent";

export async function generateMetadata({ params }: { params: { slug: string }}) {
  const query = {
    filters: {
      slug: {
        $eq: params.slug,
      }
    },
    fields:['title','description']
  };
  const response  = await fetchAPI('/articles',query);
  const data = response.data[0];
  return {
    title: `${data ? data.attributes.title : ''} | Observatoire.covoiturage.gouv.fr`,
    description: shorten(`${data && data.attributes.description ? data.attributes.description : ''}`,150),
  }
}

export async function generateStaticParams() {
  const query = {
    fields:['slug']
  };
  const response  = await fetchAPI('/articles',query);
  const data = response.data
  return data ? data.map((p:any) => ({
    slug: p.attributes.slug,
  })) : []
}

export default async function ActuSingle({ params }: { params: { slug: string }}) {
  const hostUrl = Config.get<string>('next.public_url', 'http://localhost:4200');
  const location = `${hostUrl}/actualites/${params.slug}`;
  const query = {
    filters: {
      slug: {
        $eq: params.slug,
      },
    },
    populate: '*',  
  };
  const response  = await fetchAPI('/articles',query);
  const data = response.data[0];
    
  const share = [
    {
      name:'Facebook', 
      icon:'fr-share__link--facebook', 
      href:`https://www.facebook.com/sharer.php?u=${location}`,
    },
    {
      name:'Twitter', 
      icon:'fr-share__link--twitter', 
      href:`https://twitter.com/intent/tweet?url=${location}`,
    },
    {
      name:'LinkedIn', 
      icon:'fr-share__link--linkedin', 
      href:`https://www.linkedin.com/shareArticle?url=${location}`,
    },
    {
      name:'Email', 
      icon:'fr-share__link--mail', 
      href:`mailto:?subject=${data ? data.attributes.title : ''}&body=${data ? data.attributes.description : ''} ${location}`,
    }
  ]

  return (
    <article id='actu-content'>
      <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
      { data && 
        <div className={fr.cx('fr-col','fr-col-12')}>
          <PageTitle title={data.attributes.title} />
          { data.attributes.date_created &&
            <p>Publié le {new Date(data.attributes.date_created).toLocaleDateString('fr-FR')}</p>
          }
          <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
            <div className={fr.cx('fr-col','fr-col-md-9')}>
              <ul className={fr.cx('fr-tags-group')}>
                {data.attributes.categories &&
                  data.attributes.categories.data.map((c:any, i:number) => {
                    return (
                      <li key={i}>
                        <Tag
                          linkProps={{
                            href: `/actualites/categorie/${c.attributes.slug}`
                          }}
                        >
                          {c.attributes.label}
                        </Tag>
                      </li>
                    )
                  })
                }
              </ul>
            </div>
            <div className={fr.cx('fr-col','fr-col-md-3')}>
              <Share social={share} location={location} />
            </div>
          </div>          
          <figure style={{textAlign:'center'}}>
              <Image className={fr.cx('fr-responsive-img', 'fr-responsive-img--16x9')} src={data.attributes.img.data.attributes.formats.large.url} alt={data.attributes.legend} width={data.attributes.img.data.attributes.formats.large.width} height={data.attributes.img.data.attributes.formats.large.height} />
            <figcaption className={fr.cx('fr-content-media__caption')}>{data.attributes.legend}</figcaption>
          </figure>
          <div>
            {data.attributes.description}
            <MDContent source={data.attributes.content} />
          </div>
        </div>
      }
      </div>
    </article>
  );
}