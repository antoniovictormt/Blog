/* eslint-disable no-alert */
/* eslint-disable react/button-has-type */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import Head from 'next/head';
import { getPrismicClient } from '../services/prismic';
import styles from './home.module.scss';
import commonStyles from '../styles/common.module.scss';
import Preview from '../components/Preview';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({ postsPagination, preview }: HomeProps) {
  const { next_page, results } = postsPagination;
  const [posts, setPosts] = useState<Post[]>(results);
  const [nextPage, setNextPage] = useState<string>(next_page);

  function handlehandleLoadPostsClick() {
    if (next_page) {
      fetch(next_page)
        .then(res => res.json())
        .then(data => {
          const load = data.results.map((post: Post) => ({
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          }));
          setNextPage(data.next_page);
          setPosts([...posts, ...load]);
        })
        .catch(() => {
          alert('Erro!');
        });
    }
  }
  return (
    <>
      <Head>
        <title>spacetraveling | your trip inside my mind.</title>
      </Head>
      <section className={commonStyles.pages}>
        <main className={styles.main}>
          <div className={styles.posts}>
            {posts.map(post => (
              <Link key={post.uid} href={`/post/${post.uid}`}>
                <a>
                  <h1>{post.data.title}</h1>
                  <h2>{post.data.subtitle}</h2>

                  <div>
                    <span>
                      <FiCalendar />
                      {format(
                        new Date(post.first_publication_date),
                        'd MMM yyyy',
                        {
                          locale: ptBR,
                        }
                      )}
                    </span>
                    <span>
                      <FiUser />
                      {post.data.author}
                    </span>
                  </div>
                </a>
              </Link>
            ))}

            {nextPage && (
              <button onClick={handlehandleLoadPostsClick}>
                <a className={styles.carregarMais}>Carregar mais posts</a>
              </button>
            )}
          </div>
          {preview && <Preview />}
        </main>
      </section>
    </>
  );
}
export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 2,
      ref: previewData?.ref ?? null,
    }
  );

  const { next_page } = postsResponse;

  const posts: Post[] = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: post.data,
    };
  });

  return {
    props: {
      postsPagination: {
        next_page,
        results: posts,
      },
      preview,
    },
    revalidate: 60,
  };
};
