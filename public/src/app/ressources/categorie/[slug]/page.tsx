import PageTitle from "@/components/common/PageTitle";
import { fr } from "@codegouvfr/react-dsfr";
import { fetchAPI, cmsRessourcesByPage } from "@/helpers/cms";
import CategoryTags from "@/components/common/CategoryTags";
import Pagination from "@/components/common/Pagination";
import RessourceCard from '@/components/ressources/RessourceCard';

export async function generateMetadata({ params }: { params: { slug: string }}) {
  const query = {
    filters: {
      slug: {
        $eq: params.slug,
      }
    }
  };
  const {data} =  await fetchAPI('/categories',query);
  return {
    title: `Catégorie ${data ? data[0].attributes.label : ''} des ressources | Observatoire.covoiturage.gouv.fr`,
    description: `Catégorie ${data ? data[0].attributes.label : ''} des ressources sur le covoiturage de courte distance`,
  }
}

export async function generateStaticParams() {
  const query = {
    fields: 'slug',
  };
  const {data} =  await fetchAPI('/categories',query);
  
  return data.map((post:any) => ({
    slug: post.attributes.slug,
  }))
}

export default async function ResourceCategoryPage({ params }: { params: { slug: string }}) {
  const query = {
    populate: 'categories,img,file',
    filters:{
      categories:{
        slug:{
          $eq: params.slug
        }
      }
    },
    sort:'public_date:desc',
    pagination: {
      pageSize: cmsRessourcesByPage,
    }
  };
  const { data, meta }  = await fetchAPI('/resources',query);
  const catQuery = {
    filters:{
      resources:{
        id:{
          $notNull: true
        }
      }
    }
  }
  const categories =  await fetchAPI('/categories',catQuery);
  const pageTitle = 'Ressources';
  const nbPage = meta.pagination.pageCount;

  return (
    <div id='content'>
      <PageTitle title={pageTitle} />
      <div className={fr.cx('fr-grid-row','fr-mb-3w')}>
        {categories.data && <CategoryTags categories={categories.data} active={params.slug} type={'ressources'} />}
      </div>
      <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
        {data &&
          data.map((a:any, i:number) => {
            return (
              <div key={i} className={fr.cx('fr-col-12','fr-col-md-6')}>
                <RessourceCard 
                  title={a.attributes.title}
                  content={a.attributes.content}
                  date={new Date(a.attributes.public_date).toLocaleDateString('fr-FR')}
                  link={a.attributes.link}
                  file={a.attributes.file.data ? a.attributes.file.data.attributes.url : null}
                  img={a.attributes.img.data ? a.attributes.img.data.attributes.url : null} 
                />
              </div>
            )
          })
        }
      </div>
      <Pagination
        count={nbPage}
        href={`/ressources/categorie/${params.slug}`}
      />     
    </div>
  );
}
