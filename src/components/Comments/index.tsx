/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { useEffect, useRef } from 'react';

export default function Comments() {
  const ref = useRef();
  useEffect(() => {
    const divReference = document.getElementById('comments-section');

    const script = document.createElement('script');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('repo', 'giordanobraz/ignite-desafio-05');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'github-dark');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    divReference.appendChild(script);
  }, []);

  return <div ref={ref} id="comments-section" />;
}
