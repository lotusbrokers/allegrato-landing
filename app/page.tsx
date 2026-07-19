import { redirect } from 'next/navigation';

// A raiz redireciona para /lotus-home — espelha o index.html estático atual
// (que faz location.replace('/lotus-home/')).
export default function Home() {
  redirect('/lotus-home');
}
