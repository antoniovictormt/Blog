/* eslint-disable react/no-danger */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { Fragment } from 'react';
import { format } from 'date-fns';
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import ptBR from 'date-fns/locale/pt-BR';
import Preview from '../../components/Preview';
import commonStyles from '../../styles/common.module.scss';
import Comments from '../../components/Comments';
import { getPrismicClient } from '../../services/prismic';
import styles from './post.module.scss';

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface NeighborhoodPost {
  uid: string;
  title: string;
}

interface PostProps {
  post: Post;
  preview: boolean;
  nextPost: NeighborhoodPost;
  previousPost: NeighborhoodPost;
}

export default function Post({
  post,
  preview,
  nextPost,
  previousPost,
}: PostProps) {
  const { isFallback } = useRouter();

  if (isFallback) {
    return <span>Carregando...</span>;
  }
  const minutesToRead = post.data.content.reduce((acc, content) => {
    function countWords(str: string) {
      return str.trim().split(/\s+/).length;
    }

    acc += countWords(content.heading) / 200;
    acc += countWords(RichText.asText(content.body)) / 200;

    return Math.ceil(acc);
  }, 0);

  return (
    <>
      <Head>
        <title>spacetraveling | {post.data.title}</title>
      </Head>

      <div className={styles.banner}>
        {post.data.banner.url && (
          <img src={post.data.banner.url} alt={post.data.title} />
        )}
      </div>

      <section className={commonStyles.pages}>
        <main className={styles.content}>
          <div className={styles.container}>
            <h1>{post.data.title}</h1>
            <div className={styles.info}>
              <span>
                <FiCalendar />
                {format(new Date(post.first_publication_date), 'd MMM yyyy', {
                  locale: ptBR,
                })}
              </span>
              <span>
                <FiUser />
                {post.data.author}
              </span>
              <span>
                <FiClock />
                {minutesToRead} min
              </span>
            </div>
            <div className={styles.lastUpdate}>
              <span>
                {post.last_publication_date &&
                  format(
                    new Date(post.last_publication_date),
                    " '* editado em 'd MMM yyyy', às 'HH':'mm",
                    {
                      locale: ptBR,
                    }
                  )}
              </span>
            </div>

            <div className={styles.content}>
              {post.data.content.map((content, index) => (
                <Fragment key={index}>
                  <h2>{content.heading}</h2>
                  <span
                    key={index}
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(content.body),
                    }}
                  />
                </Fragment>
              ))}
            </div>
          </div>
        </main>

        <hr />

        <div className={styles.nextAndPrevious}>
          <div className={styles.button}>
            {previousPost?.uid.length > 0 && (
              <Link href={`/post/${previousPost.uid}`}>
                <a>
                  <span>{previousPost.title}</span>
                  <strong>Post Anterior</strong>
                </a>
              </Link>
            )}
          </div>

          <div className={styles.button}>
            {nextPost?.uid.length > 0 && (
              <Link href={`/post/${nextPost.uid}`}>
                <a>
                  <span>{nextPost.title}</span>
                  <strong>Próximo post</strong>
                </a>
              </Link>
            )}
          </div>
        </div>

        <div className="comments">
          <Comments />
        </div>

        {preview && <Preview />}
      </section>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 2,
    }
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async ({
  params,
  preview = false,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const responsePreviousPost = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { orderings: '[document.first_publication_date desc]', after: response.id }
  );

  const responseNextPost = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { orderings: '[document.first_publication_date]', after: response.id }
  );

  const nextPost = {
    uid:
      responseNextPost.results_size > 0
        ? responseNextPost.results[0].uid
        : null,
    title:
      responseNextPost.results_size > 0
        ? responseNextPost.results[0].data.title
        : null,
  };

  const previousPost = {
    uid:
      responsePreviousPost.results_size > 0
        ? responsePreviousPost.results[0].uid
        : null,
    title:
      responsePreviousPost.results_size > 0
        ? responsePreviousPost.results[0].data.title
        : null,
  };

  const post: Post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: response.data.banner,
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
      preview,
      nextPost,
      previousPost,
    },
    revalidate: 60 * 30, // 30 minutos
  };
};
